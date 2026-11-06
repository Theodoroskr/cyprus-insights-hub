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

const CSE_PRICES_URL = "https://www.cse.com.cy/en-GB/regulated-market/market-indices/closing-prices/";

function num(s: string): number {
  return Number(s.replace(/[,%\s]/g, ""));
}

const clean = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// Reads the closing-prices table by its header names (falls back to the known layout:
// Code | Currency | Open | High | Low | Last | Previous | Change | Change % | ...)
export function parseCseRows(html: string): Map<string, { value: number; change_pct: number }> {
  const out = new Map<string, { value: number; change_pct: number }>();
  let col = { code: 0, last: 5, prev: 6, pct: 8 };
  const header = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => clean(m[1]).toLowerCase());
  if (header.length >= 6) {
    const find = (re: RegExp) => header.findIndex((h) => re.test(h));
    const last = find(/^(last|closing|close)/), prev = find(/^prev/), pct = find(/%/);
    if (last >= 0 && prev >= 0) col = { code: Math.max(0, find(/code|symbol/)), last, prev, pct };
  }
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => clean(m[1]));
    if (cells.length <= Math.max(col.last, col.prev)) continue;
    const code = cells[col.code].replace(/\(.*\)/, "").trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(code)) continue;
    const last = num(cells[col.last]);
    const prev = num(cells[col.prev]);
    const pct = col.pct >= 0 ? num(cells[col.pct] ?? "") : NaN;
    const value = last > 0 ? last : prev; // not traded today → previous close
    if (!Number.isFinite(value) || value <= 0) continue;
    const change = last > 0 && Number.isFinite(pct) ? pct : last > 0 && prev > 0 ? ((last - prev) / prev) * 100 : 0;
    out.set(code, { value, change_pct: Math.round(change * 100) / 100 });
  }
  return out;
}

async function fetchCsePage(): Promise<string> {
  let lastErr = "";
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(CSE_PRICES_URL, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BusinessHubBot/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return await res.text();
      lastErr = `CSE prices page ${res.status}`;
    } catch (e) { lastErr = (e as Error).message; }
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(lastErr);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    // 2. CSE closing prices — public HTML table, parsed directly (no credits/AI)
    let cseError: string | null = null;
    try {
      {
        const rows = parseCseRows(await fetchCsePage());
        if (rows.size === 0) throw new Error("CSE table layout changed — no rows parsed (previous prices kept)");
        for (const sym of CSE_SYMBOLS) {
          const r = rows.get(sym);
          if (r) updates.push({ symbol: sym, value: r.value, change_pct: r.change_pct, source: "cse.com.cy" });
          else perSymbolErrors.set(sym, "Not found on CSE closing prices page (previous price kept)");
        }
      }
    } catch (e) {
      cseError = `CSE: ${(e as Error).message}`;
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
