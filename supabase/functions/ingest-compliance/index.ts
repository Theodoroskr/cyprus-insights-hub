// ComplianceHub importer: reads official regulator / sanctions / FATF sources and files every new or changed
// record for editor review. Nothing is published from here; failed or incomplete reads never touch stored records.
//   phase "collect"   – run each due source (per-source interval), dedupe, detect revisions
//   phase "summarise" – draft summaries/translations for review items (dates only as quoted suggestions)
//   action "validate" – test-read a configured source without importing
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import * as C from "../_shared/compliance.ts";
import { draftBrief, AiBlocked } from "../_shared/complianceAi.ts";
import { firecrawlScrape } from "../_shared/announcementAi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 BusinessHubBot/1.0";
const DAY = 86400000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

// deno-lint-ignore no-explicit-any
type Sb = any;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function fetchText(url: string, accept = "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8") {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "en-GB,en;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(30000) });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: 0, text: "", error: e instanceof Error ? e.message : String(e) };
  }
}

interface Candidate {
  authority: string; jurisdiction: "CY" | "EU" | "INT"; official_id: string | null; canonical_url: string; official_title: string;
  publication_date: string | null; document_type: C.DocType; sections: string[]; topics: string[]; sectors: string[]; source_language: "en" | "el";
  legal_act_ref?: string | null; regime?: string | null; measure_type?: string | null; countries?: string[]; related_acts?: string[];
  deadline_date?: string | null; deadline_type?: string | null; deadline_note?: string | null;
  hash_basis: string; ref_title?: string;
}
interface Stats { found: number; fresh: number; changed: number; errors: string[] }
const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];
const relatedActs = (t: string) => uniq([...t.matchAll(/\b(?:Regulation|Directive|Decision)\s*\((?:EU|EC|CFSP|EU, Euratom)\)\s*(?:No\s*)?\d{1,4}\/\d{1,4}/g)].map((m) => m[0].replace(/\s+/g, " ")));

async function upsertCandidate(sb: Sb, src: Row, c: Candidate, st: Stats) {
  st.found++;
  const hash = await C.sha256(c.hash_basis);
  let existing: Row | null = null;
  if (c.official_id) existing = (await sb.from("compliance_items").select("*").eq("authority", c.authority).eq("official_id", c.official_id).maybeSingle()).data;
  if (!existing) existing = (await sb.from("compliance_items").select("*").eq("canonical_url", c.canonical_url).maybeSingle()).data;
  if (!existing) {
    const { data: ref } = await sb.from("compliance_item_refs").select("item_id").eq("url", c.canonical_url).maybeSingle();
    if (ref) existing = (await sb.from("compliance_items").select("*").eq("id", ref.item_id).maybeSingle()).data;
  }
  if (existing?.status === "merged" && existing.merged_into) existing = (await sb.from("compliance_items").select("*").eq("id", existing.merged_into).maybeSingle()).data ?? existing;
  const now = new Date().toISOString();
  const ref = { authority: c.authority, official_id: c.official_id, url: c.canonical_url, title: c.ref_title ?? c.official_title, language: c.source_language, published_at: c.publication_date, source_id: src.id };

  if (!existing) {
    const { data: ins, error } = await sb.from("compliance_items").insert({
      status: "review", sections: uniq(c.sections), authority: c.authority, jurisdiction: c.jurisdiction, official_id: c.official_id,
      canonical_url: c.canonical_url, document_type: c.document_type, official_title: c.official_title, source_language: c.source_language,
      title_el: c.source_language === "el" ? c.official_title : null,
      topics: uniq(c.topics), sectors: uniq(c.sectors), publication_date: c.publication_date,
      legal_act_ref: c.legal_act_ref ?? null, regime: c.regime ?? null, measure_type: c.measure_type ?? null, countries: c.countries ?? [], related_acts: c.related_acts ?? [],
      deadline_date: c.deadline_date ?? null, deadline_type: c.deadline_date ? c.deadline_type ?? null : null, deadline_note: c.deadline_note ?? null,
      content_hash: hash, last_seen_at: now, source_id: src.id,
    }).select("id").single();
    if (error) { st.errors.push(`${c.official_id ?? c.canonical_url}: ${error.message}`); return; }
    await sb.from("compliance_item_refs").upsert({ ...ref, item_id: ins.id, role: "primary" }, { onConflict: "url", ignoreDuplicates: true });
    st.fresh++;
    return;
  }

  // Seen before: widen tags (another listing category is not a revision), then compare content.
  const patch: Row = {
    last_seen_at: now,
    sections: uniq([...(existing.sections ?? []), ...c.sections]),
    topics: uniq([...(existing.topics ?? []), ...c.topics]),
    sectors: uniq([...(existing.sectors ?? []), ...c.sectors]),
  };
  // a different official ID behind the same URL is a duplicate listing at the source, not a revision
  const sameRecord = !c.official_id || !existing.official_id || existing.official_id === c.official_id;
  if (sameRecord && existing.content_hash && existing.content_hash !== hash) {
    const deadlineMoved = (c.deadline_date ?? null) !== (existing.deadline_date ?? null) && c.deadline_date !== undefined;
    const note = deadlineMoved ? `Official deadline changed: ${existing.deadline_date ?? "none"} → ${c.deadline_date ?? "none"}` : "The official source was updated since this record was filed";
    await sb.from("compliance_item_history").insert({
      item_id: existing.id, change_kind: "source_change", field: deadlineMoved ? "deadline_date" : "content",
      old_value: deadlineMoved ? existing.deadline_date : existing.official_title, new_value: deadlineMoved ? c.deadline_date : c.official_title,
      details: { old_hash: existing.content_hash, new_hash: hash, source: src.slug, deadline_note: c.deadline_note ?? null },
    });
    patch.content_hash = hash;
    patch.change_pending = true;
    patch.change_note = note;
    if (existing.status === "review") {
      // not public yet: take the official values straight away
      patch.official_title = c.official_title;
      if (deadlineMoved) { patch.deadline_date = c.deadline_date; patch.deadline_note = c.deadline_note ?? null; }
    } else {
      // public record keeps its last verified values until an editor confirms
      patch.ai_suggestions = { ...(existing.ai_suggestions ?? {}), pending_source_values: { official_title: c.official_title, deadline_date: c.deadline_date ?? null, deadline_note: c.deadline_note ?? null, seen_at: now } };
    }
    st.changed++;
  } else if (!existing.content_hash) patch.content_hash = hash;
  await sb.from("compliance_items").update(patch).eq("id", existing.id);
  await sb.from("compliance_item_refs").upsert({ ...ref, item_id: existing.id, role: existing.canonical_url === c.canonical_url ? "primary" : "related" }, { onConflict: "url", ignoreDuplicates: true });
}

const sinceDays = (src: Row, first: number, later: number) => isoDay(new Date(Date.now() - (src.last_success_at ? later : first) * DAY));

// ---------------- collectors ----------------
async function collectCysec(sb: Sb, src: Row, st: Stats) {
  const since = sinceDays(src, 180, 45);
  const byId = new Map<string, Candidate>();
  for (const url of src.endpoint_urls ?? []) {
    const page = await fetchText(url);
    if (!page.ok) { st.errors.push(`${url}: ${page.error}`); continue; }
    const rows = C.parseCysecListing(page.text);
    if (!rows.length) { st.errors.push(`${url}: no circulars recognised — page layout may have changed`); continue; }
    const cat = C.CYSEC_CATEGORIES[C.cysecCategory(url)] ?? { sectors: ["cysec_supervised"], topics: [] };
    for (const r of rows) {
      if (!r.date || r.date < since) continue;
      const id = r.circularNo ?? r.url;
      const topics = uniq([...cat.topics, ...C.topicsFromText(r.title)]);
      const prev = byId.get(id);
      if (prev) { prev.topics = uniq([...prev.topics, ...topics]); prev.sectors = uniq([...prev.sectors, ...cat.sectors]); continue; }
      byId.set(id, {
        authority: "CySEC", jurisdiction: "CY", official_id: r.circularNo, canonical_url: r.url, official_title: r.circularNo ? `${r.circularNo} – ${r.title}` : r.title,
        publication_date: r.date, document_type: "circular", sections: ["updates"], topics, sectors: [...cat.sectors],
        source_language: C.isGreek(r.title) ? "el" : "en", related_acts: relatedActs(r.title), hash_basis: `${r.circularNo}|${r.title}|${r.date}`,
      });
    }
  }
  for (const c of byId.values()) {
    if (c.topics.includes("sanctions")) c.sections.push("cy_sanctions");
    await upsertCandidate(sb, src, c, st);
  }
}

async function collectCbc(sb: Sb, src: Row, st: Stats) {
  const since = sinceDays(src, 180, 45);
  const page = await fetchText(src.endpoint_urls?.[0] ?? src.homepage_url);
  if (!page.ok) { st.errors.push(page.error ?? "fetch failed"); return; }
  const rows = C.parseCbcListing(page.text);
  if (!rows.length) { st.errors.push("No announcements recognised — page layout may have changed"); return; }
  for (const r of rows) {
    if (!r.date || r.date < since || !C.isCbcRegulatory(r.title)) continue;
    const sectors: string[] = [];
    if (/credit institution|\bbank|buffer/i.test(r.title)) sectors.push("banks");
    if (/payment institution|electronic money/i.test(r.title)) sectors.push("payment_emi");
    if (/crypto/i.test(r.title)) sectors.push("crypto_asset_providers");
    const topics = C.topicsFromText(r.title);
    await upsertCandidate(sb, src, {
      authority: "Central Bank of Cyprus", jurisdiction: "CY", official_id: r.slug, canonical_url: r.url, official_title: r.title,
      publication_date: r.date, document_type: C.docTypeFromTitle(r.title), sections: topics.includes("sanctions") ? ["updates", "cy_sanctions"] : ["updates"],
      topics, sectors, source_language: C.isGreek(r.title) ? "el" : "en", related_acts: relatedActs(r.title), hash_basis: `${r.title}|${r.date}`,
    }, st);
  }
}

async function collectNsiu(sb: Sb, src: Row, st: Stats) {
  const since = sinceDays(src, 730, 120);
  const kinds: [string, string, C.DocType][] = [["posts", "post", "notice"], ["document", "doc", "guidance"]];
  for (const [path, prefix, fallback] of kinds) {
    const url = `https://www.gov.cy/nsiu/en/wp-json/wp/v2/${path}?per_page=100&_fields=id,date,modified,link,title`;
    const res = await fetchText(url, "application/json");
    if (!res.ok) { st.errors.push(`${path}: ${res.error}`); continue; }
    let rows: Row[] = [];
    try { rows = JSON.parse(res.text); } catch { st.errors.push(`${path}: unreadable response`); continue; }
    if (!Array.isArray(rows) || !rows.length) { st.errors.push(`${path}: no entries returned`); continue; }
    for (const r of rows) {
      const title = C.clean(r.title?.rendered ?? "");
      const modified = String(r.modified ?? r.date ?? "").slice(0, 10);
      if (!title || !C.isNsiuRelevant(title) || modified < since) continue;
      await upsertCandidate(sb, src, {
        authority: "NSIU", jurisdiction: "CY", official_id: `${prefix}:${r.id}`, canonical_url: r.link, official_title: title,
        publication_date: String(r.date).slice(0, 10), document_type: C.docTypeFromTitle(title, fallback), sections: ["cy_sanctions"],
        topics: uniq(["sanctions", ...C.topicsFromText(title)]), sectors: [], source_language: C.isGreek(title) ? "el" : "en",
        related_acts: relatedActs(title), hash_basis: `${title}|${r.modified}`,
      }, st);
    }
  }
}

function eurlexAuthority(ref: string): string {
  if (/^Council/i.test(ref)) return "Council of the EU";
  if (/^Commission/i.test(ref)) return "European Commission";
  if (/European Parliament/i.test(ref)) return "European Parliament and Council";
  return "EU Official Journal";
}

async function saveEurLexAct(sb: Sb, src: Row, st: Stats, rawTitle: string, date: string | null) {
  const a = C.classifyEurLex(rawTitle);
  if (!a || !a.english || (!a.sanctions && !a.financial)) return;
  await upsertCandidate(sb, src, {
    authority: eurlexAuthority(a.legalActRef), jurisdiction: "EU", official_id: `CELEX:${a.celex}`,
    canonical_url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${a.celex}`, official_title: a.title,
    publication_date: date, document_type: a.documentType, sections: a.sanctions ? ["eu_sanctions", "updates"] : ["updates"],
    topics: a.topics, sectors: a.sanctions ? ["all_obliged_entities"] : [], source_language: "en",
    legal_act_ref: a.legalActRef, regime: a.regime, measure_type: a.measureType, countries: a.countries,
    related_acts: relatedActs(a.title).filter((x) => !a.legalActRef.endsWith(x.split(" ").pop()!)),
    hash_basis: a.title,
  }, st);
}

async function collectEurLex(sb: Sb, src: Row, st: Stats) {
  for (const url of src.endpoint_urls ?? []) {
    if (/search\.html/.test(url)) {
      // official quick search (newest first) — catches restrictive-measures acts the daily feed window may miss
      const res = await fetchText(url);
      if (!res.ok) { st.errors.push(`search: ${res.error}`); continue; }
      const rows = C.parseEurLexSearch(res.text);
      if (!rows.length) { st.errors.push("search: no results recognised"); continue; }
      for (const r of rows) await saveEurLexAct(sb, src, st, `CELEX:${r.celex}: ${r.title}`, r.ojDate);
      continue;
    }
    const res = await fetchText(url, "application/rss+xml,application/xml;q=0.9,*/*;q=0.8");
    if (!res.ok) { st.errors.push(`feed: ${res.error}`); continue; }
    const items = C.parseRss(res.text);
    if (!items.length) { st.errors.push("feed returned no items"); continue; }
    for (const it of items) await saveEurLexAct(sb, src, st, it.title, C.rssDate(it.pubDate));
  }
}

async function collectAmlaNews(sb: Sb, src: Row, st: Stats) {
  const since = sinceDays(src, 150, 45);
  const res = await fetchText(src.endpoint_urls?.[0], "application/rss+xml,application/xml;q=0.9,*/*;q=0.8");
  if (!res.ok) { st.errors.push(res.error ?? "feed failed"); return; }
  const items = C.parseRss(res.text);
  if (!items.length) { st.errors.push("Feed returned no items"); return; }
  for (const it of items) {
    const date = C.rssDate(it.pubDate);
    if (!date || date < since || !C.isAmlaNewsRelevant(it.title)) continue;
    const title = it.title.replace(/^Press Release:\s*/i, "");
    await upsertCandidate(sb, src, {
      authority: "AMLA", jurisdiction: "EU", official_id: null, canonical_url: it.link, official_title: title, publication_date: date,
      document_type: C.docTypeFromTitle(title), sections: ["updates"], topics: uniq(["aml_cft", ...C.topicsFromText(title)]), sectors: [],
      source_language: "en", related_acts: relatedActs(title), hash_basis: title,
    }, st);
  }
}

async function collectAmlaConsultations(sb: Sb, src: Row, st: Stats) {
  const since = sinceDays(src, 400, 400);
  const res = await fetchText(src.endpoint_urls?.[0] ?? src.homepage_url);
  if (!res.ok) { st.errors.push(res.error ?? "fetch failed"); return; }
  const rows = C.parseAmlaConsultations(res.text);
  if (!rows.length) { st.errors.push("No consultations recognised — page layout may have changed"); return; }
  for (const r of rows) {
    if ((r.openingDate ?? r.deadlineDate ?? "") < since) continue;
    await upsertCandidate(sb, src, {
      authority: "AMLA", jurisdiction: "EU", official_id: null, canonical_url: r.url, official_title: r.title, publication_date: r.openingDate,
      document_type: "consultation", sections: ["updates", "deadlines"], topics: uniq(["aml_cft", ...C.topicsFromText(r.title)]), sectors: [],
      source_language: "en", deadline_date: r.deadlineDate, deadline_type: "consultation_close", deadline_note: r.deadlineText ? `Closes ${r.deadlineText}` : null,
      related_acts: relatedActs(r.title), hash_basis: `${r.title}|${r.deadlineText ?? ""}`,
    }, st);
  }
}

async function checkEcResources(_sb: Sb, src: Row, st: Stats) {
  const res = await fetchText(src.endpoint_urls?.[0] ?? src.homepage_url);
  if (!res.ok) { st.errors.push(res.error ?? "fetch failed"); return; }
  const want = [["EU Sanctions Map", /sanctionsmap\.eu/], ["Consolidated financial sanctions list", /webgate\.ec\.europa\.eu\/fsd\/fsf/]] as const;
  for (const [label, re] of want) { if (re.test(res.text)) st.found++; else st.errors.push(`${label} link no longer found on the resources page`); }
}

async function collectFatf(sb: Sb, src: Row, st: Stats, force: boolean) {
  const idx = await firecrawlScrape(src.homepage_url, { onlyMainContent: true });
  if (!idx.ok) { st.errors.push(`Index page could not be read — ${idx.error}`); return; }
  const releases = C.parseFatfIndex(idx.markdown).filter((r) => r.callForActionUrl && r.increasedMonitoringUrl);
  if (!releases.length) { st.errors.push("No FATF statements recognised on the index page"); return; }
  const { data: stored } = await sb.from("fatf_releases").select("release_date");
  const have = new Set((stored ?? []).map((r: Row) => r.release_date));
  // first run keeps the previous release too, so the first change comparison is available
  const targets = releases.slice(0, have.size ? 1 : 2).filter((r) => force || !have.has(r.date));
  st.found += releases.length;
  for (const r of targets) {
    const [cfa, im] = [await firecrawlScrape(r.callForActionUrl!, { onlyMainContent: true }), await firecrawlScrape(r.increasedMonitoringUrl!, { onlyMainContent: true })];
    if (!cfa.ok || !im.ok) { st.errors.push(`${r.label}: statement page could not be read — ${cfa.error ?? im.error}`); continue; }
    const pc = C.parseFatfCallForAction(cfa.markdown), pi = C.parseFatfIncreasedMonitoring(im.markdown);
    if (!pc.countermeasures.listed.length || !pi.listed.listed.length) { st.errors.push(`${r.label}: lists incomplete — nothing saved`); continue; }
    const listings = [
      ...pc.countermeasures.listed.map((c) => ({ country_name: c.name, country_code: c.code, category: "countermeasures" })),
      ...pc.edd.listed.map((c) => ({ country_name: c.name, country_code: c.code, category: "enhanced_due_diligence" })),
      ...pi.listed.listed.map((c) => ({ country_name: c.name, country_code: c.code, category: "increased_monitoring" })),
    ];
    const hash = await C.sha256(listings.map((l) => `${l.category}:${l.country_code}`).sort().join("|"));
    const unrecognised = [...pc.countermeasures.unrecognised, ...pc.edd.unrecognised, ...pi.removed.unrecognised];
    const { data: existing } = await sb.from("fatf_releases").select("id, content_hash, status").eq("release_date", r.date).maybeSingle();
    if (existing) {
      if (existing.content_hash !== hash) {
        await sb.from("fatf_releases").update({ notes: `Source lists changed on ${isoDay(new Date())} (now ${listings.length} entries) — re-verify against the official statements.`, fetched_at: new Date().toISOString() }).eq("id", existing.id);
        st.changed++;
      }
      continue;
    }
    const { data: rel, error } = await sb.from("fatf_releases").insert({
      release_date: r.date, label: r.label, call_for_action_url: r.callForActionUrl, increased_monitoring_url: r.increasedMonitoringUrl,
      status: "review", content_hash: hash, stated_removals: pi.removed.listed.map((c) => c.name), fetched_at: new Date().toISOString(),
      notes: unrecognised.length ? `Headings not matched to a jurisdiction (check manually): ${unrecognised.join(", ")}` : null,
    }).select("id").single();
    if (error) { st.errors.push(`${r.label}: ${error.message}`); continue; }
    await sb.from("fatf_listings").insert(listings.map((l) => ({ ...l, release_id: rel.id })));
    st.fresh++;
  }
}

const COLLECTORS: Record<string, (sb: Sb, src: Row, st: Stats, force: boolean) => Promise<void>> = {
  "cysec-circulars": collectCysec, "cbc-announcements": collectCbc, "nsiu": collectNsiu, "eurlex-oj": collectEurLex,
  "amla-news": collectAmlaNews, "amla-consultations": collectAmlaConsultations, "ec-sanctions-resources": checkEcResources, "fatf-lists": collectFatf,
};

const due = (s: Row, force: boolean) => force || !s.last_attempt_at || Date.now() - Date.parse(s.last_attempt_at) > (s.check_interval_hours ?? 24) * 3600000 - 20 * 60000;

async function runCollect(sb: Sb, sources: Row[], force: boolean, deadline: number, onlySlug?: string) {
  const out: Row[] = [];
  for (const s of sources) {
    if (onlySlug ? s.slug !== onlySlug : (s.status !== "active" || !due(s, force))) continue;
    const fn = COLLECTORS[s.slug];
    if (!fn) { out.push({ source: s.slug, skipped: "no automatic reader — manual entry" }); continue; }
    if (Date.now() > deadline - 25000) { out.push({ source: s.slug, skipped: "time budget" }); continue; }
    const st: Stats = { found: 0, fresh: 0, changed: 0, errors: [] };
    const started = new Date().toISOString();
    try { await fn(sb, s, st, force); } catch (e) { st.errors.push(e instanceof Error ? e.message : String(e)); }
    // a run with errors and nothing recognised is a collection failure; partial reads keep their records and report the error
    const ok = st.errors.length === 0 || st.found > 0;
    await sb.from("compliance_sources").update({
      last_attempt_at: started, last_items_found: st.found, last_new_items: st.fresh, last_changed_items: st.changed,
      ...(ok ? { last_success_at: started } : {}),
      ...(st.errors.length ? { last_error: st.errors.join("; ").slice(0, 800), last_error_at: started } : { last_error: null, last_error_at: null }),
      ...(ok && !s.validated_at ? { validated_at: started } : {}),
    }).eq("id", s.id);
    out.push({ source: s.slug, ...st });
  }
  return out;
}

// ---------------- summaries ----------------
async function sourceText(item: Row): Promise<{ text: string | null; pdf: string | null }> {
  if (item.authority === "NSIU" && /^(post|doc):\d+$/.test(item.official_id ?? "")) {
    const [kind, id] = item.official_id.split(":");
    const r = await fetchText(`https://www.gov.cy/nsiu/en/wp-json/wp/v2/${kind === "post" ? "posts" : "document"}/${id}?_fields=content`, "application/json");
    if (r.ok) { try { const t = C.stripHtml(JSON.parse(r.text).content?.rendered ?? ""); if (t.length > 40) return { text: t, pdf: null }; } catch { /* fall through */ } }
  }
  const url = item.official_id?.startsWith("CELEX:") ? `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=${item.official_id}` : item.canonical_url;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(40000) });
    if (!res.ok) return { text: null, pdf: null };
    const type = res.headers.get("content-type") ?? "";
    if (/pdf/i.test(type) || /GetFile\.aspx/i.test(url)) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length > 6_000_000 || !(buf[0] === 0x25 && buf[1] === 0x50)) return { text: null, pdf: null };
      let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return { text: null, pdf: btoa(s) };
    }
    const html = await res.text();
    const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<body[\s\S]*?<\/body>/i)?.[0] ?? html;
    const text = C.stripHtml(main);
    return { text: text.length > 60 ? text : null, pdf: null };
  } catch { return { text: null, pdf: null }; }
}

/** Drafts one record's summary from its official text. Never changes the record's status. */
async function draftOne(sb: Sb, r: Row): Promise<{ ok: boolean; blocked?: string; error?: string }> {
  const attempts = Number(r.ai_suggestions?.attempts ?? 0);
  const { text, pdf } = await sourceText(r);
  try {
    const b = await draftBrief({ authority: r.authority, officialTitle: r.official_title, documentType: r.document_type, text, pdfBase64: pdf });
    if (!b?.summary_en) throw new Error("empty draft");
    await sb.from("compliance_items").update({
      title_en: b.title_en || null, title_el: b.title_el || r.title_el, summary_en: b.summary_en, summary_el: b.summary_el || null,
      what_changed_en: b.what_changed_en || null, what_changed_el: b.what_changed_el || null, action_en: b.action_en || null, action_el: b.action_el || null,
      topics: uniq([...(r.topics ?? []), ...b.topics]), sectors: uniq([...(r.sectors ?? []), ...b.sectors]), audience: r.audience ?? (b.audience || null),
      ai_suggestions: { ...(r.ai_suggestions ?? {}), attempts: attempts + 1, drafted_at: new Date().toISOString(), read_from: pdf ? "pdf" : text ? "text" : "title", dates: b.dates, last_error: null },
    }).eq("id", r.id);
    return { ok: true };
  } catch (e) {
    if (e instanceof AiBlocked) return { ok: false, blocked: `${e.status}: ${e.message}` };
    const msg = e instanceof Error ? e.message.slice(0, 300) : String(e);
    await sb.from("compliance_items").update({ ai_suggestions: { ...(r.ai_suggestions ?? {}), attempts: attempts + 1, last_error: msg } }).eq("id", r.id);
    return { ok: false, error: msg };
  }
}

async function runSummaries(sb: Sb, deadline: number, limit: number) {
  const { data: rows } = await sb.from("compliance_items").select("*").eq("status", "review").is("summary_en", null).eq("is_test", false)
    .order("publication_date", { ascending: false, nullsFirst: false }).limit(limit * 2);
  let done = 0, failed = 0;
  let blocked: string | null = null;
  for (const r of rows ?? []) {
    if (done + failed >= limit || Date.now() > deadline - 35000) break;
    if (Number(r.ai_suggestions?.attempts ?? 0) >= 3) continue;
    const res = await draftOne(sb, r);
    if (res.blocked) { blocked = res.blocked; break; }
    if (res.ok) done++; else failed++;
  }
  return { drafted: done, failed, blocked };
}

// ---------------- validate (configured sources without a reader) ----------------
async function validateSource(src: Row) {
  const url = src.endpoint_urls?.[0] ?? src.homepage_url;
  const direct = await fetchText(url);
  const links = (direct.text.match(/<a\s[^>]*href=/gi) ?? []).length;
  if (direct.ok && links > 10) return { method: "direct", ok: true, status: direct.status, links, chars: direct.text.length };
  const fc = await firecrawlScrape(url, { onlyMainContent: true });
  return { method: "crawler", ok: fc.ok, status: fc.status ?? direct.status, chars: fc.markdown.length, direct_error: direct.error, error: fc.error };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let via: "schedule" | "admin" | "service" = "schedule";
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    via = caller.via === "admin" ? "admin" : "service";
  }
  let body: Row = {};
  try { body = await req.json(); } catch { /* scheduled */ }
  const deadline = Date.now() + 140000;
  try {
    const { data: sources, error } = await sb.from("compliance_sources").select("*").order("slug");
    if (error) throw error;
    if (body.action === "validate") {
      const s = sources.find((x: Row) => x.slug === body.source_slug);
      if (!s) return json({ error: "Unknown source" }, 404);
      const result = await validateSource(s);
      const now = new Date().toISOString();
      await sb.from("compliance_sources").update({ last_attempt_at: now, notes: `${s.notes ?? ""}`.replace(/\s*\[Validation [^\]]*\]$/, "") + ` [Validation ${now.slice(0, 10)}: ${result.ok ? `readable via ${result.method}` : `not readable (${result.error ?? result.direct_error ?? result.status})`}]`, ...(result.ok ? {} : { last_error: `Validation failed: ${result.error ?? result.direct_error ?? result.status}`, last_error_at: now }) }).eq("id", s.id);
      return json({ ok: true, source: s.slug, validation: result });
    }
    if (body.action === "draft") {
      if (via !== "admin") return json({ error: "Editors only" }, 403);
      const { data: row } = await sb.from("compliance_items").select("*").eq("id", String(body.item_id ?? "")).maybeSingle();
      if (!row) return json({ error: "Unknown record" }, 404);
      const r = await draftOne(sb, row);
      return json(r, r.blocked ? 402 : r.ok ? 200 : 502);
    }
    const phase = String(body.phase ?? "all");
    const result: Row = { phase, via };
    if (phase === "collect" || phase === "all") result.collect = await runCollect(sb, sources, body.force === true, deadline, body.source_slug ? String(body.source_slug) : undefined);
    if ((phase === "summarise" || phase === "all") && Date.now() < deadline - 40000) result.summaries = await runSummaries(sb, deadline, Math.min(Number(body.limit ?? 8), 20));
    return json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
