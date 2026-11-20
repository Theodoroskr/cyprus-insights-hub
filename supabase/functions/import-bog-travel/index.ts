// Admin upload of the Bank of Greece "Number of inbound travellers" file (the bank blocks automated downloads).
// Actions: "latest" (newest file listed on data.gov.gr), "preview" (parse + compare, no writes), "import" (write).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { unzipSync } from "npm:fflate@0.8.2";
import { readXlsxSheets } from "../_shared/xlsxReader.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { periodToDate, diffObservations, type Existing, type StatRow } from "../_shared/eurostat.ts";
import { parseBogTravellers, latestBogFile } from "../_shared/bogTravel.ts";

const CODE = "gr_travellers";
const SOURCE_SLUG = "bog-travel-services";
const CKAN = "https://data.gov.gr/api/3/action/package_show?id=bank-of-greece-number-of-inbound-travellers-in-greece-by-country-of-origin";
const MAX_BYTES = 8 * 1024 * 1024;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function decodeFile(b64: unknown): Uint8Array {
  if (typeof b64 !== "string" || !b64) throw new Error("No file was sent.");
  const bin = atob(b64.replace(/^data:[^,]*,/, ""));
  if (bin.length > MAX_BYTES) throw new Error("The file is larger than 8 MB.");
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("This is not an .xlsx file. Upload the Excel (.xlsx) file from the Bank of Greece.");
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);
  if (caller.via !== "admin") return json({ error: "Admins only" }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const action = String(body.action ?? "");

  try {
    if (action === "latest") {
      const res = await fetch(CKAN, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) return json({ error: `data.gov.gr answered HTTP ${res.status}` }, 502);
      const pkg = await res.json();
      const latest = latestBogFile(pkg?.result?.resources ?? []);
      return json({ ok: true, latest });
    }
    if (action !== "preview" && action !== "import") return json({ error: "Unknown action" }, 400);
    const fileName = String(body.file_name ?? "upload.xlsx").slice(0, 200);
    const bytes = decodeFile(body.file_base64);
    let parsed;
    try { parsed = parseBogTravellers(readXlsxSheets(unzipSync(bytes))); }
    catch (e) { return json({ error: (e as Error).message }, 422); }

    const { data: ds, error: dErr } = await sb.from("stat_datasets").select("*").eq("code", CODE).single();
    if (dErr || !ds) throw new Error("Travellers dataset is not set up");
    const rows: StatRow[] = parsed.rows
      .filter((r) => r.period >= (parsed.frequency === "Q" ? ds.since_period : ds.since_period.replace(/-Q(\d)$/, (_: string, q: string) => `-${String((Number(q) - 1) * 3 + 1).padStart(2, "0")}`)))
      .map((r) => ({ geo: "EL", period: r.period, period_date: periodToDate(r.period)!, value: r.value, status_flag: r.status_flag }));
    if (!rows.length) return json({ error: `The file has no periods from ${ds.since_period} onwards.` }, 422);

    const existing = new Map<string, Existing>();
    const { data: obs } = await sb.from("stat_observations").select("geo, period, value, status_flag").eq("dataset_id", ds.id).limit(5000);
    for (const o of obs ?? []) existing.set(`${o.geo}|${o.period}`, { value: Number(o.value), status_flag: o.status_flag });
    if (existing.size && ds.frequency !== parsed.frequency) {
      return json({ error: `Stored figures are ${ds.frequency === "Q" ? "quarterly" : "monthly"} but this file is ${parsed.frequency === "Q" ? "quarterly" : "monthly"}; nothing was imported.` }, 422);
    }
    const { data: pend } = await sb.from("stat_revisions").select("geo, period").eq("dataset_id", ds.id).eq("status", "pending");
    const diff = diffObservations(rows, existing, new Set((pend ?? []).map((p) => `${p.geo}|${p.period}`)));
    const status = (r: StatRow) => diff.inserts.includes(r) ? "new" : diff.revisions.some((x) => x.row === r) ? "changed" : diff.flagUpdates.includes(r) ? "flag" : "unchanged";
    const summary = {
      frequency: parsed.frequency, notes: parsed.notes,
      rows: rows.map((r) => ({ period: r.period, value: r.value, provisional: r.status_flag === "p", status: status(r), previous: existing.get(`EL|${r.period}`)?.value ?? null })),
      new: diff.inserts.length, changed: diff.revisions.length, unchanged: diff.unchanged + diff.flagUpdates.length,
    };
    if (action === "preview") return json({ ok: true, ...summary });

    const now = new Date().toISOString();
    const { data: job, error: jErr } = await sb.from("stat_import_jobs").insert({ triggered_by: caller.userId ?? null, trigger: "admin" }).select("id").single();
    if (jErr) throw jErr;
    if (!existing.size && ds.frequency !== parsed.frequency) await sb.from("stat_datasets").update({ frequency: parsed.frequency }).eq("id", ds.id);
    const stamp = { source_updated_at: null, retrieved_at: now, import_job_id: job.id };
    if (diff.inserts.length) {
      const { error } = await sb.from("stat_observations").insert(diff.inserts.map((r) => ({ dataset_id: ds.id, ...r, ...stamp, status: "published" })));
      if (error) throw error;
    }
    for (const r of diff.flagUpdates) await sb.from("stat_observations").update({ status_flag: r.status_flag, ...stamp }).eq("dataset_id", ds.id).eq("geo", r.geo).eq("period", r.period);
    if (diff.revisions.length) {
      const { error } = await sb.from("stat_revisions").insert(diff.revisions.map(({ row, previous }) => ({
        dataset_id: ds.id, geo: row.geo, period: row.period, previous_value: previous.value, replacement_value: row.value,
        previous_flag: previous.status_flag, replacement_flag: row.status_flag, source_updated_at: null, import_job_id: job.id,
      })));
      if (error) throw error;
    }
    const { data: latest } = await sb.from("stat_observations").select("period, period_date").eq("dataset_id", ds.id).eq("status", "published").order("period_date", { ascending: false }).limit(1);
    await sb.from("stat_datasets").update({ status: "ok", last_error: null, last_checked_at: now, last_success_at: now, latest_period: latest?.[0]?.period ?? null }).eq("id", ds.id);
    await sb.from("stat_import_jobs").update({
      finished_at: now, status: "completed", datasets_checked: 1, datasets_skipped: 0, new_rows: diff.inserts.length,
      unchanged_rows: summary.unchanged, changed_rows: diff.revisions.length, rejected_rows: 0,
      report: { datasets: { [CODE]: `ok: ${diff.inserts.length} new, ${diff.revisions.length} revised (upload ${fileName})` }, notes: parsed.notes },
    }).eq("id", job.id);
    await sb.from("open_data_sources").update({
      enabled: true, status: "ok", last_error: null, last_checked_at: now, last_success_at: now,
      records_imported: diff.inserts.length, latest_period: latest?.[0]?.period_date ?? null,
    }).eq("slug", SOURCE_SLUG);
    return json({ ok: true, imported: true, ...summary });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
