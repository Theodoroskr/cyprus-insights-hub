import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { ECON_SPECS, EconRow, buildQuery, parseEconPx, sameValue, tableUrl } from "../_shared/econParse.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** CYSTAT rate-limits bursts (HTTP 429); space requests out and retry. */
async function cystat(url: string, init?: RequestInit) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(attempt === 0 ? 1200 : 8000 * attempt);
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(45000) });
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`CYSTAT HTTP ${res.status} for ${decodeURIComponent(url.split("/").pop() ?? "")}`);
    return res.json();
  }
  throw new Error("CYSTAT is rate-limiting requests (HTTP 429); try again later");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);
  const userId = caller.via === "admin" ? caller.userId : null;
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* scheduled */ }
  const action = String(body.action ?? "check");

  try {
    if (action === "approve_revision" || action === "reject_revision" || action === "approve_all") {
      if (caller.via !== "admin") return json({ error: "Admins only" }, 403);
      let q = sb.from("econ_revisions").select("*").eq("status", "pending");
      if (action !== "approve_all") q = q.eq("id", String(body.id));
      const { data: revs } = await q.limit(2000);
      if (!revs?.length) return json({ error: "Revision not found" }, 404);
      const approve = action !== "reject_revision";
      for (const rev of revs) {
        if (approve) await sb.from("econ_indicators").update({ value: rev.replacement_value, import_batch_id: rev.source_batch_id }).eq("series_code", rev.series_code).eq("period_date", rev.period_date);
        await sb.from("econ_revisions").update({ status: approve ? "approved" : "rejected", approved_by: userId, decided_at: new Date().toISOString() }).eq("id", rev.id);
      }
      return json({ ok: true, decided: revs.length });
    }

    // check: read every table, grouped by source so one failing source doesn't block the others
    const slugs = [...new Set(ECON_SPECS.map((s) => s.slug))];
    const { data: batch, error: bErr } = await sb.from("econ_import_batches").insert({ imported_by: userId, status: "running" }).select("id").single();
    if (bErr) throw bErr;

    const { data: pend } = await sb.from("econ_revisions").select("series_code, period_date").eq("status", "pending");
    const pendKeys = new Set((pend ?? []).map((p) => `${p.series_code}|${p.period_date}`));
    const totals = { total: 0, added: 0, unchanged: 0, revisions: 0, rejected: 0 };
    const rejectedAll: string[] = [];
    const sourceResults: Record<string, string> = {};

    for (const slug of slugs) {
      const now = new Date().toISOString();
      try {
        const rows: EconRow[] = [];
        for (const spec of ECON_SPECS.filter((s) => s.slug === slug)) {
          const meta = await cystat(tableUrl(spec));
          const data = await cystat(tableUrl(spec), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildQuery(spec, meta)) });
          const parsed = parseEconPx(spec, meta, data);
          rows.push(...parsed.rows);
          rejectedAll.push(...parsed.rejected);
          totals.rejected += parsed.rejected.length;
        }
        if (rows.length === 0) throw new Error("CYSTAT returned no observations");
        totals.total += rows.length;

        const codes = [...new Set(rows.map((r) => r.series_code))];
        const existing = new Map<string, number | null>();
        for (let from = 0; ; from += 1000) {
          const { data } = await sb.from("econ_indicators").select("series_code, period_date, value").in("series_code", codes).range(from, from + 999);
          for (const r of data ?? []) existing.set(`${r.series_code}|${r.period_date}`, r.value == null ? null : Number(r.value));
          if (!data || data.length < 1000) break;
        }

        const upserts: Record<string, unknown>[] = [];
        const revisions: Record<string, unknown>[] = [];
        for (const r of rows) {
          const key = `${r.series_code}|${r.period_date}`;
          if (!existing.has(key)) {
            if (r.value === null) continue;
            upserts.push({ ...r, import_batch_id: batch.id, status: "published" });
            continue;
          }
          const old = existing.get(key)!;
          if (sameValue(old, r.value) || r.value === null) { totals.unchanged++; continue; }
          if (old === null) { upserts.push({ ...r, import_batch_id: batch.id, status: "published" }); continue; }
          if (!pendKeys.has(key)) revisions.push({ series_code: r.series_code, period_date: r.period_date, previous_value: old, replacement_value: r.value, source_batch_id: batch.id });
        }
        for (let i = 0; i < upserts.length; i += 1000) {
          const { error } = await sb.from("econ_indicators").upsert(upserts.slice(i, i + 1000), { onConflict: "series_code,period_date" });
          if (error) throw error;
        }
        for (let i = 0; i < revisions.length; i += 1000) await sb.from("econ_revisions").insert(revisions.slice(i, i + 1000));
        totals.added += upserts.length;
        totals.revisions += revisions.length;

        // Latest period = newest published headline figure for this source
        const headline = codes.find((c) => ["cpi_yoy", "gdp_real_yoy", "unemployment_rate"].includes(c)) ?? codes[0];
        const { data: latest } = await sb.from("econ_indicators").select("period_date").eq("series_code", headline).eq("status", "published").not("value", "is", null).order("period_date", { ascending: false }).limit(1);
        await sb.from("open_data_sources").update({ status: "ok", last_error: null, last_checked_at: now, last_success_at: now, latest_period: latest?.[0]?.period_date ?? null }).eq("slug", slug);
        sourceResults[slug] = `ok: ${upserts.length} new, ${revisions.length} changed`;
      } catch (e) {
        const msg = (e as Error).message;
        await sb.from("open_data_sources").update({ status: "error", last_error: msg.slice(0, 500), last_checked_at: now }).eq("slug", slug);
        sourceResults[slug] = `error: ${msg}`;
      }
    }

    const failed = Object.values(sourceResults).filter((v) => v.startsWith("error")).length;
    await sb.from("econ_import_batches").update({
      total_rows: totals.total, new_rows: totals.added, unchanged_rows: totals.unchanged, changed_rows: totals.revisions, rejected_rows: totals.rejected,
      status: failed === slugs.length ? "failed" : failed ? "partial" : "completed",
      validation_report: { sources: sourceResults, rejected: rejectedAll.slice(0, 200) },
    }).eq("id", batch.id);
    return json({ ok: failed < slugs.length, ...totals, sources: sourceResults }, failed === slugs.length ? 500 : 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
