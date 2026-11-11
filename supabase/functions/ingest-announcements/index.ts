// Company Announcements importer.
// listed  : Cyprus Stock Exchange OAM filings for tracked issuers (primary) + issuer IR pages (attached as supporting links)
// deals   : discovery pages (CBN, Invest Cyprus, Tech Funding Map) + company searches → draft deals for review
// summarise: BusinessHub's own short summary for new filings; auto-publishes when the source allows it
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { classifyDisclosure, groupOamItems, oamCardUrl, oamLanguage, isSameEvent, industryLabel, isGreekText, looksLikeDeal, classifyDealType, type AnnouncementType, type OamItem } from "../_shared/announcements.ts";
import { normalizeCompanyName, resolveCompanies } from "../_shared/companyMatcher.ts";
import { firecrawlScrape, firecrawlSearch, extractIssuerList, summariseDisclosure, extractDealCandidates, extractDealDetails, type DealDetails } from "../_shared/announcementAi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const OAM = "https://publicoam.cse.com.cy/xak-public-pages-server/api";
const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const htmlToText = (h: string) => h.replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const validDate = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) && !isNaN(Date.parse(s.slice(0, 10))) ? s.slice(0, 10) : null);

// deno-lint-ignore no-explicit-any
type Sb = any;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function health(sb: Sb, id: string, ok: boolean, found: number, fresh: number, error?: string | null) {
  const now = new Date().toISOString();
  await sb.from("announcement_sources").update({
    last_run_at: now, last_found_items: found, last_new_items: fresh,
    ...(ok ? { last_success_at: now, last_error: null, last_error_at: null } : { last_error: (error ?? "Failed").slice(0, 500), last_error_at: now }),
  }).eq("id", id);
}

const due = (s: Row, force: boolean) => force || !s.last_run_at || Date.now() - Date.parse(s.last_run_at) > (s.check_interval_hours ?? 24) * 3600000 - 15 * 60000;

async function addLinks(sb: Sb, announcementId: string, links: Row[]) {
  if (!links.length) return;
  await sb.from("company_announcement_sources").upsert(links.map((l) => ({ ...l, announcement_id: announcementId })), { onConflict: "url", ignoreDuplicates: true });
}

async function knownUrls(sb: Sb, urls: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  for (let i = 0; i < urls.length; i += 100) {
    const { data } = await sb.from("company_announcement_sources").select("url").in("url", urls.slice(i, i + 100));
    for (const r of data ?? []) set.add(r.url);
  }
  return set;
}

// ---------------- listed: exchange ----------------
async function runExchange(sb: Sb, sources: Row[], days: number, deadline: number) {
  const oam = sources.find((s) => s.method === "cse_oam");
  if (!oam || oam.status !== "active") return { skipped: "exchange source not active" };
  const issuers = sources.filter((s) => s.kind === "issuer" && s.oam_company_id && s.status !== "disabled");
  const from = iso(new Date(Date.now() - days * DAY)), until = iso(new Date(Date.now() + DAY));
  let found = 0, fresh = 0, attached = 0;
  const errors: string[] = [];
  for (const issuer of issuers) {
    if (Date.now() > deadline) { errors.push("time budget reached"); break; }
    let items: OamItem[] = [];
    try {
      const qs = new URLSearchParams({ page: "0", size: "300", sort: "REGISTRY_TIMESTAMP,desc", listedCompanyId: String(issuer.oam_company_id), registryTimestamp: from, registryTimestampUntil: until });
      const res = await fetch(`${OAM}/fetch-listing-versions?${qs}`, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      items = (await res.json()).content ?? [];
    } catch (e) { errors.push(`${issuer.company_name}: ${e instanceof Error ? e.message : e}`); continue; }
    const companyKey = normalizeCompanyName(issuer.company_name) ?? "";
    const { data: existing } = await sb.from("company_announcements").select("id, announcement_type, source_published_at, title, original_title, external_ids, primary_source_url, source_id")
      .eq("section", "listed").eq("company_name", issuer.company_name).gte("source_published_at", new Date(Date.now() - (days + 5) * DAY).toISOString());
    const pool: Row[] = existing ?? [];
    for (const g of groupOamItems(items)) {
      const title = (g.english.nameEnglish || g.english.name || "").trim();
      const type = classifyDisclosure(g.english.informationCategoryId ?? g.original.informationCategoryId, `${title} ${g.original.name ?? ""}`);
      if (!type) continue;
      found++;
      const ext = g.members.map((m) => `cse_oam:${m.id}`);
      if (pool.some((p) => (p.external_ids ?? []).some((x: string) => ext.includes(x)))) continue;
      const published = new Date(g.publishedAt).toISOString();
      const primaryUrl = oamCardUrl(g.original);
      const links = g.members.map((m) => ({
        url: oamCardUrl(m), role: oamCardUrl(m) === primaryUrl ? "primary" : "supporting", language: oamLanguage(m),
        source_name: "Cyprus Stock Exchange (OAM)", title: (oamLanguage(m) === "el" ? m.name : m.nameEnglish) ?? title,
        published_at: new Date(m.publicationTimestamp).toISOString(), external_id: `cse_oam:${m.id}`,
      }));
      // an issuer-page entry imported earlier for the same event: the exchange filing becomes its primary source
      const dup = pool.find((p) => !(p.external_ids ?? []).some((x: string) => x.startsWith("cse_oam:")) && isSameEvent(
        { companyKey, type, date: published, title },
        { companyKey, type: p.announcement_type, date: p.source_published_at ?? published, title: p.title }));
      if (dup) {
        await sb.from("company_announcements").update({ external_ids: [...(dup.external_ids ?? []), ...ext], primary_source_url: primaryUrl, canonical_url: primaryUrl, primary_verified: true, source_id: oam.id }).eq("id", dup.id);
        await sb.from("company_announcement_sources").update({ role: "supporting" }).eq("announcement_id", dup.id).eq("role", "primary");
        await addLinks(sb, dup.id, links);
        dup.external_ids = [...(dup.external_ids ?? []), ...ext];
        attached++;
        continue;
      }
      const lang = oamLanguage(g.original);
      const { data: ins, error } = await sb.from("company_announcements").insert({
        section: "listed", announcement_type: type, status: "review",
        company_name: issuer.company_name, directory_company_id: issuer.directory_company_id,
        company_match_status: issuer.directory_company_id ? "confirmed" : "unmatched",
        title, original_title: lang === "el" ? g.original.name : g.original.nameEnglish ?? title,
        source_language: lang, source_published_at: published, canonical_url: primaryUrl, primary_source_url: primaryUrl,
        primary_verified: true, source_id: oam.id, external_ids: ext, publish_when_ready: !!oam.auto_publish,
        sector: industryLabel(g.english.industriesName ?? g.original.industriesName), cyprus_tags: ["listed_in_cyprus"],
        routing_note: `CSE category ${g.english.informationCategoryId ?? "?"}`,
      }).select("id, announcement_type, source_published_at, title, external_ids").single();
      if (error) { errors.push(`${issuer.company_name}: ${error.message}`); continue; }
      await addLinks(sb, ins.id, links);
      pool.push(ins);
      fresh++;
    }
  }
  await health(sb, oam.id, errors.length === 0 || fresh + found > 0, found, fresh, errors.join("; ") || null);
  return { found, fresh, attached, errors };
}

// ---------------- listed: issuer pages ----------------
async function runIssuerPages(sb: Sb, sources: Row[], days: number, force: boolean, deadline: number, onlySlug?: string) {
  const out: Row[] = [];
  for (const s of sources.filter((x) => x.kind === "issuer" && x.method === "page" && x.status === "active" && (!onlySlug || x.slug === onlySlug) && due(x, force || !!onlySlug))) {
    if (Date.now() > deadline - 30000) { out.push({ source: s.slug, skipped: "time budget" }); continue; }
    const page = await firecrawlScrape(s.url);
    if (!page.ok) { await health(sb, s.id, false, 0, 0, `Page could not be read — ${page.error}`); out.push({ source: s.slug, error: page.error }); continue; }
    const items = (await extractIssuerList(page.markdown, s.company_name, s.url)).filter((i) => i.url && validDate(i.date) && Date.parse(i.date!) >= Date.now() - days * DAY);
    const known = await knownUrls(sb, items.map((i) => i.url!));
    const companyKey = normalizeCompanyName(s.company_name) ?? "";
    const { data: pool } = await sb.from("company_announcements").select("id, announcement_type, source_published_at, title").eq("section", "listed").eq("company_name", s.company_name)
      .gte("source_published_at", new Date(Date.now() - (days + 5) * DAY).toISOString());
    let found = 0, fresh = 0, attached = 0;
    for (const it of items) {
      const type = classifyDisclosure(null, it.title);
      if (!type) continue;
      found++;
      if (known.has(it.url!)) continue;
      const date = new Date(`${validDate(it.date)}T09:00:00Z`).toISOString();
      const link = { url: it.url!, role: "supporting", language: it.language === "el" || isGreekText(it.title) ? "el" : "en", source_name: s.name, title: it.title, published_at: date };
      const match = (pool ?? []).find((p: Row) => isSameEvent({ companyKey, type, date, title: it.title }, { companyKey, type: p.announcement_type, date: p.source_published_at, title: p.title }));
      if (match) { await addLinks(sb, match.id, [link]); attached++; continue; }
      const { data: ins, error } = await sb.from("company_announcements").insert({
        section: "listed", announcement_type: type, status: "review", company_name: s.company_name,
        directory_company_id: s.directory_company_id, company_match_status: s.directory_company_id ? "confirmed" : "unmatched",
        title: it.title, original_title: it.title, source_language: link.language, source_published_at: date,
        canonical_url: it.url, primary_source_url: it.url, primary_verified: true, source_id: s.id, cyprus_tags: ["listed_in_cyprus"],
        routing_note: "Issuer page only — not (yet) found among exchange filings",
      }).select("id, announcement_type, source_published_at, title").single();
      if (error) continue;
      await addLinks(sb, ins.id, [{ ...link, role: "primary" }]);
      pool?.push(ins);
      fresh++;
    }
    await health(sb, s.id, true, found, fresh);
    out.push({ source: s.slug, found, fresh, attached });
  }
  return out;
}

// ---------------- deals ----------------
async function saveDeal(sb: Sb, src: Row, d: DealDetails, articleUrl: string, articleTitle: string, suggestedId: string | null): Promise<"new" | "duplicate" | "followup" | "skipped"> {
  if (!d.qualifies || !d.company_name) return "skipped";
  const text = `${d.headline} ${d.summary}`;
  if (!looksLikeDeal(text) && d.amount == null && d.announcement_type !== "acquisition") return "skipped";
  const type: AnnouncementType = (["funding_round", "strategic_investment", "acquisition", "project_expansion"].includes(d.announcement_type) ? d.announcement_type : classifyDealType(text));
  const key = normalizeCompanyName(d.company_name) ?? "";
  const date = validDate(d.event_date) ?? iso(new Date());
  const { data: pool } = await sb.from("company_announcements").select("id, slug, title, announcement_type, source_published_at, event_date, company_name, status")
    .eq("section", "deals").neq("status", "rejected").gte("created_at", new Date(Date.now() - 400 * DAY).toISOString()).limit(1000);
  const same = (pool ?? []).filter((p: Row) => normalizeCompanyName(p.company_name) === key);
  const dup = same.find((p: Row) => isSameEvent({ companyKey: key, type, date, title: d.headline }, { companyKey: key, type: p.announcement_type, date: p.event_date ?? p.source_published_at ?? date, title: p.title }));
  const links = [{ url: articleUrl, role: "discovery", source_name: src.name, title: articleTitle, language: d.source_language === "el" ? "el" : "en", published_at: new Date(`${date}T09:00:00Z`).toISOString() }];
  if (d.primary_source_url && d.primary_source_url !== articleUrl) links.push({ url: d.primary_source_url, role: "supporting", source_name: "Linked from the discovery article (unverified)", title: d.headline, language: "en", published_at: links[0].published_at });
  if (dup) { await addLinks(sb, dup.id, links); return "duplicate"; }
  const earlier = same.find((p: Row) => p.announcement_type === type || p.announcement_type === "acquisition");
  let resolved = suggestedId;
  if (!resolved) {
    const [m] = await resolveCompanies(sb, [{ name: d.company_name }], { strict: true });
    resolved = m?.id ?? null;
  }
  const { data: ins, error } = await sb.from("company_announcements").insert({
    section: "deals", announcement_type: type, status: "review", company_name: d.company_name,
    suggested_company_id: resolved, company_match_status: resolved ? "suggested" : "unmatched",
    title: d.headline || articleTitle, original_title: d.original_title || articleTitle, summary: d.summary || null,
    source_language: d.source_language === "el" ? "el" : "en", source_published_at: new Date(`${date}T09:00:00Z`).toISOString(),
    event_date: validDate(d.event_date), canonical_url: articleUrl, discovery_url: articleUrl, primary_source_url: null, primary_verified: false,
    source_id: src.id, amount: d.amount, currency: d.currency ? d.currency.toUpperCase().slice(0, 3) : null,
    investors: (d.investors ?? []).slice(0, 12), buyer: d.buyer, deal_stage: d.deal_stage ?? "announced",
    cyprus_location: d.cyprus_location, cyprus_tags: (d.cyprus_tags ?? []).filter((t) => ["listed_in_cyprus", "based_in_cyprus", "founded_in_cyprus", "investing_in_cyprus"].includes(t)),
    sector: d.sector,
    routing_note: earlier ? `Possible later development of “${earlier.title}” (${earlier.id}) — attach as a timeline entry if so` : `Discovery: ${d.reason}`.slice(0, 400),
  }).select("id").single();
  if (error) { console.error("deal insert", error.message); return "skipped"; }
  await addLinks(sb, ins.id, links);
  return earlier ? "followup" : "new";
}

async function runDeals(sb: Sb, sources: Row[], force: boolean, deadline: number, onlySlug?: string) {
  const out: Row[] = [];
  for (const s of sources.filter((x) => x.section === "deals" && x.status === "active" && ["page", "search"].includes(x.method) && (!onlySlug || x.slug === onlySlug) && due(x, force || !!onlySlug))) {
    if (Date.now() > deadline - 45000) { out.push({ source: s.slug, skipped: "time budget" }); continue; }
    let found = 0, fresh = 0;
    try {
      let articles: { url: string; title: string; markdown?: string }[] = [];
      if (s.method === "search") {
        const r = await firecrawlSearch(s.search_query || `${s.company_name} Cyprus investment`, 5);
        if (!r.ok) throw new Error(r.error);
        articles = r.results;
      } else {
        const page = await firecrawlScrape(s.url, { onlyMainContent: true });
        if (!page.ok) throw new Error(`Page could not be read — ${page.error}`);
        const cands = (await extractDealCandidates(page.markdown, s.name, s.url)).filter((c) => c.url && /^https?:\/\//.test(c.url));
        const known = await knownUrls(sb, cands.map((c) => c.url!));
        articles = cands.filter((c) => !known.has(c.url!)).slice(0, 4).map((c) => ({ url: c.url!, title: c.title }));
        found += cands.length;
      }
      const known = await knownUrls(sb, articles.map((a) => a.url));
      for (const a of articles) {
        if (Date.now() > deadline - 20000) break;
        if (known.has(a.url)) continue;
        let md = a.markdown ?? "";
        if (!md) { const p = await firecrawlScrape(a.url, { onlyMainContent: true }); if (!p.ok) continue; md = p.markdown; }
        const d = await extractDealDetails({ title: a.title, url: a.url, markdown: md, companyHint: s.company_name });
        if (!d) continue;
        if (s.method === "search") found += d.qualifies ? 1 : 0;
        const r = await saveDeal(sb, s, d, a.url, a.title, s.directory_company_id ?? null);
        if (r === "new" || r === "followup") fresh++;
      }
      await health(sb, s.id, true, found, fresh);
      out.push({ source: s.slug, found, fresh });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await health(sb, s.id, false, found, fresh, msg);
      out.push({ source: s.slug, error: msg });
    }
  }
  return out;
}

// ---------------- summaries ----------------
async function runSummaries(sb: Sb, deadline: number, limit: number) {
  const { data: rows } = await sb.from("company_announcements").select("*").eq("section", "listed").is("summary", null).eq("status", "review")
    .order("source_published_at", { ascending: false }).limit(limit);
  let done = 0, published = 0;
  const failed: string[] = [];
  for (const r of rows ?? []) {
    if (Date.now() > deadline - 25000) break;
    let pdf: string | null = null;
    const { data: links } = await sb.from("company_announcement_sources").select("url, external_id, language, role").eq("announcement_id", r.id);
    const oamIds = (links ?? []).filter((l: Row) => l.external_id?.startsWith("cse_oam:")).sort((a: Row, b: Row) => (a.language === "en" ? -1 : 1) - (b.language === "en" ? -1 : 1));
    let text = "";
    for (const l of oamIds) {
      const oamId = l.external_id.split(":")[1];
      if (!text) {
        try {
          const res = await fetch(`${OAM}/fetch-listing-versions?page=0&size=1&id=${oamId}`, { signal: AbortSignal.timeout(20000) });
          const item = res.ok ? (await res.json()).content?.[0] : null;
          text = htmlToText(item?.translationVersionContent || item?.versionContent || "");
          if (/^(please find attached|επισυνάπτεται)/i.test(text) && text.length < 120) text = "";
        } catch { /* PDF only */ }
      }
      try {
        const res = await fetch(`${OAM}/fetch-files?listingVersionId=${oamId}`, { signal: AbortSignal.timeout(30000) });
        const files = res.ok ? await res.json() : [];
        const f = (files ?? []).find((x: Row) => /pdf/i.test(x.fileType ?? "") && x.file && x.file.length < 9_000_000);
        if (f) { pdf = f.file; if (text) break; }
      } catch { /* try next */ }
    }
    if (!pdf && /\.pdf(\?|$)/i.test(r.primary_source_url ?? "")) {
      try {
        const res = await fetch(r.primary_source_url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BusinessHubBot/1.0)" }, signal: AbortSignal.timeout(30000) });
        if (res.ok) { const buf = new Uint8Array(await res.arrayBuffer()); if (buf.length < 6_000_000) { let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); pdf = btoa(s); } }
      } catch { /* title-only */ }
    }
    const s = await summariseDisclosure({ company: r.company_name, title: r.title, category: r.routing_note, text: text || null, pdfBase64: pdf, currentType: r.announcement_type });
    if (!s?.summary) { failed.push(r.id); continue; }
    // only publish automatically when the brief was written from the filing itself
    const publish = r.publish_when_ready === true && (!!text || !!pdf);
    await sb.from("company_announcements").update({
      title: s.headline?.slice(0, 160) || r.title, summary: s.summary, announcement_type: s.announcement_type || r.announcement_type,
      event_date: validDate(s.event_date), tags: (s.tags ?? []).slice(0, 5), ...(publish ? { status: "published" } : {}),
    }).eq("id", r.id);
    done++; if (publish) published++;
  }
  return { summarised: done, published, failed: failed.length, remaining: Math.max(0, (rows?.length ?? 0) - done - failed.length) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);
  let body: Row = {};
  try { body = await req.json(); } catch { /* scheduled */ }
  const phase = String(body.phase ?? "all");
  const days = Math.min(Math.max(Number(body.days ?? 10), 1), 120);
  const force = body.force === true;
  const onlySlug = body.source_slug ? String(body.source_slug) : undefined;
  const deadline = Date.now() + 130000;
  try {
    const { data: sources, error } = await sb.from("announcement_sources").select("*");
    if (error) throw error;
    const result: Row = { phase, days };
    if (phase === "listed" || phase === "all") {
      if (!onlySlug || onlySlug === "cse-oam") result.exchange = await runExchange(sb, sources, days, deadline);
      if (!onlySlug || onlySlug !== "cse-oam") result.issuers = await runIssuerPages(sb, sources, days, force, deadline, onlySlug);
    }
    if ((phase === "deals" || phase === "all") && Date.now() < deadline - 45000) result.deals = await runDeals(sb, sources, force, deadline, onlySlug);
    if ((phase === "summarise" || phase === "all" || phase === "listed") && Date.now() < deadline - 25000) result.summaries = await runSummaries(sb, deadline, Number(body.limit ?? 25));
    return json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
