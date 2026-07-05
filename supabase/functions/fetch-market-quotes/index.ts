import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Yahoo Finance tickers for FX + commodities (public, no key needed)
const YAHOO_TICKERS: Record<string, string> = {
  EURUSD: "EURUSD=X",
  BRENT: "BZ=F",
  GOLD: "GC=F",
};

// CSE equity symbols we track (must match rows in market_quotes)
const CSE_SYMBOLS = ["BOCH", "DEM", "EUROBCY", "ATL", "LUI", "KEO", "LOG", "CCC"];

async function fetchYahoo(ticker: string): Promise<{ value: number; change_pct: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; BusinessHubBot/1.0)" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = Number(meta.regularMarketPrice);
    const prev = Number(meta.chartPreviousClose ?? meta.previousClose);
    if (!Number.isFinite(price) || !Number.isFinite(prev) || prev === 0) return null;
    return { value: price, change_pct: ((price - prev) / prev) * 100 };
  } catch (e) {
    console.warn(`Yahoo fetch failed for ${ticker}:`, e);
    return null;
  }
}

async function extractCseQuotes(
  markdown: string,
  apiKey: string,
): Promise<Array<{ symbol: string; value: number; change_pct: number }>> {
  const systemPrompt = `You extract Cyprus Stock Exchange (CSE) quotes from scraped market data.
Given the markdown, return an array of quotes. For each of the requested tickers, output the current price and the daily change percentage.
Only include tickers you actually see in the input. Prices are in EUR. Change is a percentage (e.g. -2.53 for -2.53%). Skip anything you can't confidently parse.
Requested tickers: ${CSE_SYMBOLS.join(", ")}.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: markdown.slice(0, 12000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_quotes",
            description: "Return parsed CSE quotes",
            parameters: {
              type: "object",
              properties: {
                quotes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      value: { type: "number" },
                      change_pct: { type: "number" },
                    },
                    required: ["symbol", "value", "change_pct"],
                  },
                },
              },
              required: ["quotes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_quotes" } },
      }),
    });
    if (!response.ok) {
      console.error("AI extract error", response.status, await response.text());
      return [];
    }
    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return [];
    const parsed = JSON.parse(args);
    return (parsed.quotes || []).filter((q: any) =>
      CSE_SYMBOLS.includes(String(q.symbol).toUpperCase()) &&
      Number.isFinite(q.value) &&
      Number.isFinite(q.change_pct)
    );
  } catch (e) {
    console.error("CSE extract failed:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const updates: Array<{ symbol: string; value: number; change_pct: number; source: string }> = [];
    const perSymbolErrors = new Map<string, string>();
    const globalErrors: string[] = [];

    // 1. Yahoo — FX & commodities
    for (const [symbol, ticker] of Object.entries(YAHOO_TICKERS)) {
      const q = await fetchYahoo(ticker);
      if (q) updates.push({ symbol, ...q, source: "yahoo" });
      else perSymbolErrors.set(symbol, `Yahoo fetch failed for ${ticker}`);
    }

    // 2. Firecrawl + AI — CSE main market (one call yields many equity rows)
    let cseError: string | null = null;
    if (FIRECRAWL_API_KEY && LOVABLE_API_KEY) {
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: "https://www.cse.com.cy/en/market-data/securities/main-market",
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 4000,
          }),
        });
        if (scrapeRes.ok) {
          const scraped = await scrapeRes.json();
          const md = scraped.data?.markdown || scraped.markdown || "";
          if (md.length > 200) {
            const quotes = await extractCseQuotes(md, LOVABLE_API_KEY);
            const seen = new Set<string>();
            for (const q of quotes) {
              const sym = q.symbol.toUpperCase();
              seen.add(sym);
              updates.push({ symbol: sym, value: q.value, change_pct: q.change_pct, source: "cse.com.cy" });
            }
            // Symbols we track but didn't find in the scrape get a per-symbol error
            for (const sym of CSE_SYMBOLS) {
              if (!seen.has(sym)) perSymbolErrors.set(sym, "Not found in CSE scrape");
            }
          } else {
            cseError = "CSE scrape returned empty markdown";
          }
        } else {
          cseError = `CSE scrape ${scrapeRes.status}: ${(await scrapeRes.text()).slice(0, 200)}`;
        }
      } catch (e) {
        cseError = `CSE: ${(e as Error).message}`;
      }
    } else {
      cseError = "CSE skipped (missing FIRECRAWL_API_KEY or LOVABLE_API_KEY)";
    }
    if (cseError) {
      globalErrors.push(cseError);
      for (const sym of CSE_SYMBOLS) {
        if (!perSymbolErrors.has(sym)) perSymbolErrors.set(sym, cseError);
      }
    }

    const successfulSymbols = new Set(updates.map((u) => u.symbol));

    // 3. Write successful updates (clears error) and error-only rows
    let written = 0;
    const nowIso = new Date().toISOString();

    for (const u of updates) {
      const { error } = await supabase
        .from("market_quotes")
        .update({
          value: u.value,
          change_pct: u.change_pct,
          source: u.source,
          last_error: null,
          last_error_at: null,
          updated_at: nowIso,
        })
        .eq("symbol", u.symbol);
      if (error) globalErrors.push(`upsert:${u.symbol}:${error.message}`);
      else written++;
    }

    for (const [symbol, msg] of perSymbolErrors) {
      if (successfulSymbols.has(symbol)) continue;
      await supabase
        .from("market_quotes")
        .update({ last_error: msg, last_error_at: nowIso })
        .eq("symbol", symbol);
    }

    console.log(`Market quotes: ${written} updated, ${perSymbolErrors.size - written} errored`);
    return new Response(
      JSON.stringify({
        success: true,
        updated: written,
        attempted: updates.length,
        symbol_errors: Object.fromEntries(perSymbolErrors),
        errors: globalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("fetch-market-quotes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
