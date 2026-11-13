import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import {
  type CallInput, type ExistingCall, callState, classifySectors, dedupeKey, euEligibleForCyprus, euProgramme,
  extractCallReference, isChangeNotice, looksLikeCall, planMerge,
} from "../_shared/funding.ts";
import { readStream } from "../_shared/complianceAi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
// deno-lint-ignore no-explicit-any
type Any = any;
const UA = "Mozilla/5.0 (compatible; BusinessHubBot/1.0; +https://businesshub.cy)";
const today = () => new Date().toISOString().slice(0, 10);

async function fetchText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en,el" }, signal: AbortSignal.timeout(25000) });
    if (r.ok) return await r.text();
    if (r.status !== 403 && r.status !== 429) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    if (!Deno.env.get("FIRECRAWL_API_KEY")) throw e;
  }
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("Blocked and no scraping service available");
  const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["html"] }), signal: AbortSignal.timeout(45000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d?.data?.html) throw new Error(`Unreachable (scraping service: ${d?.error ?? r.status})`);
  return d.data.html;
}

function htmlToText(html: string): string {
  return html.replace(/<(script|style|nav|footer|header)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "–").replace(/&#8217;/g, "’").replace(/\s+/g, " ").trim();
}

// ---------- AI field extraction for pages without structured data ----------
const n = (t: string) => ({ type: [t, "null"] });
const EXTRACT_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    is_call: { type: "boolean" }, is_change_notice: { type: "boolean" },
    title_en: { type: "string" }, title_el: n("string"), programme: n("string"), call_reference: n("string"), round: n("string"),
    summary_en: n("string"), eligibility_summary: n("string"),
    instrument_type: { type: "string", enum: ["grant", "subsidy", "voucher", "loan", "guarantee", "equity", "prize", "tax_incentive", "other"] },
    applicant_types: { type: "array", items: { type: "string", enum: ["sme", "large_enterprise", "startup", "research_org", "university", "public_body", "ngo", "individual", "farmer", "any"] } },
    eligible_costs: n("string"), cofunding_rate: n("string"), max_award_eur: n("number"), total_budget_eur: n("number"),
    opening_date: n("string"), deadline_date: n("string"), deadline_time: n("string"), consortium_requirements: n("string"), application_url: n("string"),
  },
  required: ["is_call", "is_change_notice", "title_en", "title_el", "programme", "call_reference", "round", "summary_en", "eligibility_summary", "instrument_type", "applicant_types", "eligible_costs", "cofunding_rate", "max_award_eur", "total_budget_eur", "opening_date", "deadline_date", "deadline_time", "consortium_requirements", "application_url"],
};
const EXTRACT_INSTRUCTIONS = `You read one official Cyprus or EU web page (Greek or English) and record the funding call it describes, as JSON.
is_call: true only if the page announces a specific call or scheme applicants can apply to (now or soon). is_change_notice: true if it reports an extension, suspension, budget exhaustion, correction or eligibility change to an existing call.
Never guess: use null when the page does not say. Copy the official call code exactly. Dates as YYYY-MM-DD exactly as published; deadline_time only if a time is printed (HH:MM). Amounts in euro as numbers.
title_en in English (translate if needed); title_el the Greek title if shown. summary_en: two factual sentences. eligibility_summary: who can apply, one sentence. application_url: the IRIS/Ermis/portal link if the issuer names one.`;

async function aiExtract(url: string, text: string): Promise<Any | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST", headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra", stream: true, store: false,
      reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"],
      input: [{ role: "system", content: EXTRACT_INSTRUCTIONS }, { role: "user", content: [{ type: "input_text", text: `URL: ${url}\n\n${text.slice(0, 14000)}` }] }],
      text: { format: { type: "json_schema", name: "funding_call", strict: true, schema: EXTRACT_SCHEMA } },
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const raw = await readStream(res);
  try { return JSON.parse(raw); } catch { return null; }
}

// ---------- storing ----------
async function upsertCall(sb: Any, sourceId: string | null, input: CallInput, opts: { status?: string; origin?: string; ineligible_reason?: string | null; sourceKind?: string; language?: string; notice?: string; raw?: unknown }) {
  const key = dedupeKey(input);
  const { data: existing } = await sb.from("funding_calls").select("*").eq("dedupe_key", key).maybeSingle();
  const plan = planMerge(existing as ExistingCall | null, input, opts.notice ?? "");
  let id = existing?.id as string | undefined;
  if (plan.action === "insert") {
    const row = { ...plan.patch, source_id: sourceId, status: opts.status ?? "review", origin: opts.origin ?? "import",
      ineligible_reason: opts.ineligible_reason ?? null, call_state: callState(input, today()), raw: opts.raw ?? null };
    const { data, error } = await sb.from("funding_calls").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id;
  } else if (plan.action === "update") {
    if (Object.keys(plan.patch).length) {
      const merged = { ...existing, ...plan.patch };
      await sb.from("funding_calls").update({ ...plan.patch, call_state: callState(merged, today()) }).eq("id", id);
    }
    for (const c of plan.changes) {
      const { data: dup } = await sb.from("funding_call_changes").select("id").eq("call_id", id).eq("field", c.field).eq("new_value", c.new_value).eq("status", "pending").maybeSingle();
      if (!dup) await sb.from("funding_call_changes").insert({ call_id: id, ...c, source_url: input.official_url });
    }
  }
  await sb.from("funding_call_sources").upsert({ call_id: id, source_id: sourceId, url: input.official_url, kind: opts.sourceKind ?? "listing", language: opts.language ?? "en", title: input.title_en, last_seen_at: new Date().toISOString() }, { onConflict: "call_id,url" });
  return { id, action: plan.action, changes: plan.changes.length };
}

/** A page reporting an extension/suspension: attach it to the call with the same reference, as a change for review. */
async function recordNotice(sb: Any, issuer: string, ex: Any, url: string, title: string) {
  const ref = ex.call_reference ?? extractCallReference(title);
  if (!ref) return false;
  const { data: calls } = await sb.from("funding_calls").select("id,deadline_date,round,dedupe_key").ilike("call_reference", ref);
  const target = (calls ?? []).find((c: Any) => !ex.round || c.round === ex.round) ?? null;
  if (!target) return false;
  const kind = /suspen|αναστολ/i.test(title) ? "suspension" : /exhaust|εξάντλ/i.test(title) ? "budget_exhausted" : /extension|παράταση/i.test(title) ? "deadline_extension" : /eligib|επιλεξιμ/i.test(title) ? "eligibility_change" : "correction";
  await sb.from("funding_call_changes").insert({ call_id: target.id, change_kind: kind, field: ex.deadline_date ? "deadline_date" : null, old_value: target.deadline_date, new_value: ex.deadline_date ?? title, source_url: url });
  await sb.from("funding_call_sources").upsert({ call_id: target.id, url, kind: "notice", title }, { onConflict: "call_id,url" });
  return true;
}

async function importPage(sb: Any, src: Any, url: string, origin = "import") {
  const html = await fetchText(url);
  const text = htmlToText(html);
  const ex = await aiExtract(url, text);
  if (!ex) return { url, result: "no data" };
  const language = /[α-ω]{4}/i.test(text.slice(0, 2000)) && !/[a-z]{4} [a-z]{4} [a-z]{4}/.test(text.slice(0, 600)) ? "el" : "en";
  if (ex.is_change_notice || isChangeNotice(ex.title_en ?? "")) {
    const ok = await recordNotice(sb, src?.issuer ?? "", ex, url, ex.title_en);
    if (ok) return { url, result: "change for review" };
  }
  if (!ex.is_call) return { url, result: "not a call" };
  const input: CallInput = {
    issuer: src?.issuer ?? "Unknown issuer", programme: ex.programme, call_reference: ex.call_reference ?? extractCallReference(ex.title_en),
    round: ex.round, title_en: ex.title_en, title_el: ex.title_el, summary_en: ex.summary_en, eligibility_summary: ex.eligibility_summary,
    instrument_type: ex.instrument_type, applicant_types: ex.applicant_types ?? [], geography: "cyprus",
    sectors: classifySectors(`${ex.title_en} ${ex.programme ?? ""} ${ex.summary_en ?? ""}`, src?.default_sectors ?? []),
    eligible_costs: ex.eligible_costs, cofunding_rate: ex.cofunding_rate, max_award_eur: ex.max_award_eur, total_budget_eur: ex.total_budget_eur,
    opening_date: ex.opening_date, deadline_date: ex.deadline_date, deadline_time: ex.deadline_time,
    consortium_requirements: ex.consortium_requirements, application_url: ex.application_url, official_url: url,
  };
  const r = await upsertCall(sb, src?.id ?? null, input, { origin, language, sourceKind: language === "el" ? "release_el" : "release_en", notice: ex.title_en });
  return { url, result: r.action, id: r.id };
}

// ---------- source handlers ----------
const EU_API = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***";
const EU_STATUS: Record<string, string> = { "31094501": "forthcoming", "31094502": "open" };

function euDate(iso?: string): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null };
  const d = new Date(iso);
  if (isNaN(+d)) return { date: null, time: null };
  if (/T00:00:00/.test(iso)) return { date: iso.slice(0, 10), time: null };
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")} Brussels` };
}

function euBudget(raw?: string): number | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw); let sum = 0;
    for (const arr of Object.values(o.budgetTopicActionMap ?? {}) as Any[]) for (const a of arr) for (const v of Object.values(a.budgetYearMap ?? {})) sum += Number(v) || 0;
    return sum > 0 ? sum : null;
  } catch { return null; }
}

let EU_PAGE = 20;
async function runEu(sb: Any, src: Any, maxPages = 35) {
  let stats = { seen: 0, inserted: 0, updated: 0, ineligible: 0, changes: 0 };
  for (let page = 1; page <= maxPages; page++) {
    const boundary = "----bhfunding" + page;
    const part = (name: string, v: unknown) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="blob"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(v)}\r\n`;
    const fd = part("query", { bool: { must: [{ terms: { type: ["1", "2", "8"] } }, { terms: { status: ["31094501", "31094502"] } }] } }) + part("languages", ["en"]) + `--${boundary}--\r\n`;
    let d: Any = null;
    for (let attempt = 0; attempt < 3 && !d; attempt++) {
      try {
        const r = await fetch(`${EU_API}&pageSize=${EU_PAGE}&pageNumber=${page}`, { method: "POST", body: fd, headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Accept-Encoding": "identity" }, signal: AbortSignal.timeout(40000) });
        if (!r.ok) throw new Error(`EU API HTTP ${r.status}`);
        d = JSON.parse(new TextDecoder().decode(await r.arrayBuffer()));
      } catch (e) { if (attempt === 2) throw new Error(`EU API page ${page}: ${(e as Error).message}`); await new Promise((res) => setTimeout(res, 1500)); }
    }
    const results = d.results ?? [];
    for (const res of results) {
      const m = res.metadata ?? {};
      const first = (k: string) => (Array.isArray(m[k]) ? m[k][0] : m[k]) as string | undefined;
      const type = first("type");
      const kind = type === "8" ? "cascade" : "topic";
      const identifier = first("identifier") ?? "";
      const title = (first("title") ?? res.summary ?? "").trim();
      if (!title) continue;
      const desc = htmlToText(`${first("description") ?? ""} ${first("descriptionByte") ?? ""} ${first("furtherInformation") ?? ""}`);
      const elig = euEligibleForCyprus(kind, `${title} ${first("callTitle") ?? ""} ${desc.slice(0, 3000)}`, first("projectAcronym") ?? "");
      const open = euDate(first("startDate")); const dl = euDate(first("deadlineDate"));
      const progName = kind === "cascade" ? `Cascade funding: ${first("projectName") ?? first("projectAcronym") ?? euProgramme(identifier)}` : euProgramme(identifier);
      const url = first("url") ?? res.url;
      const input: CallInput = {
        issuer: kind === "cascade" ? `${first("projectAcronym") ?? "EU-funded project"} (EU cascade funding)` : "European Commission",
        programme: progName,
        call_reference: kind === "cascade" ? (first("callTitle")?.match(/\(([A-Z0-9-]{6,})\)/)?.[1] ?? `CASCADE-${first("ccm2Id")}`) : identifier,
        round: null, title_en: title,
        summary_en: desc ? desc.slice(0, 420).replace(/\s\S*$/, "…") : null,
        eligibility_summary: kind === "topic" ? "Legal entities established in an EU Member State (including Cyprus) or associated country; see the topic conditions." : (elig.eligible ? "See the cascade call conditions (open to Cyprus applicants)." : null),
        instrument_type: "grant", geography: "eu",
        sectors: classifySectors(`${identifier} ${title} ${first("callTitle") ?? ""} ${(m.keywords ?? []).join(" ")}`),
        applicant_types: kind === "cascade" ? ["sme"] : ["any"],
        total_budget_eur: kind === "cascade" ? (Number(first("budget")) || null) : euBudget(first("budgetOverview")),
        opening_date: open.date, deadline_date: dl.date, deadline_time: dl.time,
        consortium_requirements: null, application_url: url, official_url: url,
      };
      // Topics are the Commission's own published call documents: verified on import. Cascade calls go to an editor.
      const status = !elig.eligible ? "ineligible" : kind === "topic" ? "verified" : "review";
      const out = await upsertCall(sb, src.id, input, { status, ineligible_reason: elig.reason ?? null, raw: { type, status: EU_STATUS[first("status") ?? ""] ?? null, ccm2Id: first("ccm2Id") } });
      stats.seen++;
      if (out.action === "insert") { if (status === "ineligible") stats.ineligible++; else stats.inserted++; }
      if (out.action === "update") stats.updated++;
      stats.changes += out.changes;
    }
    if (results.length < EU_PAGE) break;
  }
  return stats;
}

async function runListing(sb: Any, src: Any, limit = 6) {
  const body = await fetchText(src.url);
  let links: { url: string; title: string }[] = [];
  if (src.method === "rss") {
    for (const item of body.split(/<item>/).slice(1)) {
      const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? "";
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
      if (link) links.push({ url: link, title: htmlToText(title) });
    }
  } else {
    const base = new URL(src.url);
    for (const m of body.matchAll(/<a\b[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      try { links.push({ url: new URL(m[1], base).toString(), title: htmlToText(m[2]) }); } catch { /* */ }
    }
  }
  links = links.filter((l) => l.title.length > 12 && (looksLikeCall(l.title) || isChangeNotice(l.title)));
  const seen = new Set<string>(); links = links.filter((l) => !seen.has(l.url) && seen.add(l.url));
  // Skip pages already stored.
  const { data: known } = await sb.from("funding_call_sources").select("url").in("url", links.map((l) => l.url));
  const knownSet = new Set((known ?? []).map((k: Any) => k.url));
  const fresh = links.filter((l) => !knownSet.has(l.url)).slice(0, limit);
  const results = [];
  for (const l of fresh) {
    try { results.push(await importPage(sb, src, l.url)); } catch (e) { results.push({ url: l.url, result: `error: ${(e as Error).message}` }); }
  }
  return { candidates: links.length, processed: results };
}

async function runSource(sb: Any, src: Any) {
  const started = new Date().toISOString();
  try {
    const out = src.method === "api" ? await runEu(sb, src) : await runListing(sb, src);
    const found = (out as Any).seen ?? (out as Any).candidates ?? 0;
    await sb.from("funding_sources").update({ last_attempt_at: started, last_success_at: new Date().toISOString(), last_error: null, items_found: found }).eq("id", src.id);
    return { slug: src.slug, ok: true, ...out };
  } catch (e) {
    await sb.from("funding_sources").update({ last_attempt_at: started, last_error: (e as Error).message.slice(0, 400) }).eq("id", src.id);
    return { slug: src.slug, ok: false, error: (e as Error).message };
  }
}

async function refreshStates(sb: Any) {
  const t = today();
  await sb.from("funding_calls").update({ call_state: "closed", is_preview: false }).lt("deadline_date", t).neq("call_state", "closed");
  await sb.from("funding_calls").update({ call_state: "open" }).lte("opening_date", t).gte("deadline_date", t).eq("call_state", "upcoming");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
  }
  let body: Any = {};
  try { body = await req.json(); } catch { /* scheduled run */ }
  const action = body.action ?? "run";
  if (body.page_size) EU_PAGE = Math.min(100, Math.max(1, Number(body.page_size)));

  if (action === "probe") {
    const urls: string[] = (body.urls ?? []).slice(0, 25);
    const out = await Promise.all(urls.map(async (u) => {
      try {
        const r = await fetch(u, { method: body.method ?? "GET", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
        const t = await r.text();
        return { url: u, status: r.status, bytes: t.length, title: t.match(/<title[^>]*>([^<]{0,120})/i)?.[1]?.trim() ?? null };
      } catch (e) { return { url: u, error: (e as Error).message }; }
    }));
    return json(out);
  }

  if (action === "submit_url") {
    const url = String(body.url ?? "");
    if (!/^https:\/\/[^\s]+$/.test(url) || url.length > 600) return json({ error: "Paste the official https:// link of the call" }, 400);
    const host = new URL(url).hostname;
    const { data: sources } = await sb.from("funding_sources").select("*");
    const src = (sources ?? []).find((s: Any) => { try { return new URL(s.url).hostname === host; } catch { return false; } }) ?? null;
    try { return json(await importPage(sb, src ?? { issuer: body.issuer || host, default_sectors: [] }, url, "manual")); }
    catch (e) { return json({ error: (e as Error).message }, 502); }
  }

  if (action === "apply_change") {
    const { data: ch } = await sb.from("funding_call_changes").select("*").eq("id", body.id).single();
    if (!ch) return json({ error: "Not found" }, 404);
    if (body.accept && ch.field && ch.new_value !== null) {
      const v = ["max_award_eur", "total_budget_eur"].includes(ch.field) ? Number(ch.new_value) : ch.field === "applicant_types" ? String(ch.new_value).split(",") : ch.new_value;
      const { data: call } = await sb.from("funding_calls").select("*").eq("id", ch.call_id).single();
      const merged = { ...call, [ch.field]: v };
      await sb.from("funding_calls").update({ [ch.field]: v, call_state: callState(merged, today()), last_verified_at: new Date().toISOString() }).eq("id", ch.call_id);
    }
    await sb.from("funding_call_changes").update({ status: body.accept ? "applied" : "dismissed", reviewed_at: new Date().toISOString() }).eq("id", ch.id);
    return json({ ok: true });
  }

  const { data: all } = await sb.from("funding_sources").select("*").eq("enabled", true).neq("method", "manual");
  const now = Date.now();
  const due = (all ?? []).filter((s: Any) => body.slug ? s.slug === body.slug : body.force || !s.last_attempt_at || now - Date.parse(s.last_attempt_at) > s.check_interval_hours * 3600_000 * 0.9);
  const results = [];
  for (const s of due) results.push(await runSource(sb, s));
  await refreshStates(sb);
  return json({ ran: results.length, results });
});
