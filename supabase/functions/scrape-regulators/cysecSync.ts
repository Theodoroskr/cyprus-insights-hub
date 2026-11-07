// CySEC licence sync: reads every official CySEC register directly (no Firecrawl/AI),
// matches each firm to its directory profile and keeps licence numbers + statuses current.
import {
  ADVERSE_STATUSES, CYSEC_LISTS, CysecEntry, CysecList, cysecUrl, directoryFlagsFor, isCurrentStatus, mapCysecStatus, parseCysecRegister,
} from "../_shared/cysecRegister.ts";
import { type AliasRow, extractAlternateNames, resolveCompanies, saveAliases } from "../_shared/companyMatcher.ts";

// Licence-type labels used by the previous parser, so old rows are updated rather than duplicated
const OLD_TYPES: Record<string, string> = {
  "Investment Firm (CIF)": "Cyprus Investment Firm (CIF)",
  "Crypto Asset Service Provider": "Crypto-Asset Service Provider (MiCA)",
  "Alternative Investment Fund Manager": "Alternative Investment Fund Manager (AIFM)",
  "Administrative Service Provider": "Administrative Service Provider (ASP)",
};
const normType = (t?: string | null) => (t ? OLD_TYPES[t] || t : "");
const PRIORITY = Object.fromEntries(CYSEC_LISTS.map((l) => [l.name, l.priority]));

type Match = { id: string | null; confidence: number; method: string; candidates?: { id: string; label: string }[] };
type Item = { list: CysecList; entry: CysecEntry; match?: Match };

async function inBatches<T>(items: T[], size: number, fn: (x: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function fetchList(list: CysecList): Promise<CysecEntry[]> {
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(cysecUrl(list.path), { headers: { "User-Agent": "Mozilla/5.0 (BusinessHub.cy regulatory monitor)" } });
      if (!res.ok) throw new Error(`CySEC HTTP ${res.status}`);
      return parseCysecRegister(await res.text(), list);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(lastErr);
}

export async function syncCysec(supabase: any, only?: string) {
  const runStart = new Date().toISOString();
  const lists = CYSEC_LISTS.filter((l) => !only || l.name.toLowerCase().includes(only.toLowerCase()));
  const results: Record<string, number> = {};
  const errors: Record<string, string> = {};
  const stats = { by_registration_no: 0, by_alias: 0, by_name: 0, kept_manual: 0, created: 0, review: 0, unmatched: 0, status_changes: 0, delisted: 0, superseded_removed: 0 };

  // 1. Read all registers
  const items: Item[] = [];
  await Promise.all(lists.map(async (list) => {
    try {
      const entries = await fetchList(list);
      results[list.name] = entries.length;
      if (!entries.length) errors[list.name] = "Register page returned no entries";
      for (const entry of entries) items.push({ list, entry });
    } catch (e) {
      results[list.name] = -1;
      errors[list.name] = e instanceof Error ? e.message : String(e);
    }
  }));

  // 2. Existing CySEC rows (to update in place and keep manual approvals)
  const { data: existingRows = [] } = await supabase.from("regulated_entities")
    .select("id, entity_name, license_type, license_number, status, matched_company_id, match_confidence, match_method")
    .eq("source", "cysec").range(0, 9999);
  const rowKey = (type: string, lic: string | null, name: string) => `${normType(type)}|${lic || name.toLowerCase()}`;
  const existingByKey = new Map<string, any>();
  for (const r of existingRows) {
    existingByKey.set(rowKey(r.license_type, r.license_number, r.entity_name), r);
    existingByKey.set(`${normType(r.license_type)}|name:${r.entity_name.toLowerCase()}`, r);
  }
  // Each existing row is claimed by at most one register entry; a name fallback never crosses licence numbers
  const claims = new Map<string, Item>();
  const findExisting = (it: Item) => {
    const byLic = it.entry.license_number ? existingByKey.get(rowKey(it.list.licenseType, it.entry.license_number, it.entry.entity_name)) : null;
    const byName = [it.entry.entity_name, it.entry.raw_name]
      .map((n) => existingByKey.get(`${it.list.licenseType}|name:${n.toLowerCase()}`))
      .find((r) => r && (!r.license_number || !it.entry.license_number || r.license_number === it.entry.license_number));
    const r = byLic || byName || null;
    if (!r) return null;
    const owner = claims.get(r.id);
    if (owner && owner !== it) return null;
    claims.set(r.id, it);
    return r;
  };

  // 3–4. Match: registration number → alias (incl. city/branch suffixes) → unique normalised name.
  // A company with a different registration number is never matched by name. Manual approvals are kept.
  const resolved = await resolveCompanies(supabase, items.map((i) => ({ name: i.entry.entity_name, registration_no: i.entry.registration_no })));
  items.forEach((it, i) => {
    const r = resolved[i];
    if (r.method !== "registration_no") {
      const prev = findExisting(it);
      if (prev?.match_method === "manual" && prev.matched_company_id) {
        it.match = { id: prev.matched_company_id, confidence: 1, method: "manual" }; stats.kept_manual++;
        return;
      }
    }
    it.match = { id: r.id, confidence: r.confidence, method: r.method, candidates: r.candidates };
    if (r.method === "registration_no") stats.by_registration_no++;
    else if (r.method.startsWith("alias")) stats.by_alias++;
    else if (r.method.startsWith("name_key")) stats.by_name++;
  });

  // 5. Licensed firms missing from the directory get a basic profile (former licensees do not)
  const toCreate = items.filter((i) => i.match?.method === "none" && !i.list.former && isCurrentStatus(i.entry.status));
  await inBatches(toCreate, 5, async (it) => {
    const { data, error } = await supabase.from("directory_companies").insert({
      company_name: it.entry.entity_name,
      registration_no: it.entry.registration_no,
      organisation_status: "Active",
      organisation_type: it.list.licenseType,
      activity_description: it.list.licenseType,
    }).select("id").single();
    if (error) { console.error(`Create failed for ${it.entry.entity_name}: ${error.message}`); return; }
    it.match = { id: data.id, confidence: 1, method: "created" };
    stats.created++;
  });

  // 6. Save licence rows, review suggestions, licence records and status-change events
  const affected = new Set<string>();
  const seenIds = new Set<string>();
  const { data: recs = [] } = await supabase.from("regulatory_records").select("id, license_number, entity_name, title")
    .eq("regulator", "CYSEC").eq("record_type", "licensed").range(0, 9999);
  const recByKey = new Map<string, string>();
  for (const r of recs) recByKey.set(rowKey((r.title || "").split(" — ")[0], r.license_number, r.entity_name), r.id);
  const today = runStart.slice(0, 10);
  const aliasRows: AliasRow[] = [];

  await inBatches(items, 15, async (it) => {
    const { entry, list } = it;
    const m = it.match!;
    const prev = findExisting(it);
    const matchedId = m.id && m.confidence >= 0.75 ? m.id : null;
    const row = {
      source: "cysec",
      entity_name: entry.entity_name,
      license_number: entry.license_number,
      license_type: list.licenseType,
      status: entry.status,
      website: entry.website,
      contact_email: entry.email,
      registration_no: entry.registration_no,
      lei: entry.lei,
      license_date: entry.license_date,
      source_list: list.name,
      source_url: entry.detail_url || cysecUrl(list.path),
      raw_data: { ...entry, list: list.name, review_candidates: m.candidates || null },
      matched_company_id: matchedId,
      match_confidence: matchedId ? m.confidence : null,
      match_method: matchedId ? m.method : m.method === "ambiguous" ? "review" : "unmatched",
      last_seen_at: runStart,
      updated_at: runStart,
    };
    let id: string | null = prev?.id || null;
    if (id) {
      const { error } = await supabase.from("regulated_entities").update(row).eq("id", id);
      if (error) { console.error(`Update ${entry.entity_name}: ${error.message}`); return; }
    } else {
      const { data, error } = await supabase.from("regulated_entities").insert(row).select("id").single();
      if (error) { console.error(`Insert ${entry.entity_name}: ${error.message}`); return; }
      id = data.id;
    }
    seenIds.add(id!);
    if (matchedId) affected.add(matchedId);
    if (prev?.matched_company_id && prev.matched_company_id !== matchedId) affected.add(prev.matched_company_id);
    if (!matchedId) m.method === "ambiguous" ? stats.review++ : stats.unmatched++;

    // Official former names ("ex …") and the register's spelling become aliases for news matching
    if (matchedId && m.confidence >= 0.9) {
      for (const n of extractAlternateNames(entry.raw_name).formerNames) aliasRows.push({ directory_company_id: matchedId, alias: n, alias_type: "former_name", source: "cysec" });
      if (m.method === "registration_no") aliasRows.push({ directory_company_id: matchedId, alias: entry.entity_name, alias_type: "regulator_name", source: "cysec" });
    }

    if (m.candidates?.length) {
      for (const c of m.candidates) {
        await supabase.from("match_review_queue").upsert({
          kind: "regulator_company", source_table: "regulated_entities", source_id: id, extracted_name: entry.entity_name,
          candidate_type: "directory_company", candidate_id: c.id, candidate_label: c.label,
          confidence: 0.5, reason: `CySEC ${list.licenseType} ${entry.license_number || ""} — several directory companies share this name`.trim(),
        }, { onConflict: "source_table,source_id,extracted_name,candidate_id", ignoreDuplicates: true });
      }
    }

    // Status change on a row already tracked by this parser → company timeline event
    if (prev?.match_method && prev.status && matchedId && prev.status.toLowerCase() !== entry.status.toLowerCase()) {
      const adverse = ADVERSE_STATUSES.includes(entry.status);
      await supabase.from("company_events").insert({
        directory_company_id: matchedId,
        event_type: "licence_update",
        title: `CySEC ${list.licenseType} licence ${entry.license_number || ""}: ${prev.status} → ${entry.status}`.replace(/\s+/g, " "),
        event_date: today,
        source_url: row.source_url,
        is_sensitive: adverse,
        status: adverse ? "pending" : "approved",
      });
      stats.status_changes++;
    }

    // Licence register entry (record_type "licensed" — never a warning or sanction)
    const details = [
      entry.license_date && `Licensed ${entry.license_date}`,
      entry.termination_date && `terminated ${entry.termination_date}`,
      entry.registration_no && `company reg. HE ${entry.registration_no}`,
      entry.lei && `LEI ${entry.lei}`,
    ].filter(Boolean).join(" · ") || null;
    const rec = {
      regulator: "CYSEC", record_type: "licensed", entity_name: entry.entity_name, license_number: entry.license_number,
      directory_company_id: matchedId, title: `${list.licenseType} — ${entry.status}`, details,
      decision_date: entry.license_date, source_url: row.source_url, status: matchedId ? "published" : "pending",
    };
    const recId = recByKey.get(rowKey(list.licenseType, entry.license_number, entry.entity_name))
      || recByKey.get(rowKey(list.licenseType, entry.license_number, entry.raw_name));
    if (recId) await supabase.from("regulatory_records").update(rec).eq("id", recId);
    else await supabase.from("regulatory_records").insert(rec);
  });

  const aliasesAdded = await saveAliases(supabase, aliasRows);

  // 7. Full run with every current register read: firms that vanished are "No longer listed"
  const currentListsOk = !only && CYSEC_LISTS.filter((l) => !l.former).every((l) => (results[l.name] ?? 0) > 0);
  if (currentListsOk) {
    const seenLic = new Set(items.filter((i) => i.entry.license_number).map((i) => `${i.list.licenseType}|${i.entry.license_number}`));
    const TERMINAL = ["Revoked", "Withdrawn", "Voluntary renunciation", "Lapsed", "Not activated", "Former licence", "No longer listed"];
    const gone = existingRows.filter((r: any) => !seenIds.has(r.id));
    await inBatches(gone, 15, async (r: any) => {
      if (r.matched_company_id) affected.add(r.matched_company_id);
      const superseded = !r.match_method && (!r.license_number || seenLic.has(`${normType(r.license_type)}|${r.license_number}`));
      if (superseded) {
        // Older scraped copy (or junk row) of a licence now read from the official register — remove it
        await supabase.from("cysec_status_history").delete().eq("regulated_entity_id", r.id);
        await supabase.from("regulatory_records").delete().eq("regulator", "CYSEC").eq("record_type", "licensed").eq("entity_name", r.entity_name).like("title", `${r.license_type} — %`);
        await supabase.from("regulated_entities").delete().eq("id", r.id);
        stats.superseded_removed++;
        return;
      }
      const mapped = mapCysecStatus(r.status, true);
      const status = TERMINAL.includes(mapped) && mapped !== "Former licence" ? mapped : "No longer listed";
      if (status === r.status) return;
      await supabase.from("regulated_entities").update({ status, updated_at: runStart }).eq("id", r.id);
      await supabase.from("regulatory_records").update({ title: `${normType(r.license_type)} — ${status}` })
        .eq("regulator", "CYSEC").eq("record_type", "licensed").eq("entity_name", r.entity_name).like("title", `${r.license_type} — %`);
      stats.delisted++;
    });
  }

  // 8. Recompute each affected company's CySEC badge from all of its licence rows
  const ids = [...affected];
  const rowsByCompany = new Map<string, any[]>();
  for (const c of chunk(ids, 150)) {
    const { data } = await supabase.from("regulated_entities")
      .select("matched_company_id, status, license_type, license_number, source_list")
      .eq("source", "cysec").gte("match_confidence", 0.75).in("matched_company_id", c);
    for (const r of data || []) rowsByCompany.set(r.matched_company_id, [...(rowsByCompany.get(r.matched_company_id) || []), { ...r, license_type: normType(r.license_type), priority: PRIORITY[r.source_list] ?? 50 }]);
  }
  await inBatches(ids, 20, async (id) => {
    const flags = directoryFlagsFor(rowsByCompany.get(id) || []);
    await supabase.from("directory_companies").update({ ...flags, regulatory_flags_updated_at: runStart }).eq("id", id);
  });

  const licensed = ids.filter((id) => directoryFlagsFor(rowsByCompany.get(id) || []).cysec_licensed).length;
  return { results, errors, stats: { ...stats, aliases_added: aliasesAdded, firms_read: items.length, companies_updated: ids.length, currently_licensed: licensed } };
}
