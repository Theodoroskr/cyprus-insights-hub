import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Vertical classification keywords
const VERTICAL_KEYWORDS: Record<string, string[]> = {
  compliance: [
    "aml", "kyc", "sanctions", "central bank", "regulatory", "mica", "psd2",
    "psd3", "amla", "fatf", "anti-money laundering", "compliance", "cysec",
    "cbcyprus", "anti-corruption", "transparency", "directive", "regulation",
    "supervision", "enforcement", "penalty", "fine", "licence", "license",
    "due diligence", "risk assessment", "money laundering", "terrorism financing",
  ],
  fintech: [
    "fintech", "blockchain", "cryptocurrency", "crypto", "digital payments",
    "payment services", "neobank", "digital banking", "startup", "venture capital",
    "innovation", "technology", "api", "open banking", "e-money", "emoney",
    "digital wallet", "defi", "nft", "tokenization", "regtech", "insurtech",
    "crowdfunding", "lending platform", "digital assets",
  ],
  sme: [
    "sme", "small business", "entrepreneurship", "vat", "tax", "gdpr",
    "eu funding", "grants", "subsidies", "digital transformation", "exports",
    "imports", "trade", "employment", "hiring", "workforce", "tourism",
    "hospitality", "real estate", "construction", "agriculture", "manufacturing",
    "retail", "commerce", "business registration", "chambers of commerce",
  ],
};

function classifyVertical(title: string, body: string): string {
  const text = `${title} ${body}`.toLowerCase();
  const scores: Record<string, number> = { compliance: 0, fintech: 0, sme: 0 };

  for (const [vertical, keywords] of Object.entries(VERTICAL_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) scores[vertical]++;
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "general";
}

async function enrichWithAI(
  title: string,
  body: string,
  vertical: string,
  apiKey: string
): Promise<{
  what_happened: string;
  why_it_matters: string;
  what_to_do: string;
  summary: string;
  tags: string[];
}> {
  const systemPrompt = `You are an intelligence analyst for BusinessHub.cy, a decision intelligence platform for Cyprus business professionals.
Given a news article, produce a structured intelligence card with EXACTLY these fields:
1. what_happened — 1-2 concise sentences about the core event/announcement
2. why_it_matters — 2-3 sentences explaining business impact for Cyprus professionals in the ${vertical} sector
3. what_to_do — 1-2 actionable recommendations for affected professionals
4. summary — A 1-sentence executive summary (max 30 words)
5. tags — 3-5 keyword tags relevant to the article

IMPORTANT: Ignore any cookie banners, privacy notices, navigation menus, "you may also like" sections, language selectors, feedback widgets, or other website boilerplate in the input. Focus ONLY on the actual article content.
Write in a professional, authoritative tone. Be specific about Cyprus implications.`;

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Title: ${title}\n\nArticle:\n${body}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_intelligence_card",
              description: "Create a structured intelligence card from a news article",
              parameters: {
                type: "object",
                properties: {
                  what_happened: { type: "string" },
                  why_it_matters: { type: "string" },
                  what_to_do: { type: "string" },
                  summary: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                },
                required: ["what_happened", "why_it_matters", "what_to_do", "summary", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_intelligence_card" } },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    // Fallback: use the title/body directly
    return {
      what_happened: title,
      why_it_matters: "This development may impact Cyprus businesses. Review the full article for details.",
      what_to_do: "Monitor developments and consult with relevant advisors.",
      summary: title.slice(0, 100),
      tags: [vertical],
    };
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  // Fallback
  return {
    what_happened: title,
    why_it_matters: "This development may impact Cyprus businesses.",
    what_to_do: "Monitor developments and consult with relevant advisors.",
    summary: title.slice(0, 100),
    tags: [vertical],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { articles } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide an array of articles with title, body, source_url, and optionally image_url and source_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const article of articles) {
      const { title, body, source_url, image_url, source_id } = article;

      if (!title || !body) {
        results.push({ title, error: "Missing title or body" });
        continue;
      }

      // Check for duplicate
      if (source_id) {
        const { data: existing } = await supabase
          .from("cna_articles")
          .select("id")
          .eq("source_id", source_id)
          .maybeSingle();

        if (existing) {
          results.push({ title, skipped: true, reason: "duplicate" });
          continue;
        }
      }

      // Classify vertical
      const vertical = classifyVertical(title, body);

      // Enrich with AI
      const intelligence = await enrichWithAI(title, body, vertical, LOVABLE_API_KEY);

      // Insert into database
      const { data: inserted, error: insertError } = await supabase
        .from("cna_articles")
        .insert({
          title,
          body_markdown: body,
          source_url,
          image_url: image_url || null,
          source_id: source_id || null,
          vertical,
          summary: intelligence.summary,
          what_happened: intelligence.what_happened,
          why_it_matters: intelligence.why_it_matters,
          what_to_do: intelligence.what_to_do,
          tags: intelligence.tags,
          status: "published",
          published_at: new Date().toISOString(),
        })
        .select("id, title, vertical")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        results.push({ title, error: insertError.message });
      } else {
        results.push({ ...inserted, enriched: true });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Ingestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
