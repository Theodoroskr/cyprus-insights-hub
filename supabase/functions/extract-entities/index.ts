// Links news articles to companies and people, and classifies the business event.
// Matching rules:
//  - Registration number, official/curated alias (also with "Cyprus"/city/branch suffixes) or a single
//    specific registry name -> auto-approved company link (see _shared/companyMatcher.ts)
//  - Ambiguous names -> pending link + review task
//  - People are never auto-merged: every person match goes to review
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { resolveCompanies } from "../_shared/companyMatcher.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";

const EVENT_TYPES = [
  "executive_appointment", "board_appointment", "investment", "merger_acquisition", "partnership",
  "expansion", "financial_results", "government_tender", "regulatory_action", "licence_update",
  "funding_grant", "corporate_restructuring", "other_business_news",
];
const SENSITIVE = new Set(["regulatory_action"]);

type Extracted = {
  event_type: string;
  event_title: string;
  cyprus_relevant: boolean;
  companies: Array<{ name: string; registration_no?: string }>;
  people: Array<{ name: string; role?: string; company?: string }>;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["event_type", "event_title", "cyprus_relevant", "companies", "people"],
  properties: {
    event_type: { type: "string", enum: EVENT_TYPES },
    event_title: { type: "string" },
    cyprus_relevant: { type: "boolean" },
    companies: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "registration_no"], properties: { name: { type: "string" }, registration_no: { type: ["string", "null"] } } } },
    people: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "role", "company"], properties: { name: { type: "string" }, role: { type: ["string", "null"] }, company: { type: ["string", "null"] } } } },
  },
};

async function extract(title: string, body: string, key: string): Promise<Extracted | null> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: "You extract factual business entities from Cyprus business news as JSON. Only list organisations and people explicitly named. registration_no is a Cyprus HE number only if printed in the text, else null. event_title is one factual sentence. Never infer wrongdoing.",
      input: `Title: ${title}\n\n${body.slice(0, 6000)}`,
      text: { format: { type: "json_schema", name: "entities", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    console.error("AI error", res.status, await res.text());
    return null;
  }
  // Read the SSE stream and collect the output text
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta;
      } catch { /* ignore partial */ }
    }
  }
  try { return text ? JSON.parse(text) : null; } catch { console.error("Bad JSON", text.slice(0, 200)); return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const caller = await requireTrustedCaller(req, supabase);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    let limit = 15;
    try { const b = await req.json(); if (b?.limit) limit = Math.min(Math.max(Number(b.limit), 1), 50); } catch { /* default */ }

    const { data: articles, error } = await supabase
      .from("cna_articles")
      .select("id, title, body_markdown, summary, source_url, published_at, created_at")
      .is("entities_extracted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    let links = 0, reviews = 0, events = 0;
    for (const a of articles || []) {
      const ex = await extract(a.title, a.body_markdown || a.summary || "", key);
      await supabase.from("cna_articles").update({
        entities_extracted_at: new Date().toISOString(),
        event_type: ex?.event_type ?? null,
      }).eq("id", a.id);
      if (!ex) continue;

      let primaryCompany: { directory_company_id?: string; company_id?: string } | null = null;

      const comps = (ex.companies || []).slice(0, 8)
        .map((c) => ({ name: c.name?.trim() || "", registration_no: c.registration_no }))
        .filter((c) => c.name.length >= 3);
      // Registration number → alias (incl. "Cyprus"/city/branch suffixes) → unique specific registry name
      const resolved = await resolveCompanies(supabase, comps, { strict: true });

      for (let ci = 0; ci < comps.length; ci++) {
        const name = comps[ci].name;
        const r = resolved[ci];
        if (r.id) {
          await supabase.from("news_entity_links").upsert({
            article_id: a.id, entity_type: "directory_company", entity_id: r.id, entity_label: r.label ?? name,
            confidence: r.confidence, match_method: r.method, status: "approved",
          }, { onConflict: "article_id,entity_type,entity_id" });
          primaryCompany ??= { directory_company_id: r.id };
          links++;
          continue;
        }

        // Ambiguous -> review queue
        const escaped = name.replace(/[\\%_]/g, (c) => "\\" + c);
        const { data: cur } = await supabase.from("companies").select("id, name, directory_company_id").ilike("name", escaped).maybeSingle();
        const candidates = cur
          ? [{ type: "company", id: cur.id, label: cur.name }]
          : (r.candidates || []).slice(0, 3).map((d) => ({ type: "directory_company", id: d.id, label: d.label }));

        for (const cand of candidates) {
          await supabase.from("news_entity_links").upsert({
            article_id: a.id, entity_type: cand.type, entity_id: cand.id, entity_label: cand.label,
            confidence: candidates.length === 1 ? 0.7 : 0.4, match_method: "name", status: "pending",
          }, { onConflict: "article_id,entity_type,entity_id", ignoreDuplicates: true });
          await supabase.from("match_review_queue").upsert({
            kind: "news_company", source_table: "cna_articles", source_id: a.id, extracted_name: name,
            candidate_type: cand.type, candidate_id: cand.id, candidate_label: cand.label,
            confidence: candidates.length === 1 ? 0.7 : 0.4,
            reason: candidates.length === 1 ? "Exact name match" : "Several companies share this name",
          }, { onConflict: "source_table,source_id,extracted_name,candidate_id", ignoreDuplicates: true });
          reviews++;
        }
      }

      for (const p of (ex.people || []).slice(0, 8)) {
        const name = p.name?.trim();
        if (!name || name.split(" ").length < 2) continue;
        const { data: matches } = await supabase.from("people").select("id, name, title").ilike("name", name).limit(3);
        for (const m of matches || []) {
          await supabase.from("news_entity_links").upsert({
            article_id: a.id, entity_type: "person", entity_id: m.id, entity_label: m.name,
            confidence: 0.6, match_method: "name", status: "pending",
          }, { onConflict: "article_id,entity_type,entity_id", ignoreDuplicates: true });
          await supabase.from("match_review_queue").upsert({
            kind: "news_person", source_table: "cna_articles", source_id: a.id, extracted_name: name,
            candidate_type: "person", candidate_id: m.id, candidate_label: `${m.name}${m.title ? ` — ${m.title}` : ""}`,
            confidence: 0.6, reason: `Named in article${p.role ? ` as ${p.role}` : ""}${p.company ? ` at ${p.company}` : ""}. People are never matched automatically.`,
          }, { onConflict: "source_table,source_id,extracted_name,candidate_id", ignoreDuplicates: true });
          reviews++;
        }
      }

      if (primaryCompany && ex.event_type !== "other_business_news") {
        await supabase.from("company_events").insert({
          ...primaryCompany,
          event_type: ex.event_type,
          title: ex.event_title.slice(0, 300),
          event_date: (a.published_at || a.created_at)?.slice(0, 10),
          source_url: a.source_url,
          source_article_id: a.id,
          is_sensitive: SENSITIVE.has(ex.event_type),
          status: SENSITIVE.has(ex.event_type) ? "pending" : "approved",
        });
        events++;
      }
    }

    return new Response(JSON.stringify({ success: true, processed: articles?.length || 0, links, reviews, events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
