import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { nicosiaHour } from "../_shared/ecb.ts";
import { INTEGRITY_SOURCES, extractLinks, contentFingerprint, nextCpiUrl, claimStatus } from "../_shared/integritySources.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UA = { "User-Agent": "Mozilla/5.0 (compatible; BusinessHubBot/1.0; +https://businesshub.cy)" };

const HEAD = {
  cy: ["What happened", "Why it matters", "What to do or watch"],
  intl: ["What happened", "Why it matters", "What to do or watch"],
  gr: ["Τι συνέβη", "Γιατί έχει σημασία", "Τι να παρακολουθήσουμε"],
};
const LABEL: Record<string, [string, string]> = {
  investigation: ["Investigation — no finding of wrongdoing", "Έρευνα — δεν έχει διαπιστωθεί παράβαση"],
  finding: ["Official finding", "Επίσημο πόρισμα"],
  ruling: ["Final ruling", "Τελική απόφαση"],
  development: ["Official development", "Επίσημη εξέλιξη"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let via = "schedule";
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    via = caller.via;
  }
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* scheduled */ }
  if (via === "schedule" && typeof body.local_hour === "number" && nicosiaHour(new Date()) !== body.local_hour) return json({ ok: true, status: "skipped" });
  const action = String(body.action ?? "check");

  if (action === "publish-cpi") {
    const year = Number(body.year);
    if (!Number.isInteger(year)) return json({ error: "year required" }, 400);
    const { error } = await sb.rpc("publish_cpi_edition", { _year: year });
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  if (action === "approve-update") {
    const id = String(body.id ?? "");
    const { data: u } = await sb.from("integrity_source_updates").select("*").eq("id", id).maybeSingle();
    if (!u) return json({ error: "Update not found" }, 404);
    const ids: string[] = [];
    for (const aud of u.audience as ("cy" | "gr" | "intl")[]) {
      const el = aud === "gr";
      const h = HEAD[aud];
      const label = LABEL[u.claim_status]?.[el ? 1 : 0] ?? "";
      const src = `${el ? "Πηγή" : "Source"}: ${u.publisher}, [${u.canonical_url}](${u.canonical_url}). ${el ? "Δημοσίευση" : "Published"}: ${u.published_at ?? (el ? "μη διαθέσιμο" : "unavailable")}. ${el ? "Έλεγχος" : "Checked"}: ${String(u.checked_at).slice(0, 10)}.`;
      const happened = `**${label}.** ${u.publisher} ${el ? "δημοσίευσε" : "published"}: “${el ? (u.title_el ?? u.title) : u.title}”.\n\n${src}`;
      const todo = el ? "Προς συμπλήρωση από τη σύνταξη, με απόδοση κάθε ισχυρισμού στην πηγή." : "Editor to complete, attributing each claim to the source.";
      const row: Record<string, unknown> = {
        title: u.title, status: "draft", vertical: "compliance", source_url: u.canonical_url, source_id: "integrity",
        tags: ["corruption", "public-integrity", aud === "intl" ? "international" : aud],
        edition: el ? ["gr"] : ["cy"], greece_related: el,
        what_happened: happened, why_it_matters: todo, what_to_do: todo,
        body_markdown: `## ${h[0]}\n\n${happened}\n\n## ${h[1]}\n\n${todo}\n\n## ${h[2]}\n\n${todo}`,
      };
      if (el) Object.assign(row, { title_el: u.title_el ?? u.title, what_happened_el: happened, why_it_matters_el: todo, what_to_do_el: todo, body_el: row.body_markdown, original_language: "el" });
      const { data: a, error } = await sb.from("cna_articles").insert(row).select("id").single();
      if (error) return json({ error: error.message }, 400);
      ids.push(a.id);
    }
    await sb.from("integrity_source_updates").update({ status: "drafted", article_ids: ids }).eq("id", id);
    return json({ ok: true, drafts: ids.length });
  }

  if (action === "dismiss-update") {
    await sb.from("integrity_source_updates").update({ status: "dismissed" }).eq("id", String(body.id ?? ""));
    return json({ ok: true });
  }

  // check: never touches published figures; failures are recorded per source.
  const { data: run } = await sb.from("integrity_check_runs").insert({ trigger: via === "schedule" ? "cron" : "manual" }).select("id").single();
  const results: { source: string; ok: boolean; found?: number; added?: number; error?: string }[] = [];
  const only = typeof body.slug === "string" ? body.slug : null;
  const fetchUrl = typeof body.test_fail_url === "string" ? body.test_fail_url : null; // simulate a failing source

  // 1. New CPI edition?
  if (!only || only === "ti-cpi") {
    try {
      const { data: latest } = await sb.from("cpi_editions").select("edition_year").eq("status", "published").order("edition_year", { ascending: false }).limit(1).maybeSingle();
      const url = fetchUrl ?? nextCpiUrl(latest?.edition_year ?? 2025);
      const r = await fetch(url, { headers: UA, redirect: "follow" });
      const fresh = r.ok && new URL(r.url).pathname.includes(String((latest?.edition_year ?? 2025) + 1));
      if (fetchUrl && !r.ok) throw new Error(`HTTP ${r.status}`);
      results.push({ source: "ti-cpi", ok: true, found: fresh ? 1 : 0 });
      if (fresh) {
        await sb.from("integrity_source_updates").upsert({
          publisher: "Transparency International", title: `New Corruption Perceptions Index edition detected (${(latest?.edition_year ?? 2025) + 1})`,
          canonical_url: url, content_hash: contentFingerprint(url), audience: ["cy", "gr", "intl"], claim_status: "development",
          summary: "Stage the new dataset and review before publishing.",
        }, { onConflict: "canonical_url,content_hash", ignoreDuplicates: true });
      }
      await sb.from("open_data_sources").update({ last_checked_at: new Date().toISOString() }).eq("slug", "ti-cpi");
    } catch (e) { results.push({ source: "ti-cpi", ok: false, error: String(e instanceof Error ? e.message : e) }); }
  }

  // 2. Official developments.
  for (const s of INTEGRITY_SOURCES) {
    if (only && only !== s.slug) continue;
    try {
      const r = await fetch(s.url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const links = extractLinks(await r.text(), r.url, s.keywords);
      let added = 0;
      for (const l of links) {
        const { data } = await sb.from("integrity_source_updates").upsert({
          publisher: s.publisher, title: l.title, canonical_url: l.url, content_hash: contentFingerprint(l.title),
          audience: s.audience, claim_status: claimStatus(l.title),
        }, { onConflict: "canonical_url,content_hash", ignoreDuplicates: true }).select("id");
        added += data?.length ?? 0;
      }
      results.push({ source: s.slug, ok: true, found: links.length, added });
    } catch (e) { results.push({ source: s.slug, ok: false, error: String(e instanceof Error ? e.message : e) }); }
  }

  const failed = results.filter((r) => !r.ok);
  const status = failed.length === 0 ? "ok" : failed.length === results.length ? "failed" : "partial";
  if (run) await sb.from("integrity_check_runs").update({ finished_at: new Date().toISOString(), status, results, error: failed.map((f) => `${f.source}: ${f.error}`).join("; ") || null }).eq("id", run.id);
  return json({ ok: true, status, results });
});
