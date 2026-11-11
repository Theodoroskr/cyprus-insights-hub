// Network helpers for Company Announcements (Firecrawl reads + AI summaries/extraction).
import { DEAL_TYPES, LISTED_TYPES, type AnnouncementType } from "./announcements.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
// Gemini reads PDF filings directly (exchange announcements are PDFs), matching the rest of the pipeline.
const MODEL = "google/gemini-3-flash-preview";

export async function firecrawlScrape(url: string, opts: { onlyMainContent?: boolean } = {}): Promise<{ ok: boolean; markdown: string; status?: number; error?: string }> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return { ok: false, markdown: "", error: "FIRECRAWL_API_KEY not configured" };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: opts.onlyMainContent ?? false, waitFor: 2000, timeout: 45000 }),
      signal: AbortSignal.timeout(55000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) return { ok: false, markdown: "", status: res.status, error: `${res.status}: ${String(data.error ?? data.code ?? "scrape failed").slice(0, 240)}` };
    const md = data.data?.markdown ?? data.markdown ?? "";
    return { ok: !!md, markdown: md, status: data.data?.metadata?.statusCode, error: md ? undefined : "Empty page" };
  } catch (e) {
    return { ok: false, markdown: "", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function firecrawlSearch(query: string, limit = 5): Promise<{ ok: boolean; results: { url: string; title: string; markdown: string }[]; error?: string }> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return { ok: false, results: [], error: "FIRECRAWL_API_KEY not configured" };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, tbs: "qdr:y", scrapeOptions: { formats: ["markdown"], onlyMainContent: true } }),
      signal: AbortSignal.timeout(90000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) return { ok: false, results: [], error: `${res.status}: ${String(data.error ?? "search failed").slice(0, 240)}` };
    return { ok: true, results: (data.data ?? []).map((r: { url: string; title?: string; markdown?: string; description?: string }) => ({ url: r.url, title: r.title ?? "", markdown: r.markdown ?? r.description ?? "" })) };
  } catch (e) {
    return { ok: false, results: [], error: e instanceof Error ? e.message : String(e) };
  }
}

// deno-lint-ignore no-explicit-any
async function callTool<T>(messages: any[], name: string, parameters: Record<string, unknown>): Promise<T | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, messages,
      tools: [{ type: "function", function: { name, description: name, parameters } }],
      tool_choice: { type: "function", function: { name } },
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) { console.error("AI error", res.status, (await res.text()).slice(0, 300)); return null; }
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try { return args ? JSON.parse(args) as T : null; } catch { return null; }
}

export type ListedItem = { title: string; date: string | null; url: string | null; language: string | null };

/** Read an issuer's investor-relations list page into dated announcements */
export async function extractIssuerList(markdown: string, company: string, pageUrl: string): Promise<ListedItem[]> {
  const out = await callTool<{ items: ListedItem[] }>([
    { role: "system", content: `You read an investor-relations announcements page for ${company} (${pageUrl}). List every dated announcement visible on the page. Use the absolute document or page URL for each (resolve relative links against ${pageUrl}). If an item has both English and Greek files, return one item with the English URL. Dates as YYYY-MM-DD. Never invent items.` },
    { role: "user", content: markdown.slice(0, 40000) },
  ], "list_announcements", {
    type: "object", additionalProperties: false, required: ["items"],
    properties: { items: { type: "array", items: { type: "object", required: ["title", "date", "url", "language"], properties: { title: { type: "string" }, date: { type: ["string", "null"] }, url: { type: ["string", "null"] }, language: { type: ["string", "null"], description: "en or el" } } } } },
  });
  return out?.items ?? [];
}

export type DisclosureSummary = { headline: string; summary: string; announcement_type: AnnouncementType; event_date: string | null; tags: string[] };

/** BusinessHub's own short summary of a filing; the PDF (base64) is read directly when available */
export async function summariseDisclosure(input: { company: string; title: string; category?: string | null; text?: string | null; pdfBase64?: string | null; currentType: AnnouncementType }): Promise<DisclosureSummary | null> {
  // deno-lint-ignore no-explicit-any
  const content: any[] = [{ type: "text", text: `Company: ${input.company}\nFiling title: ${input.title}\nExchange category: ${input.category ?? "n/a"}\nCurrent type: ${input.currentType}\n${input.text ? `Text:\n${input.text.slice(0, 8000)}` : ""}` }];
  if (input.pdfBase64) content.push({ type: "file", file: { filename: "filing.pdf", file_data: `data:application/pdf;base64,${input.pdfBase64}` } });
  return await callTool<DisclosureSummary>([
    { role: "system", content: "You write short news briefs for BusinessHub.cy about Cyprus-listed company filings. Write in English, in your own words (never copy sentences), neutral and factual, no investment advice. Use only facts in the supplied filing text or PDF — never guess. If neither text nor a PDF is supplied, the summary may only restate what the title says, with no figures. Include the key disclosed figures (amounts with their original currency, per-share values, dates, names of appointees or holders)." },
    { role: "user", content },
  ], "write_brief", {
    type: "object", additionalProperties: false, required: ["headline", "summary", "announcement_type", "event_date", "tags"],
    properties: {
      headline: { type: "string", description: "Clear English headline, sentence case, max 110 characters, starting with the company's short name" },
      summary: { type: "string", description: "2-3 sentences, max 70 words" },
      announcement_type: { type: "string", enum: LISTED_TYPES },
      event_date: { type: ["string", "null"], description: "Date the event takes effect or occurred if the filing states one (YYYY-MM-DD), else null" },
      tags: { type: "array", items: { type: "string" }, description: "2-4 short topic tags" },
    },
  });
}

export type DealCandidate = { title: string; url: string | null; date: string | null; reason: string };

/** From a news listing page, pick headlines that look like specific Cyprus deals */
export async function extractDealCandidates(markdown: string, sourceName: string, pageUrl: string): Promise<DealCandidate[]> {
  const out = await callTool<{ items: DealCandidate[] }>([
    { role: "system", content: `You scan the news listing page "${sourceName}" (${pageUrl}). Return ONLY headlines that report a specific, publicly announced funding round, strategic investment, acquisition, or significant project/expansion connected to Cyprus (a Cyprus-listed, Cyprus-based or Cyprus-founded company, or an investment made in Cyprus). Exclude trade forums, conferences, MoUs, expressions of interest, routine partnerships, policy news, awards, market commentary. Absolute URLs only. Dates as YYYY-MM-DD. Return an empty list when nothing qualifies.` },
    { role: "user", content: markdown.slice(0, 40000) },
  ], "list_deals", {
    type: "object", additionalProperties: false, required: ["items"],
    properties: { items: { type: "array", items: { type: "object", required: ["title", "url", "date", "reason"], properties: { title: { type: "string" }, url: { type: ["string", "null"] }, date: { type: ["string", "null"] }, reason: { type: "string" } } } } },
  });
  return out?.items ?? [];
}

export type DealDetails = {
  qualifies: boolean;
  reason: string;
  company_name: string;
  announcement_type: AnnouncementType;
  headline: string;
  summary: string;
  original_title: string;
  source_language: string;
  event_date: string | null;
  amount: number | null;
  currency: string | null;
  investors: string[];
  buyer: string | null;
  deal_stage: "announced" | "signed" | "completed" | "cancelled" | null;
  cyprus_location: string | null;
  cyprus_tags: string[];
  sector: string | null;
  primary_source_url: string | null;
};

/** Read one article and pull out the deal facts (or say it does not qualify) */
export async function extractDealDetails(input: { title: string; url: string; markdown: string; companyHint?: string | null }): Promise<DealDetails | null> {
  return await callTool<DealDetails>([
    { role: "system", content: `You extract deal facts for BusinessHub.cy's "Funding & Investment Deals" list. A qualifying item is a specific, publicly announced funding round, strategic investment, acquisition, or significant project/expansion connected to Cyprus. Trade forums, MoUs, expressions of interest and routine partnerships do NOT qualify unless the text confirms a specific investment or transaction. Use only facts stated in the text; use null when not disclosed — never estimate an amount. Keep the original currency (ISO code like EUR, USD, GBP). Amount as a plain number in units (e.g. 12500000). Write the summary in English in your own words (2-3 sentences, max 70 words). primary_source_url: a link in the text to the company's, investor's, exchange's or an official announcement of this deal, else null.${input.companyHint ? ` The search was about: ${input.companyHint}.` : ""}` },
    { role: "user", content: `Title: ${input.title}\nURL: ${input.url}\n\n${input.markdown.slice(0, 12000)}` },
  ], "extract_deal", {
    type: "object", additionalProperties: false,
    required: ["qualifies", "reason", "company_name", "announcement_type", "headline", "summary", "original_title", "source_language", "event_date", "amount", "currency", "investors", "buyer", "deal_stage", "cyprus_location", "cyprus_tags", "sector", "primary_source_url"],
    properties: {
      qualifies: { type: "boolean" }, reason: { type: "string" },
      company_name: { type: "string", description: "The company raising money, being acquired, or carrying out the project" },
      announcement_type: { type: "string", enum: DEAL_TYPES },
      headline: { type: "string", description: "English headline, max 110 characters" },
      summary: { type: "string" },
      original_title: { type: "string" },
      source_language: { type: "string", enum: ["en", "el", "other"] },
      event_date: { type: ["string", "null"] },
      amount: { type: ["number", "null"] }, currency: { type: ["string", "null"] },
      investors: { type: "array", items: { type: "string" } },
      buyer: { type: ["string", "null"] },
      deal_stage: { type: ["string", "null"], enum: ["announced", "signed", "completed", "cancelled", null] },
      cyprus_location: { type: ["string", "null"], description: "Town/district in Cyprus if stated" },
      cyprus_tags: { type: "array", items: { type: "string", enum: ["listed_in_cyprus", "based_in_cyprus", "founded_in_cyprus", "investing_in_cyprus"] } },
      sector: { type: ["string", "null"] },
      primary_source_url: { type: ["string", "null"] },
    },
  });
}
