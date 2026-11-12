// AI drafting for ComplianceHub records. Output is always a draft for editor review:
// dates are returned only as suggestions with a verbatim quote, never written to public fields.
import type { Topic } from "./compliance.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export const TOPICS: Topic[] = ["aml_cft", "sanctions", "mica", "dora", "licensing", "regulatory_reporting", "payments", "prudential", "markets", "governance", "consumer_protection", "other"];
export const SECTORS = ["cysec_supervised", "banks", "investment_firms", "fund_managers", "crypto_asset_providers", "payment_emi", "insurance", "administrative_service_providers", "accountants_auditors", "lawyers", "gambling", "real_estate", "issuers", "all_obliged_entities", "general_public"];

export interface DateSuggestion { kind: "application" | "deadline" | "effective"; date: string; deadline_type: string | null; quote: string; quote_found?: boolean }
export interface ComplianceBrief {
  title_en: string; title_el: string; summary_en: string; summary_el: string;
  what_changed_en: string; what_changed_el: string; action_en: string; action_el: string;
  topics: Topic[]; sectors: string[]; audience: string; dates: DateSuggestion[];
}

const normalise = (s: string) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
/** True when the quote appears verbatim (ignoring case/whitespace/quote style) in the source text. */
export function quoteInText(quote: string, text: string): boolean {
  const q = normalise(quote);
  return q.length >= 6 && normalise(text).includes(q);
}

/** Gateway refused for a reason retries cannot fix (credits, policy, access) — stop the whole batch. */
export class AiBlocked extends Error { constructor(public status: number, message: string) { super(message); } }

const NOTE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["title_en", "title_el", "summary_en", "summary_el", "what_changed_en", "what_changed_el", "action_en", "action_el", "topics", "sectors", "audience", "dates"],
  properties: {
    title_en: { type: "string", description: "Plain English headline, sentence case, max 120 characters" },
    title_el: { type: "string" },
    summary_en: { type: "string", description: "2-3 sentences, max 70 words" },
    summary_el: { type: "string" },
    what_changed_en: { type: "string", description: "What is new or changed, as stated in the document; empty if not stated" },
    what_changed_el: { type: "string" },
    action_en: { type: "string", description: "Action explicitly required of firms, with any stated deadline; empty if none stated" },
    action_el: { type: "string" },
    topics: { type: "array", items: { type: "string", enum: TOPICS } },
    sectors: { type: "array", items: { type: "string", enum: SECTORS } },
    audience: { type: "string", description: "Who the document is addressed to, as stated; empty if not stated" },
    dates: { type: "array", items: { type: "object", additionalProperties: false, required: ["kind", "date", "deadline_type", "quote"], properties: {
      kind: { type: "string", enum: ["application", "deadline", "effective"] },
      date: { type: "string", description: "YYYY-MM-DD" },
      deadline_type: { type: ["string", "null"], enum: ["consultation_close", "filing", "application", "effective", "other", null] },
      quote: { type: "string", description: "Verbatim sentence fragment from the document stating this date" },
    } } },
  },
};

const INSTRUCTIONS = "You draft short, neutral editorial notes about official regulatory documents for compliance officers in Cyprus (ComplianceHub.cy). Use only facts stated in the supplied document. Never invent obligations, dates, deadlines or affected sectors. Write in your own words. If the document does not state what changed, an action, or a deadline, return an empty string or empty list for that field. Only list sectors the document actually addresses. Greek fields are faithful Greek translations of the English fields. For dates, include only dates explicitly stated in the document, each with a verbatim quote (max 200 characters) copied exactly from the document.";

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "", done = "";
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let ev: { type?: string; delta?: string; response?: { output?: { type: string; content?: { type: string; text?: string }[] }[]; error?: { message?: string } }; error?: { message?: string }; message?: string };
      try { ev = JSON.parse(payload); } catch { continue; }
      if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
      else if (ev.type === "response.completed") {
        done = (ev.response?.output ?? []).filter((o) => o.type === "message").flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("");
      } else if (ev.type === "response.failed" || ev.type === "error") {
        throw new Error(ev.response?.error?.message ?? ev.error?.message ?? ev.message ?? "AI response failed");
      }
    }
  }
  return done || text;
}

export async function draftBrief(input: { authority: string; officialTitle: string; documentType: string; text?: string | null; pdfBase64?: string | null }): Promise<ComplianceBrief | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new AiBlocked(401, "LOVABLE_API_KEY not configured");
  const content: Record<string, unknown>[] = [{ type: "input_text", text: `Authority: ${input.authority}\nOfficial title: ${input.officialTitle}\nDocument type: ${input.documentType}\n${input.text ? `Document text:\n${input.text.slice(0, 18000)}` : "(document attached as PDF)"}` }];
  if (input.pdfBase64) content.push({ type: "input_file", filename: "document.pdf", file_data: `data:application/pdf;base64,${input.pdfBase64}` });
  const body = JSON.stringify({
    model: MODEL, stream: true, store: false,
    reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"],
    input: [{ role: "system", content: INSTRUCTIONS }, { role: "user", content }],
    text: { format: { type: "json_schema", name: "compliance_note", strict: true, schema: NOTE_SCHEMA } },
  });
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(AI_URL, { method: "POST", headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" }, body });
    if (res.ok) break;
    const errText = (await res.text()).slice(0, 400);
    if (res.status === 402 || res.status === 403 || res.status === 401) throw new AiBlocked(res.status, errText);
    if (res.status !== 429 && res.status < 500) throw new Error(`AI ${res.status}: ${errText}`);
    const wait = Number(res.headers.get("retry-after")) * 1000 || (2 ** attempt) * 3000 + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, wait));
    res = null;
  }
  if (!res) throw new Error("AI temporarily unavailable");
  const raw = await readStream(res);
  let out: ComplianceBrief;
  try { out = JSON.parse(raw) as ComplianceBrief; } catch { return null; }
  out.topics = (out.topics ?? []).filter((t) => TOPICS.includes(t));
  out.sectors = (out.sectors ?? []).filter((s) => SECTORS.includes(s));
  out.dates = (out.dates ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !isNaN(Date.parse(d.date)))
    .map((d) => ({ ...d, quote_found: input.text ? quoteInText(d.quote, input.text) : undefined }));
  return out;
}
