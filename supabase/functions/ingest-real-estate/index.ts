import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import {
  decodeCsv, detectDataset, discoverResourceLinks, parseSaleContracts, parseTransfers,
} from "../_shared/realEstateParse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Dataset = "sale_contracts" | "transfers";
const TABLE: Record<Dataset, string> = { sale_contracts: "re_sale_contracts", transfers: "re_transfers" };
const FIELDS: Record<Dataset, string[]> = {
  sale_contracts: ["contract_count"],
  transfers: ["transfer_cases", "parcel_count", "declared_value_eur", "accepted_value_eur"],
};

async function sha256(bytes: Uint8Array) {
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
type Sb = any;

async function importFile(sb: Sb, source: { id: string; dataset_type: Dataset }, filename: string, bytes: Uint8Array, opts: { force?: boolean; userId?: string }) {
  const checksum = await sha256(bytes);
  if (!opts.force) {
    const { data: prev } = await sb.from("re_import_batches").select("id").eq("source_id", source.id).eq("file_checksum", checksum).eq("status", "completed").limit(1);
    if (prev?.length) return { filename, skipped: "unchanged file" };
  }
  const text = decodeCsv(bytes);
  const detected = detectDataset(text);
  if (detected !== source.dataset_type) throw new Error(`${filename}: columns don't match ${source.dataset_type}`);
  const parsed = source.dataset_type === "sale_contracts" ? parseSaleContracts(text) : parseTransfers(text);
  const fields = FIELDS[source.dataset_type];
  const table = TABLE[source.dataset_type];

  const { data: batch, error: bErr } = await sb.from("re_import_batches").insert({
    source_id: source.id, filename, file_checksum: checksum, imported_by: opts.userId ?? null,
    total_rows: parsed.total, valid_rows: parsed.rows.length, rejected_rows: parsed.rejected.length, status: "running",
  }).select("id").single();
  if (bErr) throw bErr;

  const periods = [...new Set(parsed.rows.map((r) => r.period_date))];
  const existing = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < periods.length; i += 100) {
    const { data } = await sb.from(table).select(`district_code, period_date, ${fields.join(",")}`).in("period_date", periods.slice(i, i + 100));
    for (const r of data ?? []) existing.set(`${r.district_code}|${r.period_date}`, r);
  }

  const toUpsert: Record<string, unknown>[] = [];
  const revisions: Record<string, unknown>[] = [];
  let unchanged = 0, added = 0;
  for (const row of parsed.rows as Record<string, unknown>[]) {
    const key = `${row.district_code}|${row.period_date}`;
    const old = existing.get(key);
    const hasValue = fields.some((f) => row[f] !== null);
    if (!old) {
      if (!hasValue) continue; // never store empty future months
      toUpsert.push({ ...row, source_id: source.id, import_batch_id: batch.id, status: "published" });
      added++; continue;
    }
    const diff = fields.filter((f) => Number(old[f] ?? NaN) !== Number(row[f] ?? NaN) && !(old[f] == null && row[f] == null));
    if (!diff.length) { unchanged++; continue; }
    const oldEmpty = fields.every((f) => old[f] == null);
    if (oldEmpty) {
      toUpsert.push({ ...row, source_id: source.id, import_batch_id: batch.id, status: "published" });
      added++; continue;
    }
    if (!hasValue) { unchanged++; continue; } // a blank cell never wipes a published figure
    revisions.push({
      dataset_type: source.dataset_type, district_code: row.district_code, period_date: row.period_date,
      previous_values: Object.fromEntries(fields.map((f) => [f, old[f]])),
      replacement_values: Object.fromEntries(fields.map((f) => [f, row[f]])),
      source_batch_id: batch.id, reason: `Official file ${filename} reports different figures`,
    });
  }
  for (let i = 0; i < toUpsert.length; i += 500) {
    const { error } = await sb.from(table).upsert(toUpsert.slice(i, i + 500), { onConflict: "district_code,period_date" });
    if (error) throw error;
  }
  let changed = 0;
  for (const r of revisions) {
    const { data: dup } = await sb.from("re_revisions").select("id").eq("status", "pending").eq("dataset_type", r.dataset_type)
      .eq("district_code", r.district_code).eq("period_date", r.period_date).limit(1);
    if (dup?.length) { await sb.from("re_revisions").update(r).eq("id", dup[0].id); } else { await sb.from("re_revisions").insert(r); }
    changed++;
  }
  await sb.from("re_import_batches").update({
    new_rows: added, unchanged_rows: unchanged, changed_rows: changed, status: "completed",
    validation_report: { rejected: parsed.rejected.slice(0, 200), periods: periods.length },
  }).eq("id", batch.id);
  return { filename, added, unchanged, revisions: changed, rejected: parsed.rejected.length };
}

async function refreshSourceStatus(sb: Sb, source: { id: string; dataset_type: Dataset }, extra: Record<string, unknown>) {
  const { data: latest } = await sb.from(TABLE[source.dataset_type]).select("period_date").eq("status", "published").order("period_date", { ascending: false }).limit(1);
  const next = new Date(); next.setUTCMonth(next.getUTCMonth() + 1); next.setUTCDate(20); next.setUTCHours(6, 0, 0, 0);
  await sb.from("re_sources").update({ latest_reporting_period: latest?.[0]?.period_date ?? null, next_check_at: next.toISOString(), last_checked_at: new Date().toISOString(), ...extra }).eq("id", source.id);
  // Mirror status into the central open-data registry
  const reg: Record<string, unknown> = { latest_period: latest?.[0]?.period_date ?? null, last_checked_at: new Date().toISOString() };
  if (typeof extra.status === "string") reg.status = extra.status;
  if ("last_error" in extra) reg.last_error = extra.last_error;
  if (extra.last_successful_import_at) reg.last_success_at = extra.last_successful_import_at;
  await sb.from("open_data_sources").update(reg).eq("slug", source.dataset_type === "sale_contracts" ? "dls-sale-contracts" : "dls-transfers");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);
  const userId = caller.via === "admin" ? caller.userId : undefined;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body = scheduled check */ }
  const action = String(body.action ?? "check");
  const { data: sources } = await sb.from("re_sources").select("id, dataset_type, official_dataset_url");

  try {
    if (action === "check") {
      const results: Record<string, unknown>[] = [];
      for (const s of sources ?? []) {
        try {
          const page = await fetch(s.official_dataset_url, { signal: AbortSignal.timeout(30000) });
          if (!page.ok) throw new Error(`Portal returned HTTP ${page.status}`);
          const links = discoverResourceLinks(await page.text());
          if (!links.length) throw new Error("No CSV files found on the dataset page");
          const files: Record<string, unknown>[] = [];
          for (const url of links) {
            const name = decodeURIComponent(url.split("/").pop()!);
            try {
              const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              files.push(await importFile(sb, s, name, new Uint8Array(await r.arrayBuffer()), { force: body.force === true, userId }));
            } catch (e) { files.push({ filename: name, error: (e as Error).message }); }
          }
          const failed = files.filter((f) => f.error);
          await refreshSourceStatus(sb, s, {
            resource_urls: { files: links },
            status: failed.length ? "warning" : "ok",
            last_error: failed.length ? failed.map((f) => `${f.filename}: ${f.error}`).join("; ").slice(0, 1000) : null,
            ...(failed.length < files.length ? { last_successful_import_at: new Date().toISOString() } : {}),
          });
          results.push({ dataset: s.dataset_type, files });
        } catch (e) {
          await sb.from("re_sources").update({ status: "error", last_error: (e as Error).message, last_checked_at: new Date().toISOString() }).eq("id", s.id);
          results.push({ dataset: s.dataset_type, error: (e as Error).message });
        }
      }
      return json({ ok: true, results });
    }

    if (caller.via !== "admin") return json({ error: "Admins only" }, 403);

    if (action === "upload") {
      const text = String(body.csv ?? "");
      if (!text || text.length > 2_000_000) return json({ error: "Provide a CSV under 2 MB" }, 400);
      const dataset = detectDataset(text);
      const s = (sources ?? []).find((x: { dataset_type: string }) => x.dataset_type === dataset);
      if (!s) return json({ error: "File columns don't match either property dataset" }, 400);
      const res = await importFile(sb, s, String(body.filename ?? "manual-upload.csv").slice(0, 200), new TextEncoder().encode(text), { force: true, userId });
      await refreshSourceStatus(sb, s, { last_successful_import_at: new Date().toISOString() });
      return json({ ok: true, dataset, ...res });
    }

    if (action === "approve_revision" || action === "reject_revision") {
      const { data: rev } = await sb.from("re_revisions").select("*").eq("id", String(body.id)).eq("status", "pending").maybeSingle();
      if (!rev) return json({ error: "Revision not found" }, 404);
      if (action === "approve_revision") {
        const { error } = await sb.from(TABLE[rev.dataset_type as Dataset]).update({ ...rev.replacement_values, import_batch_id: rev.source_batch_id })
          .eq("district_code", rev.district_code).eq("period_date", rev.period_date);
        if (error) throw error;
      }
      await sb.from("re_revisions").update({ status: action === "approve_revision" ? "approved" : "rejected", approved_by: userId, decided_at: new Date().toISOString() }).eq("id", rev.id);
      return json({ ok: true });
    }

    if (action === "rollback_batch") {
      const id = String(body.id);
      const { data: batch } = await sb.from("re_import_batches").select("id, source_id").eq("id", id).maybeSingle();
      if (!batch) return json({ error: "Batch not found" }, 404);
      const s = (sources ?? []).find((x: { id: string }) => x.id === batch.source_id);
      const { count } = await sb.from(TABLE[s.dataset_type as Dataset]).delete({ count: "exact" }).eq("import_batch_id", id);
      await sb.from("re_revisions").update({ status: "rejected", decided_at: new Date().toISOString(), approved_by: userId }).eq("source_batch_id", id).eq("status", "pending");
      await sb.from("re_import_batches").update({ status: "rolled_back" }).eq("id", id);
      await refreshSourceStatus(sb, s, {});
      return json({ ok: true, removed: count });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
