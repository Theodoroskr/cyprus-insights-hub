import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { safeFetch, isPublicHttpsUrl } from "../_shared/publicUrl.ts";
import { nicosiaHour } from "../_shared/ecb.ts";
import { parseCpiSheet } from "../_shared/cpiWorkbook.ts";
import { INTEGRITY_SOURCES, extractLinks, contentFingerprint, nextCpiUrl, claimStatus, classifyFailure, healthChanged, isWorking, type SourceStatus } from "../_shared/integritySources.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UA = { "User-Agent": "Mozilla/5.0 (compatible; BusinessHubBot/1.0; +https://businesshub.cy)" };

// Backup reader for official sites that block plain requests (403) or have broken TLS certificates.
async function firecrawlHtml(url: string): Promise<{ ok: boolean; html: string; status?: number; finalUrl: string; error?: string }> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return { ok: false, html: "", finalUrl: url, error: "backup reader not configured" };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["rawHtml"], onlyMainContent: false, waitFor: 2000, timeout: 45000 }),
      signal: AbortSignal.timeout(55000),
    });
    const d = await res.json().catch(() => ({}));
    const status = d.data?.metadata?.statusCode;
    const html = d.data?.rawHtml ?? "";
    const finalUrl = d.data?.metadata?.url ?? d.data?.metadata?.sourceURL ?? url;
    if (!res.ok || d.success === false) return { ok: false, html: "", status, finalUrl, error: `backup reader ${res.status}` };
    return { ok: !!html && (!status || status < 400), html, status, finalUrl };
  } catch (e) { return { ok: false, html: "", finalUrl: url, error: e instanceof Error ? e.message : String(e) }; }
}
const blockedOrTls = (http: number | undefined, e: unknown) => http === 403 || http === 401 || http === 429 || /certificate|ssl|tls|handshake|secure connection/i.test(String(e));

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

  // Editor upload: validate the whole workbook, then replace the staged copy of that edition.
  // Published figures are untouched until "publish-cpi".
  if (action === "stage-cpi") {
    const parsed = parseCpiSheet(Array.isArray(body.table) ? (body.table as unknown[][]) : []);
    if ("errors" in parsed) return json({ error: "Workbook rejected", errors: parsed.errors }, 400);
    if (parsed.rows.length < 100) return json({ error: `Only ${parsed.rows.length} countries found; a full edition is expected` }, 400);
    const year = parsed.year;
    const release = typeof body.release_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.release_date) ? body.release_date : null;
    const { data: names } = await sb.from("cpi_results").select("country_iso3,country_name_el").not("country_name_el", "is", null);
    const el = new Map((names ?? []).map((n: any) => [n.country_iso3, n.country_name_el]));
    const { data: ed } = await sb.from("cpi_editions").select("edition_year,status").eq("edition_year", year).maybeSingle();
    if (!ed) {
      const { error } = await sb.from("cpi_editions").insert({ edition_year: year, status: "staged", release_date: release, countries_covered: parsed.rows.length, source_url: `https://www.transparency.org/en/cpi/${year}` });
      if (error) return json({ error: error.message }, 400);
    } else if (release && ed.status !== "published") {
      await sb.from("cpi_editions").update({ release_date: release }).eq("edition_year", year);
    }
    await sb.from("cpi_results").delete().eq("edition_year", year).eq("status", "staged");
    const { error } = await sb.from("cpi_results").insert(parsed.rows.map((r) => ({ ...r, edition_year: year, status: "staged", country_name_el: el.get(r.country_iso3) ?? null })));
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, year, staged: parsed.rows.length });
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

  if (action === "sources") {
    const { data: h } = await sb.from("integrity_source_health").select("*");
    const by = new Map((h ?? []).map((r: any) => [r.slug, r]));
    const list = [{ slug: "ti-cpi", publisher: "Transparency International (CPI)", url: nextCpiUrl(2025) }, ...INTEGRITY_SOURCES]
      .map((s) => ({ slug: s.slug, publisher: s.publisher, default_url: s.url, ...(by.get(s.slug) ?? {}), url: by.get(s.slug)?.url_override ?? s.url }));
    return json({ ok: true, sources: list });
  }

  if (action === "set-source") {
    const slug = String(body.slug ?? "");
    if (!INTEGRITY_SOURCES.some((s) => s.slug === slug) && slug !== "ti-cpi") return json({ error: "Unknown source" }, 400);
    const patch: Record<string, unknown> = { slug, updated_at: new Date().toISOString() };
    if ("manual_only" in body) patch.manual_only = !!body.manual_only;
    if ("url" in body) {
      const u = body.url === null || body.url === "" ? null : String(body.url);
      if (u && !/^https:\/\/[^\s]+$/.test(u)) return json({ error: "Address must start with https://" }, 400);
      patch.url_override = u;
    }
    await sb.from("integrity_source_health").upsert(patch, { onConflict: "slug" });
    return json({ ok: true });
  }

  // test / check: never touches published figures; failures are recorded per source.
  const { data: run } = action === "test" ? { data: null } : await sb.from("integrity_check_runs").insert({ trigger: via === "schedule" ? "cron" : "manual" }).select("id").single();
  const results: { source: string; ok: boolean; found?: number; added?: number; error?: string; status?: SourceStatus; http?: number }[] = [];
  const isTest = action === "test";
  const { data: healthRows } = await sb.from("integrity_source_health").select("*");
  const health = new Map((healthRows ?? []).map((r: any) => [r.slug, r]));
  const only = typeof body.slug === "string" ? body.slug : null;
  const fetchUrl: string | null = null; // caller-supplied test addresses are no longer accepted

  // 1. New CPI edition?
  if (!only || only === "ti-cpi") {
    try {
      const { data: latest } = await sb.from("cpi_editions").select("edition_year").eq("status", "published").order("edition_year", { ascending: false }).limit(1).maybeSingle();
      const url = fetchUrl ?? nextCpiUrl(latest?.edition_year ?? 2025);
      let r: { ok: boolean; status: number; url: string };
      try { const d = await safeFetch(url, { headers: UA }); r = { ok: d.ok, status: d.status, url: d.url }; } catch (e) { r = { ok: false, status: 0, url }; if (!blockedOrTls(undefined, e)) throw e; }
      if (!r.ok && r.status !== 404) { // blocked: ask the backup reader
        const b = await firecrawlHtml(url);
        if (b.status) r = { ok: b.ok, status: b.status, url: b.finalUrl };
        else if (!b.ok) throw new Error(r.status ? `HTTP ${r.status}` : b.error);
      }
      const fresh = r.ok && new URL(r.url).pathname.includes(String((latest?.edition_year ?? 2025) + 1));
      if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`); // 404 = next edition not out yet
      results.push({ source: "ti-cpi", ok: true, found: fresh ? 1 : 0, status: "ok", http: r.status });
      if (fresh && !isTest) {
        await sb.from("integrity_source_updates").upsert({
          publisher: "Transparency International", title: `New Corruption Perceptions Index edition detected (${(latest?.edition_year ?? 2025) + 1})`,
          canonical_url: url, content_hash: contentFingerprint(url), audience: ["cy", "gr", "intl"], claim_status: "development",
          summary: "Stage the new dataset and review before publishing.",
        }, { onConflict: "canonical_url,content_hash", ignoreDuplicates: true });
      }
      await sb.from("open_data_sources").update({ last_checked_at: new Date().toISOString() }).eq("slug", "ti-cpi");
    } catch (e) { const c = classifyFailure(e, /HTTP (\d+)/.exec(String(e))?.[1] ? Number(/HTTP (\d+)/.exec(String(e))![1]) : undefined); results.push({ source: "ti-cpi", ok: false, error: c.reason, status: c.status }); }
  }

  // 2. Official developments.
  for (const s of INTEGRITY_SOURCES) {
    if (only && only !== s.slug) continue;
    const h = health.get(s.slug);
    if (h?.manual_only && !only) { results.push({ source: s.slug, ok: true, status: h.last_status, found: 0, error: "manual check" }); continue; }
    const url = typeof body.url === "string" && only === s.slug ? body.url : (h?.url_override ?? s.url);
    if (!isPublicHttpsUrl(url)) { results.push({ source: s.slug, ok: false, error: "Address must be a public https:// link", status: "error" as SourceStatus }); continue; }
    let http: number | undefined;
    try {
      let html = "", base = url;
      try {
        const r = await safeFetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
        http = r.status;
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        html = await r.text(); base = r.url;
      } catch (e) {
        if (!blockedOrTls(http, e)) throw e;
        const b = await firecrawlHtml(url);
        if (!b.ok) { if (b.status) http = b.status; throw e; }
        html = b.html; base = b.finalUrl; http = b.status ?? 200;
      }
      const links = extractLinks(html, base, s.keywords);
      let added = 0;
      if (!isTest) for (const l of links) {
        const { data } = await sb.from("integrity_source_updates").upsert({
          publisher: s.publisher, title: l.title, canonical_url: l.url, content_hash: contentFingerprint(l.title),
          audience: s.audience, claim_status: claimStatus(l.title),
        }, { onConflict: "canonical_url,content_hash", ignoreDuplicates: true }).select("id");
        added += data?.length ?? 0;
      }
      results.push({ source: s.slug, ok: true, found: links.length, added, status: links.length ? "ok" : "empty", http });
    } catch (e) {
      const c = classifyFailure(e, http);
      results.push({ source: s.slug, ok: false, error: c.reason, status: c.status, http });
    }
  }

  // per-source health + alerts on state change (tests with a candidate URL don't record)
  const now = new Date().toISOString();
  const changes: string[] = [];
  for (const r of results) {
    if (r.error === "manual check" || typeof body.url === "string" || fetchUrl) continue;
    const prev = health.get(r.source);
    const st = (r.status ?? (r.ok ? "ok" : "error")) as SourceStatus;
    if (healthChanged(prev?.last_status, st)) changes.push(`${r.source}: ${isWorking(st) ? "working again" : r.error}`);
    await sb.from("integrity_source_health").upsert({
      slug: r.source, last_status: st, last_http_code: r.http ?? null, last_error: r.ok ? null : r.error, last_found: r.found ?? null,
      last_attempt_at: now, ...(r.ok ? { last_success_at: now, consecutive_failures: 0 } : { consecutive_failures: (prev?.consecutive_failures ?? 0) + 1 }), updated_at: now,
    }, { onConflict: "slug" });
  }
  if (changes.length) {
    const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) await sb.from("notifications").insert(admins.map((a: any) => ({ user_id: a.user_id, type: "integrity_source", title: "Corruption data source status changed", body: changes.join("; ").slice(0, 900), href: "/editorial" })));
  }
  if (isTest) return json({ ok: true, status: results[0]?.ok ? "ok" : "failed", results });

  const failed = results.filter((r) => !r.ok && r.error !== "manual check");
  const status = failed.length === 0 ? "ok" : failed.length === results.length ? "failed" : "partial";
  if (run) await sb.from("integrity_check_runs").update({ finished_at: new Date().toISOString(), status, results, error: failed.map((f) => `${f.source}: ${f.error}`).join("; ") || null }).eq("id", run.id);
  return json({ ok: true, status, results });
});
