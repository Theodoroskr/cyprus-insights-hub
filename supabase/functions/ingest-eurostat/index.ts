import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { diffObservations, eurostatUrl, parseJsonStat, type Existing } from "../_shared/eurostat.ts";
import { ecbUrl, nicosiaHour, parseEcbCsv } from "../_shared/ecb.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const HOUR = 3_600_000;

async function fetchEurostat(url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(4000 * attempt);
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(45000) });
    if (res.status === 429 || res.status >= 500) continue;
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Eurostat HTTP ${res.status}: ${body?.error?.[0]?.label ?? body?.error?.label ?? "request failed"}`);
    return body;
  }
  throw new Error("Eurostat is temporarily unavailable; previous figures kept");
}

// Central Bank of Cyprus statistics via the ECB Data Portal (SDMX CSV), retried with backoff.
async function fetchEcb(url: string) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(5000 * attempt);
    try {
      const res = await fetch(url, { headers: { Accept: "text/csv" }, signal: AbortSignal.timeout(45000) });
      if (res.status === 429 || res.status >= 500) { last = `HTTP ${res.status}`; continue; }
      const text = await res.text();
      if (res.status === 404) throw new Error("ECB has no data for this series key");
      if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
      return text;
    } catch (e) { last = (e as Error).message; if (/no data|HTTP 4/.test(last)) throw e; }
  }
  throw new Error(`ECB Data Portal unavailable (${last}); previous figures kept`);
}

const SOURCES = {
  eurostat: { slug: "eurostat-cyprus", head: "hicp_all", name: "Eurostat" },
  ecb: { slug: "cbc-household-banking", head: "cbc_hh_loans", name: "Central Bank" },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Managed daily schedule (Bearer cron secret), or an admin pressing "Refresh".
  let via: "schedule" | "admin" | "service" = "schedule";
  let userId: string | null = null;
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    via = caller.via === "admin" ? "admin" : "service";
    userId = caller.via === "admin" ? caller.userId ?? null : null;
  }
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "check");
  const source: keyof typeof SOURCES = body.source === "ecb" ? "ecb" : "eurostat";
  // Monthly schedules fire at two UTC hours; only the one that is 04:00 in Cyprus runs (summer time safe).
  if (via === "schedule" && typeof body.local_hour === "number" && nicosiaHour(new Date()) !== body.local_hour) {
    return json({ ok: true, status: "skipped", reason: "not the scheduled Cyprus hour" });
  }

  try {
    if (action === "approve_revision" || action === "reject_revision" || action === "approve_all") {
      if (via !== "admin") return json({ error: "Admins only" }, 403);
      let q = sb.from("stat_revisions").select("*").eq("status", "pending");
      if (action !== "approve_all") q = q.eq("id", String(body.id ?? ""));
      const { data: revs } = await q.limit(2000);
      if (!revs?.length) return json({ error: "Revision not found" }, 404);
      const approve = action !== "reject_revision";
      for (const r of revs) {
        if (approve) {
          await sb.from("stat_observations").update({ value: r.replacement_value, status_flag: r.replacement_flag, source_updated_at: r.source_updated_at, import_job_id: r.import_job_id, retrieved_at: new Date().toISOString() })
            .eq("dataset_id", r.dataset_id).eq("geo", r.geo).eq("period", r.period);
        }
        await sb.from("stat_revisions").update({ status: approve ? "approved" : "rejected", decided_by: userId, decided_at: new Date().toISOString() }).eq("id", r.id);
      }
      return json({ ok: true, decided: revs.length });
    }

    if (action !== "check") return json({ error: "Unknown action" }, 400);
    const force = body.force === true && via === "admin";
    const only = typeof body.code === "string" && /^[a-z0-9_]{1,60}$/.test(body.code) ? body.code : null;

    let dq = sb.from("stat_datasets").select("*").eq("source", source).order("sort_order");
    dq = only ? dq.eq("code", only) : dq.eq("enabled", true);
    const { data: datasets, error: dErr } = await dq;
    if (dErr) throw dErr;

    const { data: job, error: jErr } = await sb.from("stat_import_jobs").insert({ triggered_by: userId, trigger: via }).select("id").single();
    if (jErr) throw jErr;
    const totals = { checked: 0, skipped: 0, added: 0, unchanged: 0, revisions: 0, rejected: 0 };
    const results: Record<string, string> = {};
    const rejectedAll: string[] = [];

    for (const ds of datasets ?? []) {
      const now = new Date();
      if (!force && !only && ds.last_success_at && now.getTime() - new Date(ds.last_success_at).getTime() < (ds.refresh_hours - 1) * HOUR) {
        totals.skipped++; results[ds.code] = "skipped: refreshed recently"; continue;
      }
      try {
        const parsed = source === "ecb"
          ? { ...parseEcbCsv(await fetchEcb(ecbUrl(ds)), ds.geos), updated: null as string | null }
          : parseJsonStat(await fetchEurostat(eurostatUrl(ds)), ds.geos);
        totals.checked++;
        rejectedAll.push(...parsed.rejected.map((r) => `${ds.code}: ${r}`));
        totals.rejected += parsed.rejected.length;
        if (!parsed.rows.length) throw new Error(`${SOURCES[source].name} returned no observations for these filters`);
        const unchangedAtSource = !force && ds.source_updated_at && parsed.updated && new Date(ds.source_updated_at).getTime() === new Date(parsed.updated).getTime();

        let summary = "no change at source";
        if (!unchangedAtSource) {
          const existing = new Map<string, Existing>();
          for (let from = 0; ; from += 1000) {
            const { data } = await sb.from("stat_observations").select("geo, period, value, status_flag").eq("dataset_id", ds.id).range(from, from + 999);
            for (const r of data ?? []) existing.set(`${r.geo}|${r.period}`, { value: Number(r.value), status_flag: r.status_flag });
            if (!data || data.length < 1000) break;
          }
          const { data: pend } = await sb.from("stat_revisions").select("geo, period").eq("dataset_id", ds.id).eq("status", "pending");
          const diff = diffObservations(parsed.rows, existing, new Set((pend ?? []).map((p) => `${p.geo}|${p.period}`)));
          const stamp = { source_updated_at: parsed.updated, retrieved_at: now.toISOString(), import_job_id: job.id };
          if (diff.inserts.length) {
            const rows = diff.inserts.map((r) => ({ dataset_id: ds.id, ...r, ...stamp, status: "published" }));
            for (let i = 0; i < rows.length; i += 500) { const { error } = await sb.from("stat_observations").insert(rows.slice(i, i + 500)); if (error) throw error; }
          }
          for (const r of diff.flagUpdates) {
            await sb.from("stat_observations").update({ status_flag: r.status_flag, ...stamp }).eq("dataset_id", ds.id).eq("geo", r.geo).eq("period", r.period);
          }
          if (diff.revisions.length) {
            const { error } = await sb.from("stat_revisions").insert(diff.revisions.map(({ row, previous }) => ({
              dataset_id: ds.id, geo: row.geo, period: row.period, previous_value: previous.value, replacement_value: row.value,
              previous_flag: previous.status_flag, replacement_flag: row.status_flag, source_updated_at: parsed.updated, import_job_id: job.id,
            })));
            if (error) throw error;
          }
          totals.added += diff.inserts.length; totals.unchanged += diff.unchanged + diff.flagUpdates.length; totals.revisions += diff.revisions.length;
          summary = `${diff.inserts.length} new, ${diff.revisions.length} revised, ${diff.flagUpdates.length} flag updates`;
        }
        const { data: latest } = await sb.from("stat_observations").select("period").eq("dataset_id", ds.id).eq("geo", "CY").eq("status", "published").order("period_date", { ascending: false }).limit(1);
        await sb.from("stat_datasets").update({ status: "ok", last_error: null, last_checked_at: now.toISOString(), last_success_at: now.toISOString(), source_updated_at: parsed.updated ?? ds.source_updated_at, latest_period: latest?.[0]?.period ?? null }).eq("id", ds.id);
        results[ds.code] = `ok: ${summary}`;
      } catch (e) {
        // A failed refresh never touches stored observations.
        const msg = (e as Error).message.slice(0, 500);
        await sb.from("stat_datasets").update({ status: "error", last_error: msg, last_checked_at: now.toISOString() }).eq("id", ds.id);
        results[ds.code] = `error: ${msg}`;
      }
    }

    const errors = Object.values(results).filter((v) => v.startsWith("error")).length;
    const ran = Object.keys(results).length - totals.skipped;
    const status = ran === 0 ? "skipped" : errors === ran ? "failed" : errors ? "partial" : "completed";
    await sb.from("stat_import_jobs").update({
      finished_at: new Date().toISOString(), status, datasets_checked: totals.checked, datasets_skipped: totals.skipped,
      new_rows: totals.added, unchanged_rows: totals.unchanged, changed_rows: totals.revisions, rejected_rows: totals.rejected,
      report: { datasets: results, rejected: rejectedAll.slice(0, 200) },
    }).eq("id", job.id);

    if (ran > 0) {
      const nowIso = new Date().toISOString();
      const { data: head } = await sb.from("stat_observations").select("period_date, stat_datasets!inner(code)").eq("stat_datasets.code", SOURCES[source].head).eq("geo", "CY").order("period_date", { ascending: false }).limit(1);
      await sb.from("open_data_sources").update(errors === ran
        ? { status: "error", last_error: `${errors} ${SOURCES[source].name} dataset(s) failed`, last_checked_at: nowIso }
        : { status: "ok", last_error: errors ? `${errors} dataset(s) failed` : null, last_checked_at: nowIso, last_success_at: nowIso, latest_period: head?.[0]?.period_date ?? null }).eq("slug", SOURCES[source].slug);
    }
    return json({ ok: status !== "failed", job_id: job.id, status, ...totals, datasets: results }, status === "failed" ? 500 : 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
