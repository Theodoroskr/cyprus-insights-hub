import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { KIMDIS_API, KIMDIS_ENDPOINT, mapRecord, matchesSearch, type ProcurementKind, type ProcurementRow, type SearchFilters } from "../_shared/kimdis.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SOURCE_SLUG = "kimdis-procurement";
const BUDGET_MS = 110_000;

// deno-lint-ignore no-explicit-any
async function fetchPage(kind: ProcurementKind, page: number, dateFrom: string, dateTo: string): Promise<any> {
  let last = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await sleep(attempt * 8000);
    try {
      const res = await fetch(`${KIMDIS_API}/${KIMDIS_ENDPOINT[kind]}?page=${page}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "BusinessHub/1.0 (+https://businesshub.cy)" },
        body: JSON.stringify({ dateFrom, dateTo }),
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429 || res.status >= 500) { last = `HTTP ${res.status}`; await res.body?.cancel(); continue; }
      if (!res.ok) throw new Error(`KIMDIS HTTP ${res.status}`);
      const body = await res.json();
      if (!body || !Array.isArray(body.content) || typeof body.totalPages !== "number") throw new Error("KIMDIS response is not a result page");
      return body;
    } catch (e) { last = (e as Error).message; if (/HTTP 4\d\d|not a result/.test(last) && !/429/.test(last)) throw e; }
  }
  throw new Error(`KIMDIS unavailable (${last}); stored notices kept`);
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Managed daily schedule (Bearer cron secret), or an admin pressing "Run now".
  let via: "schedule" | "admin" | "cron" | "service" = "schedule";
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    via = caller.via;
  }
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "ingest");

  if (action === "digest") return json(await sendDigests(sb));
  if (action !== "ingest") return json({ error: "Unknown action" }, 400);

  const kinds: ProcurementKind[] = body.kind === "award" ? ["award"] : body.kind === "tender" ? ["tender"] : ["tender", "award"];
  const days = Math.min(Math.max(Number(body.days ?? 3) || 3, 1), 60);
  const to = typeof body.date_to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date_to) ? new Date(`${body.date_to}T00:00:00Z`) : new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  const startPage = Math.max(0, Number(body.start_page ?? 0) || 0);
  const started = Date.now();
  const now = new Date().toISOString();
  await sb.from("open_data_sources").update({ last_checked_at: now }).eq("slug", SOURCE_SLUG);

  const report: Record<string, unknown> = { via, date_from: isoDay(from), date_to: isoDay(to) };
  let added = 0, updated = 0, skipped = 0, rejected = 0, scanned = 0;
  const rejects: string[] = [];
  let nextPage: { kind: ProcurementKind; page: number } | null = null;

  try {
    for (const kind of kinds) {
      let page = kind === kinds[0] ? startPage : 0;
      for (;;) {
        if (Date.now() - started > BUDGET_MS) { nextPage = { kind, page }; break; }
        const res = await fetchPage(kind, page, isoDay(from), isoDay(to));
        const rows: ProcurementRow[] = [];
        for (const r of res.content) {
          scanned++;
          const m = mapRecord(kind, r);
          if ("rejected" in m) { rejected++; if (rejects.length < 20) rejects.push(m.rejected); continue; }
          // Only the focus areas (IT, cybersecurity, compliance, professional services) are kept.
          if (!m.row.focus.length) { skipped++; continue; }
          rows.push(m.row);
        }
        if (rows.length) {
          const refs = rows.map((r) => r.reference_number);
          const { data: existing } = await sb.from("gr_procurement_notices").select("reference_number").in("reference_number", refs);
          const known = new Set((existing ?? []).map((e) => e.reference_number));
          // Deduplicated by the official reference number (ΑΔΑΜ): a rerun or an amended record updates the same row.
          const { error } = await sb.from("gr_procurement_notices").upsert(rows.map((r) => ({ ...r, last_seen_at: now })), { onConflict: "reference_number" });
          if (error) throw error;
          for (const r of rows) known.has(r.reference_number) ? updated++ : added++;
          // An amendment replaces the notice it amends: the older one is marked as superseded.
          for (const r of rows.filter((x) => x.amends_reference)) {
            await sb.from("gr_procurement_notices").update({ superseded_by: r.reference_number }).eq("reference_number", r.amends_reference!);
          }
        }
        page++;
        if (res.last === true || page >= res.totalPages) break;
        await sleep(250);
      }
      if (nextPage) break;
    }
    const { data: newest } = await sb.from("gr_procurement_notices").select("published_at").order("published_at", { ascending: false, nullsFirst: false }).limit(1);
    await sb.from("open_data_sources").update({
      status: "ok", last_error: null, last_success_at: new Date().toISOString(), records_imported: added + updated,
      latest_period: newest?.[0]?.published_at ? newest[0].published_at.slice(0, 10) : null,
    }).eq("slug", SOURCE_SLUG);
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    await sb.from("open_data_sources").update({ status: "error", last_error: msg }).eq("slug", SOURCE_SLUG);
    return json({ ok: false, error: msg, added, updated, skipped, rejected, scanned, ...report }, 502);
  }
  // Scheduled runs carry on in a fresh call when the time budget runs out (admins see "next" and run again).
  if (nextPage && (via === "schedule" || via === "service") && Number(body.hop ?? 0) < 8) {
    const cont = fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ingest-gr-procurement`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: nextPage.kind, days, date_to: isoDay(to), start_page: nextPage.page, hop: Number(body.hop ?? 0) + 1 }),
    }).catch(() => undefined);
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil?.(cont);
  }
  return json({ ok: true, added, updated, skipped, rejected, scanned, rejects, next: nextPage, ...report });
});

// deno-lint-ignore no-explicit-any
async function sendDigests(sb: any) {
  const { data: searches } = await sb.from("gr_procurement_saved_searches").select("*").eq("daily_digest", true).limit(2000);
  let sent = 0;
  for (const s of searches ?? []) {
    const since = s.last_notified_at ?? new Date(Date.now() - 86_400_000).toISOString();
    const f = (s.filters ?? {}) as SearchFilters;
    const { data: fresh } = await sb.from("gr_procurement_notices")
      .select("kind,title,authority_name,focus,value_without_vat,published_at,deadline_at,cancelled,superseded_by")
      .eq("kind", f.kind ?? "tender").gt("first_seen_at", since).limit(1000);
    const hits = (fresh ?? []).filter((n: never) => matchesSearch(n, f));
    if (hits.length) {
      await sb.from("notifications").insert({
        user_id: s.user_id, type: "gr_tender_digest",
        title: f.kind === "award"
          ? `${hits.length} νέες αναθέσεις / new contract awards — «${s.name}»`
          : `${hits.length} νέοι διαγωνισμοί / new Greek tenders — «${s.name}»`,
        body: hits.slice(0, 3).map((h: { title: string }) => h.title).join(" · ").slice(0, 400),
        href: `/greece/opportunities?saved=${s.id}`,
      });
      sent++;
    }
    await sb.from("gr_procurement_saved_searches").update({ last_notified_at: new Date().toISOString() }).eq("id", s.id);
  }
  return { ok: true, searches: searches?.length ?? 0, sent };
}
