import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { parseTourismPx } from "../_shared/tourismParse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const SLUG = "cystat-tourist-arrivals-monthly";
const TABLE_URL = "https://cystatdb.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/Tourism/Tourists/Monthly/2021010E.px";

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
    if (action === "approve_revision" || action === "reject_revision") {
      if (caller.via !== "admin") return json({ error: "Admins only" }, 403);
      const { data: rev } = await sb.from("tourism_revisions").select("*").eq("id", String(body.id)).eq("status", "pending").maybeSingle();
      if (!rev) return json({ error: "Revision not found" }, 404);
      if (action === "approve_revision") {
        await sb.from("tourism_arrivals_monthly").update({ arrivals: rev.replacement_value, import_batch_id: rev.source_batch_id })
          .eq("country_code", rev.country_code).eq("period_date", rev.period_date);
      }
      await sb.from("tourism_revisions").update({ status: action === "approve_revision" ? "approved" : "rejected", approved_by: userId, decided_at: new Date().toISOString() }).eq("id", rev.id);
      return json({ ok: true });
    }

    // check: fetch whole table, publish new months, queue changes to published figures
    const metaRes = await fetch(TABLE_URL, { signal: AbortSignal.timeout(30000) });
    if (!metaRes.ok) throw new Error(`CYSTAT metadata HTTP ${metaRes.status}`);
    const meta = await metaRes.json();
    const cVar = meta.variables.find((v: { code: string }) => /COUNTRY/i.test(v.code));
    const dataRes = await fetch(TABLE_URL, {
      method: "POST", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: [{ code: cVar.code, selection: { filter: "all", values: ["*"] } }], response: { format: "json" } }),
    });
    if (!dataRes.ok) throw new Error(`CYSTAT data HTTP ${dataRes.status}`);
    const { rows, rejected } = parseTourismPx(meta, await dataRes.json());
    if (rows.length === 0) throw new Error("CYSTAT returned no observations");

    const { data: batch, error: bErr } = await sb.from("tourism_import_batches").insert({ source_slug: SLUG, imported_by: userId, total_rows: rows.length + rejected.length, rejected_rows: rejected.length, status: "running" }).select("id").single();
    if (bErr) throw bErr;

    const existing = new Map<string, number | null>();
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from("tourism_arrivals_monthly").select("country_code, period_date, arrivals").range(from, from + 999);
      for (const r of data ?? []) existing.set(`${r.country_code}|${r.period_date}`, r.arrivals);
      if (!data || data.length < 1000) break;
    }

    const upserts: Record<string, unknown>[] = [];
    const revisions: Record<string, unknown>[] = [];
    let unchanged = 0;
    for (const r of rows) {
      const key = `${r.country_code}|${r.period_date}`;
      if (!existing.has(key)) {
        if (r.arrivals === null) continue;
        upserts.push({ ...r, import_batch_id: batch.id, status: "published" });
        continue;
      }
      const old = existing.get(key);
      if (old === r.arrivals || r.arrivals === null) { unchanged++; continue; }
      if (old === null) { upserts.push({ ...r, import_batch_id: batch.id, status: "published" }); continue; }
      revisions.push({ country_code: r.country_code, period_date: r.period_date, previous_value: old, replacement_value: r.arrivals, source_batch_id: batch.id });
    }
    for (let i = 0; i < upserts.length; i += 1000) {
      const { error } = await sb.from("tourism_arrivals_monthly").upsert(upserts.slice(i, i + 1000), { onConflict: "country_code,period_date" });
      if (error) throw error;
    }
    if (revisions.length) {
      const { data: pend } = await sb.from("tourism_revisions").select("id, country_code, period_date").eq("status", "pending");
      const pendKeys = new Set((pend ?? []).map((p: { country_code: string; period_date: string }) => `${p.country_code}|${p.period_date}`));
      const fresh = revisions.filter((r) => !pendKeys.has(`${r.country_code}|${r.period_date}`));
      if (fresh.length) await sb.from("tourism_revisions").insert(fresh);
    }
    await sb.from("tourism_import_batches").update({ new_rows: upserts.length, unchanged_rows: unchanged, changed_rows: revisions.length, status: "completed", validation_report: { rejected: rejected.slice(0, 200) } }).eq("id", batch.id);

    const { data: latest } = await sb.from("tourism_arrivals_monthly").select("period_date").eq("country_code", "total").eq("status", "published").order("period_date", { ascending: false }).limit(1);
    await sb.from("open_data_sources").update({ status: "ok", last_error: null, last_checked_at: new Date().toISOString(), last_success_at: new Date().toISOString(), latest_period: latest?.[0]?.period_date ?? null }).eq("slug", SLUG);
    return json({ ok: true, added: upserts.length, unchanged, revisions: revisions.length, rejected: rejected.length });
  } catch (e) {
    await sb.from("open_data_sources").update({ status: "error", last_error: (e as Error).message, last_checked_at: new Date().toISOString() }).eq("slug", SLUG);
    return json({ error: (e as Error).message }, 500);
  }
});
