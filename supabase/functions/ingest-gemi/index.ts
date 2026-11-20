import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { GEMI_API, GEMI_KEY_NAME, GEMI_SOURCE_SLUG, testGemiKey } from "../_shared/gemi.ts";
import { countMonths, GEMI_ACTIVE_CODE, GEMI_NEW_CODE, GEMI_SINCE, monthOf, monthsBetween, nextMonth, parseGemiDate, type GemiPage } from "../_shared/gemiRegister.ts";

/**
 * GEMI business-register importer: active businesses (running count for the current month, provisional
 * until the month ends) and new registrations per completed month. New months publish; a changed count
 * for a stored month goes to stat_revisions for an admin. A failed run never touches stored figures.
 */
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BUDGET_MS = 100_000;
const PAGE = 100;
const RECHECK_MONTHS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let via: "schedule" | "admin" | "cron" | "service" = "schedule";
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    via = caller.via;
  }
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const hop = Math.max(0, Number(body.hop ?? 0) || 0);
  const started = Date.now();
  const now = new Date();
  const stamp = now.toISOString();

  const fail = async (msg: string, status = 502) => {
    await sb.from("open_data_sources").update({ status: "error", last_error: msg.slice(0, 500), last_checked_at: stamp }).eq("slug", GEMI_SOURCE_SLUG);
    await sb.from("stat_datasets").update({ status: "error", last_error: msg.slice(0, 500), last_checked_at: stamp }).in("code", [GEMI_ACTIVE_CODE, GEMI_NEW_CODE]);
    return json({ ok: false, error: msg }, status);
  };

  const { data: keyRow } = await sb.from("internal_secrets").select("value").eq("name", GEMI_KEY_NAME).maybeSingle();
  // No key yet: nothing to import and nothing to flag (the cards say they are waiting for the first import).
  if (!keyRow?.value) return json({ ok: false, skipped: true, error: "No GEMI access key saved. Add it in Editorial → Data sources." }, via === "admin" ? 400 : 200);
  const key = keyRow.value as string;

  // Imports run only on a key that passes the connection test right now.
  if (hop === 0) {
    const t = await testGemiKey(key);
    if (!t.ok) return fail(`Connection test failed: ${t.message}`);
  }

  // deno-lint-ignore no-explicit-any
  const gemi = async (params: Record<string, string | number | boolean>): Promise<any> => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    let last = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await sleep(attempt * 10_000);
      try {
        const res = await fetch(`${GEMI_API}/companies?${qs}`, { headers: { api_key: key, Accept: "application/json" }, signal: AbortSignal.timeout(40_000) });
        if (res.status === 429 || res.status >= 500) { last = `HTTP ${res.status}`; await res.body?.cancel(); continue; }
        if (!res.ok) throw new Error(`GEMI HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const b = await res.json();
        if (typeof b?.searchMetadata?.totalCount !== "number" || !Array.isArray(b?.searchResults)) throw new Error("GEMI answer is not a search result");
        await sleep(250);
        return b;
      } catch (e) { last = (e as Error).message; if (/^GEMI /.test(last)) throw e; }
    }
    throw new Error(`GEMI unavailable (${last}); stored figures kept`);
  };

  try {
    const { data: dsRows } = await sb.from("stat_datasets").select("id, code").in("code", [GEMI_ACTIVE_CODE, GEMI_NEW_CODE]);
    const dsId = Object.fromEntries((dsRows ?? []).map((d: { id: string; code: string }) => [d.code, d.id]));
    if (!dsId[GEMI_ACTIVE_CODE] || !dsId[GEMI_NEW_CODE]) throw new Error("GEMI datasets are not set up");
    const report: Record<string, unknown> = {};

    // 1) Active businesses: one count, stored for the current month (provisional until the month ends).
    if (hop === 0) {
      const a = await gemi({ isActive: true, resultsSize: 1 });
      const period = monthOf(now);
      const active = a.searchMetadata.totalCount as number;
      if (!(active > 0)) throw new Error("GEMI returned no active businesses; stored figures kept");
      const { error } = await sb.from("stat_observations").upsert({
        dataset_id: dsId[GEMI_ACTIVE_CODE], geo: "EL", period, period_date: `${period}-01`, value: active,
        status_flag: "p", retrieved_at: stamp, source_updated_at: stamp, status: "published",
      }, { onConflict: "dataset_id,geo,period" });
      if (error) throw error;
      // Earlier months keep their last count of the month and stop being provisional.
      await sb.from("stat_observations").update({ status_flag: null }).eq("dataset_id", dsId[GEMI_ACTIVE_CODE]).lt("period", period).eq("status_flag", "p");
      report.active = { period, value: active };
    }

    // 2) New registrations for completed months: missing months + the last few (late filings) re-checked.
    const current = monthOf(now);
    const all = monthsBetween(GEMI_SINCE, current);
    const { data: have } = await sb.from("stat_observations").select("period, value").eq("dataset_id", dsId[GEMI_NEW_CODE]).eq("geo", "EL");
    const stored = new Map((have ?? []).map((r: { period: string; value: number }) => [r.period, Number(r.value)]));
    const before = typeof body.before === "string" && /^\d{4}-\d{2}$/.test(body.before) ? body.before : current;
    const todo = all.filter((p) => p < before && (!stored.has(p) || all.indexOf(p) >= all.length - RECHECK_MONTHS)).reverse(); // newest first

    let added = 0, revisions = 0, unchanged = 0, next: string | null = null;
    if (todo.length) {
      const head = await gemi({ resultsSortBy: "-incorporationDate", resultsOffset: 0, resultsSize: PAGE });
      const total = head.searchMetadata.totalCount as number;
      // deno-lint-ignore no-explicit-any
      const dateOf = (r: any) => parseGemiDate(r?.incorporationDate);
      const nullsFirst = head.searchResults.length > 0 && dateOf(head.searchResults[0]) === null;
      if (!nullsFirst && head.searchResults.length && !head.searchResults.some(dateOf)) throw new Error("GEMI incorporation dates could not be read");
      const headDates = head.searchResults.map(dateOf).filter(Boolean) as string[];
      if (headDates.some((d, i) => i > 0 && d > headDates[i - 1])) throw new Error("GEMI did not sort by incorporation date; stored figures kept");
      const cache = new Map<number, GemiPage>([[0, { dates: head.searchResults.map(dateOf) }]]);
      const probe = async (offset: number): Promise<GemiPage> => {
        if (cache.has(offset)) return cache.get(offset)!;
        const b = await gemi({ resultsSortBy: "-incorporationDate", resultsOffset: offset, resultsSize: PAGE });
        const page = { dates: b.searchResults.map(dateOf) };
        cache.set(offset, page);
        return page;
      };
      const { data: pend } = await sb.from("stat_revisions").select("period").eq("dataset_id", dsId[GEMI_NEW_CODE]).eq("geo", "EL").eq("status", "pending");
      const pending = new Set((pend ?? []).map((p: { period: string }) => p.period));

      const counted = await countMonths(probe, total, todo, { nullsFirst, pageSize: PAGE, outOfTime: () => Date.now() - started > BUDGET_MS });
      next = counted.next;
      for (const [p, v] of counted.values) if (!(v >= 0)) throw new Error(`GEMI counts for ${p} are inconsistent (${v}); stored figures kept`);
      for (const [p, value] of counted.values) {
        const prev = stored.get(p);
        if (prev === undefined) {
          const { error } = await sb.from("stat_observations").insert({ dataset_id: dsId[GEMI_NEW_CODE], geo: "EL", period: p, period_date: `${p}-01`, value, retrieved_at: stamp, source_updated_at: stamp, status: "published" });
          if (error) throw error;
          added++;
        } else if (prev !== value && !pending.has(p)) {
          const { error } = await sb.from("stat_revisions").insert({ dataset_id: dsId[GEMI_NEW_CODE], geo: "EL", period: p, previous_value: prev, replacement_value: value, source_updated_at: stamp });
          if (error) throw error;
          revisions++;
        } else unchanged++;
      }
    }
    report.new_registrations = { added, revisions, unchanged, next };

    const { data: latestNew } = await sb.from("stat_observations").select("period").eq("dataset_id", dsId[GEMI_NEW_CODE]).order("period", { ascending: false }).limit(1);
    const okStamp = { status: "ok", last_error: null, last_checked_at: stamp, last_success_at: stamp };
    await sb.from("stat_datasets").update({ ...okStamp, latest_period: current, source_updated_at: stamp }).eq("code", GEMI_ACTIVE_CODE);
    await sb.from("stat_datasets").update({ ...okStamp, latest_period: latestNew?.[0]?.period ?? null, source_updated_at: stamp }).eq("code", GEMI_NEW_CODE);
    await sb.from("open_data_sources").update({ ...okStamp, records_imported: added + (hop === 0 ? 1 : 0), latest_period: latestNew?.[0]?.period ? `${latestNew[0].period}-01` : null }).eq("slug", GEMI_SOURCE_SLUG);

    // A long first import carries on in a fresh call.
    if (next && hop < 10) {
      const cont = fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ingest-gemi`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ before: next, hop: hop + 1 }),
      }).catch(() => undefined);
      // deno-lint-ignore no-explicit-any
      (globalThis as any).EdgeRuntime?.waitUntil?.(cont);
    }
    return json({ ok: true, via, ...report });
  } catch (e) {
    return fail((e as Error).message);
  }
});
