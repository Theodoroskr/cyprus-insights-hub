import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Vertical classification keywords (shared with ingest-cna)
const VERTICAL_KEYWORDS: Record<string, string[]> = {
  compliance: [
    "aml", "kyc", "sanctions", "central bank", "regulatory", "mica", "psd2",
    "psd3", "amla", "fatf", "anti-money laundering", "compliance", "cysec",
    "cbcyprus", "directive", "regulation", "supervision", "enforcement",
    "penalty", "fine", "licence", "license", "due diligence", "risk assessment",
  ],
  fintech: [
    "fintech", "blockchain", "cryptocurrency", "crypto", "digital payments",
    "neobank", "digital banking", "startup", "venture capital", "innovation",
    "technology", "open banking", "e-money", "digital wallet", "defi",
    "tokenization", "regtech", "crowdfunding", "digital assets",
  ],
  sme: [
    "sme", "small business", "entrepreneurship", "vat", "tax", "gdpr",
    "eu funding", "grants", "subsidies", "digital transformation", "exports",
    "trade", "employment", "tourism", "real estate", "construction",
  ],
};

function classifyVertical(title: string, body: string, sourceVertical: string): string {
  if (sourceVertical && sourceVertical !== "general") return sourceVertical;
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

Write in a professional, authoritative tone. Be specific about Cyprus implications.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Title: ${title}\n\nArticle:\n${body.slice(0, 3000)}` },
        ],
        tools: [{
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
        }],
        tool_choice: { type: "function", function: { name: "create_intelligence_card" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return fallbackEnrichment(title, vertical);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
    return fallbackEnrichment(title, vertical);
  } catch (e) {
    console.error("AI enrichment failed:", e);
    return fallbackEnrichment(title, vertical);
  }
}

function fallbackEnrichment(title: string, vertical: string) {
  return {
    what_happened: title,
    why_it_matters: "This development may impact Cyprus businesses.",
    what_to_do: "Monitor developments and consult with relevant advisors.",
    summary: title.slice(0, 100),
    tags: [vertical],
  };
}

// Extract article-like items from scraped markdown using AI
async function extractArticles(
  markdown: string,
  sourceName: string,
  sourceUrl: string,
  apiKey: string
): Promise<Array<{ title: string; body: string; source_url: string; image_url?: string }>> {
  const systemPrompt = `You are a content extraction system. Given scraped markdown from the website "${sourceName}" (${sourceUrl}), extract distinct news articles, press releases, announcements, or publications.

For each item, extract:
- title: The headline or title (clean it up if needed)
- body: The full text content, summary, or description
- url: The full URL to the original article (construct from relative links if needed, base: ${sourceUrl})
- image_url: Any associated image URL found near the article (look for markdown image syntax ![](url) or linked images). Must be an absolute URL starting with http. If no image found, omit this field.

Extract the most recent items visible on the page. If dates are visible, prefer recent ones, but DO NOT skip items just because you can't confirm their date — extract them anyway.
Skip navigation elements, footers, cookie banners, sidebar widgets, and repeated boilerplate.
If no distinct articles can be identified, return an empty array.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: markdown.slice(0, 8000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_articles",
            description: "Extract news articles from scraped content",
            parameters: {
              type: "object",
              properties: {
                articles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      body: { type: "string" },
                      url: { type: "string" },
                      image_url: { type: "string" },
                    },
                    required: ["title", "body"],
                  },
                },
              },
              required: ["articles"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_articles" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI extraction error:", response.status, errText);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.articles || [];
    }
    return [];
  } catch (e) {
    console.error("Article extraction failed:", e);
    return [];
  }
}

// Strip common boilerplate patterns from scraped markdown
function cleanBoilerplate(text: string): string {
  let cleaned = text;

  // Remove "Skip to main content" links
  cleaned = cleaned.replace(/\[Skip to main content\]\([^)]+\)\s*/gi, "");

  // Remove cookie consent / privacy blocks (multi-line)
  cleaned = cleaned.replace(/(?:^|\n).*?(?:We (?:use|may place) some (?:essential )?cookies)[\s\S]*?(?:Accept|Reject|Adjust)\s*(?:\n|$)/gi, "\n");
  cleaned = cleaned.replace(/(?:^|\n).*?(?:Cookies on [\w.]+)[\s\S]*?(?:Accept|Reject|Adjust)\s*(?:\n|$)/gi, "\n");
  cleaned = cleaned.replace(/(?:^|\n).*?(?:cookie|privacy settings|accept all cookies|withdraw consent|save preferences|more info).*(?:\n|$)/gi, "");

  // Remove gov.cy / EU site chrome: "From:" attribution blocks
  cleaned = cleaned.replace(/\n\s*From:\s*\n[\s\S]*?(?=\n##|\n#[^#]|\n\n[A-Z])/i, "\n");

  // Remove "Share this page" blocks with social links
  cleaned = cleaned.replace(/(?:^|\n)\s*Share this page\s*\n(?:\s*(?:Twitter|Facebook|LinkedIn|Email|Close|X)\s*\n)*/gi, "\n");

  // Remove disclaimer/translation blocks
  cleaned = cleaned.replace(/(?:^|\n)\s*Disclaimer\s*\n.*?(?:machine translation|eTranslation).*?(?:\n\n|\n$)/gis, "\n");
  cleaned = cleaned.replace(/(?:^|\n)\s*Select language below\s*\n.*?(?:Accept and continue|Save preferences)/gis, "");

  // Remove language selector lists (long lists of European language names)
  cleaned = cleaned.replace(/(?:^|\n)(?:\s*(?:български|español|čeština|dansk|Deutsch|eesti|ελληνικά|English|français|Gaeilge|hrvatski|italiano|latviešu|lietuvių|magyar|Malti|Nederlands|polski|português|română|slovenčina|slovenščina|suomi|svenska|русский|Українська)[\s|—]*)+(?:\n|$)/gi, "\n");

  // Remove "You may also like/be interested in" sections and everything after
  cleaned = cleaned.replace(/\n\s*(?:You may (?:also (?:like|be interested in))|Related (?:articles|content|stories))[\s\S]*$/i, "");

  // Remove "About this page" metadata blocks
  cleaned = cleaned.replace(/\n\s*About this page\s*\n[\s\S]*?(?=\n##|\n#[^#]|$)/i, "");

  // Remove "Is this page helpful" feedback widgets
  cleaned = cleaned.replace(/\n\s*Is this page helpful\s*\??\s*\n(?:\s*(?:Yes|No|Thank you)\s*!?\s*\n?)*/gi, "\n");

  // Remove "Read the factsheet / Read the full report / Press Release" link lines
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:Read the (?:factsheet|full report)|Press Release)\s*(?:\n|$)/gi, "\n");

  // Remove lines that are just "Subject" or "Audience" or "Tags" followed by single-word lines
  cleaned = cleaned.replace(/\n\s*(?:Subject|Audience|Tags)\s*\n(?:\s*\w[\w\s]*\n)*/gi, "\n");

  // Remove navigation breadcrumbs (e.g. "Home > News > ...")
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:Home\s*[>›»][\s\S]*?)(?:\n\n)/gi, "\n");

  // Remove footer-like blocks
  cleaned = cleaned.replace(/\n\s*(?:©|Copyright|All rights reserved)[\s\S]*$/i, "");

  // Collapse excessive blank lines
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");

  return cleaned.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optionally accept a specific source slug
    let targetSlug: string | null = null;
    try {
      const body = await req.json();
      targetSlug = body?.slug || null;
    } catch {
      // No body — scrape all active sources
    }

    // Fetch active sources
    let query = supabase
      .from("content_sources")
      .select("*")
      .eq("active", true);

    if (targetSlug) {
      query = query.eq("slug", targetSlug);
    }

    const { data: sources, error: srcError } = await query;
    if (srcError) throw new Error(`Failed to fetch sources: ${srcError.message}`);
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active sources to scrape" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allResults: Array<{ source: string; articles_found: number; articles_ingested: number; errors: string[] }> = [];

    for (const source of sources) {
      const sourceResult = { source: source.name, articles_found: 0, articles_ingested: 0, errors: [] as string[] };
      
      try {
        console.log(`Scraping: ${source.name} — ${source.url}${source.scrape_path}`);

        // Scrape via Firecrawl
        const scrapeUrl = `${source.url}${source.scrape_path}`;
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: scrapeUrl,
            formats: ["markdown", "links"],
            onlyMainContent: false,
            waitFor: 5000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errBody = await scrapeResponse.text();
          sourceResult.errors.push(`Scrape failed [${scrapeResponse.status}]: ${errBody.slice(0, 200)}`);
          allResults.push(sourceResult);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

        if (!markdown || markdown.length < 100) {
          sourceResult.errors.push("No meaningful content scraped");
          allResults.push(sourceResult);
          continue;
        }

        // Extract articles using AI
        const articles = await extractArticles(markdown, source.name, source.url, LOVABLE_API_KEY);
        sourceResult.articles_found = articles.length;

        // Ingest each article
        for (const article of articles) {
          if (!article.title || article.title.length < 10) continue;

          // Generate a source_id from title hash to prevent duplicates
          const sourceId = `${source.slug}:${article.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60)}`;

          // Check for duplicate
          const { data: existing } = await supabase
            .from("cna_articles")
            .select("id")
            .eq("source_id", sourceId)
            .maybeSingle();

          if (existing) continue;

          // --- Deep scrape: fetch the full article page ---
          let fullBody = article.body || "";
          let articleImageUrl = article.image_url || null;

          if (article.url && article.url.startsWith("http")) {
            try {
              console.log(`  Deep-scraping article: ${article.url}`);
              const articleScrape = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: article.url,
                  formats: ["markdown"],
                  onlyMainContent: true,
                  waitFor: 3000,
                }),
              });

              if (articleScrape.ok) {
                const articleData = await articleScrape.json();
                let articleMarkdown = articleData.data?.markdown || articleData.markdown || "";
                // Clean boilerplate from scraped content
                articleMarkdown = cleanBoilerplate(articleMarkdown);
                // Only use the deep-scraped content if it's meaningfully longer than the snippet
                if (articleMarkdown.length > fullBody.length + 50) {
                  fullBody = articleMarkdown;
                  console.log(`  Got full article: ${articleMarkdown.length} chars`);
                }
                // Try to grab the article image from metadata if we don't have one
                if (!articleImageUrl) {
                  const meta = articleData.data?.metadata || articleData.metadata;
                  articleImageUrl = meta?.ogImage || meta?.image || null;
                }
              } else {
                console.warn(`  Deep-scrape failed [${articleScrape.status}] for ${article.url}`);
              }
            } catch (deepErr) {
              console.warn(`  Deep-scrape error for ${article.url}:`, deepErr);
            }
          }

          // Clean the final body content
          fullBody = cleanBoilerplate(fullBody);

          // Classify and enrich using the full body
          const vertical = classifyVertical(article.title, fullBody, source.target_vertical);
          const intelligence = await enrichWithAI(article.title, fullBody, vertical, LOVABLE_API_KEY);

          // Determine publish status based on trust level
          const status = source.auto_publish ? "published" : "draft";

          const { error: insertError } = await supabase
            .from("cna_articles")
            .insert({
              title: article.title,
              body_markdown: fullBody,
              source_url: article.url || `${source.url}${source.scrape_path}`,
              source_id: sourceId,
              image_url: articleImageUrl,
              vertical,
              summary: intelligence.summary,
              what_happened: intelligence.what_happened,
              why_it_matters: intelligence.why_it_matters,
              what_to_do: intelligence.what_to_do,
              tags: [...intelligence.tags, source.slug, source.category],
              status,
              published_at: status === "published" ? new Date().toISOString() : null,
            });

          if (insertError) {
            sourceResult.errors.push(`Insert failed for "${article.title.slice(0, 40)}": ${insertError.message}`);
          } else {
            sourceResult.articles_ingested++;
          }
        }

        // Update last_scraped_at
        await supabase
          .from("content_sources")
          .update({ last_scraped_at: new Date().toISOString() })
          .eq("id", source.id);

      } catch (e) {
        sourceResult.errors.push(e instanceof Error ? e.message : "Unknown error");
      }

      allResults.push(sourceResult);
    }

    const totalIngested = allResults.reduce((s, r) => s + r.articles_ingested, 0);
    const totalFound = allResults.reduce((s, r) => s + r.articles_found, 0);

    console.log(`Scrape complete: ${totalFound} found, ${totalIngested} ingested from ${sources.length} sources`);

    return new Response(
      JSON.stringify({
        success: true,
        sources_scraped: sources.length,
        total_found: totalFound,
        total_ingested: totalIngested,
        results: allResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Scrape sources error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
