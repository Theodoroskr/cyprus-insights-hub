// Central Bank of Cyprus licence sync: reads the official CBC registers directly (no Firecrawl/AI) —
// banks from the credit-institutions page, e-money / payment / account-information institutions from
// the CBC's own spreadsheets — matches each firm to its directory profile and keeps statuses current.
import { unzipSync } from "npm:fflate@0.8.2";
import { readXlsxSheets } from "../_shared/xlsxReader.ts";
import {
  CBC_ADVERSE_STATUSES, CBC_CREDIT_INSTITUTIONS_URL, CBC_LIST_PRIORITY, CBC_LISTS, CBC_PAYMENT_REGISTERS_URL, type CbcEntry, type CbcList,
  cbcFlagsFor, findRegisterLinks, isCbcCurrent, parseCreditInstitutions, parsePaymentWorkbooks, wantedCbcSheet,
} from "../_shared/cbcRegister.ts";
import { type AliasRow, type Match, matchKeys, resolveCompanies, saveAliases } from "../_shared/companyMatcher.ts";

type Item = { list: CbcList; entry: CbcEntry; source_url: string; match?: Match };

const UA = { "User-Agent": "Mozilla/5.0 (BusinessHub.cy regulatory monitor)" };
async function get(url: string): Promise<Response> {
  let last = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error(`CBC HTTP ${res.status}`);
      return res;
    } catch (e) {
      last = e instanceof Error ? e.message : String(e);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(last);
}
async function inBatches<T>(items: T[], size: number, fn: (x: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const nameKey = (n: string) => matchKeys(n)[0] || n.toLowerCase();

// deno-lint-ignore no-explicit-any
export async function syncCbc(supabase: any) {
  const runStart = new Date().toISOString();
  const today = runStart.slice(0, 10);
  const results: Record<string, number> = {};
  const errors: Record<string, string> = {};
  const stats = { by_registration_no: 0, by_alias: 0, by_name: 0, kept_manual: 0, created: 0, review: 0, unmatched: 0, status_changes: 0, delisted: 0, superseded_removed: 0, placeholders_merged: 0, aliases_added: 0 };

  // 1. Read the registers
  const items: Item[] = [];
  let banksOk = false, paymentsOk = false;
  try {
    const banks = parseCreditInstitutions(await (await get(CBC_CREDIT_INSTITUTIONS_URL)).text());
    for (const b of banks) items.push({ ...b, source_url: CBC_CREDIT_INSTITUTIONS_URL });
    for (const l of [CBC_LISTS.bank, CBC_LISTS.branch, CBC_LISTS.rep]) results[l.name] = banks.filter((b) => b.list === l).length;
    banksOk = banks.length >= 5;
    if (!banksOk) errors[CBC_LISTS.bank.name] = "Register page returned too few banks";
  } catch (e) {
    results[CBC_LISTS.bank.name] = -1;
    errors[CBC_LISTS.bank.name] = e instanceof Error ? e.message : String(e);
  }
  try {
    const links = findRegisterLinks(await (await get(CBC_PAYMENT_REGISTERS_URL)).text());
    if (!links.emi || !links.pi) throw new Error("Register spreadsheet links not found on the CBC page");
    const book = async (url: string) => readXlsxSheets(unzipSync(new Uint8Array(await (await get(url)).arrayBuffer())), wantedCbcSheet);
    const [emi, pi] = await Promise.all([book(links.emi), book(links.pi)]);
    const parsed = parsePaymentWorkbooks(emi, pi);
    for (const p of parsed) items.push({ ...p, source_url: /EMI|Electronic/i.test(p.list.name) ? links.emi : links.pi });
    for (const l of [CBC_LISTS.emi, CBC_LISTS.emiFormer, CBC_LISTS.pi, CBC_LISTS.piFormer, CBC_LISTS.aisp]) results[l.name] = parsed.filter((p) => p.list === l).length;
    paymentsOk = (results[CBC_LISTS.emi.name] ?? 0) >= 5 && (results[CBC_LISTS.pi.name] ?? 0) >= 3;
    if (!paymentsOk) errors[CBC_LISTS.emi.name] = "Spreadsheets returned too few institutions";
  } catch (e) {
    results[CBC_LISTS.emi.name] = -1;
    errors[CBC_LISTS.emi.name] = e instanceof Error ? e.message : String(e);
  }

  // 2. Existing CBC rows (updated in place; manual approvals kept)
  const { data: existingRows = [] } = await supabase.from("regulated_entities")
    .select("id, entity_name, license_type, license_number, status, matched_company_id, match_confidence, match_method")
    .eq("source", "cbc").range(0, 4999);
  const rowKey = (type: string, lic: string | null, name: string) => `${type}|${lic || nameKey(name)}`;
  const byKey = new Map<string, any>(), legacyByName = new Map<string, any>();
  for (const r of existingRows) {
    byKey.set(rowKey(r.license_type, r.license_number, r.entity_name), r);
    if (!r.match_method) legacyByName.set(nameKey(r.entity_name), r); // rows from the old page scraper
  }
  const claimed = new Set<string>();
  const findExisting = (it: Item) => {
    const r = byKey.get(rowKey(it.list.licenseType, it.entry.license_number, it.entry.entity_name))
      || (!it.list.former ? legacyByName.get(nameKey(it.entry.entity_name)) : null);
    if (!r || claimed.has(r.id)) return null;
    claimed.add(r.id);
    return r;
  };
  const prevOf = new Map<Item, any>();
  for (const it of items) prevOf.set(it, findExisting(it));

  // 3. Match: registration number → alias (incl. city/branch suffixes) → unique normalised name
  const matches = await resolveCompanies(supabase, items.map((i) => ({ name: i.entry.entity_name, registration_no: i.entry.registration_no })));
  items.forEach((it, i) => {
    const prev = prevOf.get(it);
    if (matches[i].method !== "registration_no" && prev?.match_method === "manual" && prev.matched_company_id) {
      it.match = { id: prev.matched_company_id, confidence: 1, method: "manual", placeholders: [] };
      stats.kept_manual++;
      return;
    }
    it.match = matches[i];
    if (it.match.method === "registration_no") stats.by_registration_no++;
    else if (it.match.method.startsWith("alias")) stats.by_alias++;
    else if (it.match.method.startsWith("name_key")) stats.by_name++;
  });

  // 4. Currently authorised firms missing from the directory get a basic profile (former ones do not)
  const toCreate = items.filter((i) => i.match?.method === "none" && !i.list.former && isCbcCurrent(i.entry.status));
  await inBatches(toCreate, 5, async (it) => {
    const { data, error } = await supabase.from("directory_companies").insert({
      company_name: it.entry.entity_name,
      registration_no: it.entry.registration_no,
      organisation_status: "Active",
      organisation_type: it.list.licenseType,
      activity_description: it.list.licenseType,
    }).select("id").single();
    if (error) { console.error(`Create failed for ${it.entry.entity_name}: ${error.message}`); return; }
    it.match = { id: data.id, confidence: 1, method: "created", placeholders: [] };
    stats.created++;
  });

  // 5. Fold placeholder profiles from earlier imports into the official registry record
  const keepIds = [...new Set(items.map((i) => i.match?.id).filter(Boolean))] as string[];
  const dupIds = new Set<string>();
  for (const it of items) {
    for (const p of it.match?.placeholders || []) dupIds.add(p);
    const prev = prevOf.get(it);
    if (prev?.matched_company_id && it.match?.id && prev.matched_company_id !== it.match.id) dupIds.add(prev.matched_company_id);
  }
  const info = new Map<string, { registration_no: string | null }>();
  for (const c of chunk([...new Set([...keepIds, ...dupIds])], 150)) {
    const { data } = await supabase.from("directory_companies").select("id, registration_no").in("id", c);
    for (const d of data || []) info.set(d.id, d);
  }
  const merged = new Set<string>();
  for (const it of items) {
    const keep = it.match?.id;
    if (!keep || !info.get(keep)?.registration_no) continue;
    const prev = prevOf.get(it);
    const cands = [...(it.match!.placeholders || []), ...(prev?.matched_company_id && prev.matched_company_id !== keep ? [prev.matched_company_id] : [])];
    for (const dup of cands) {
      if (merged.has(dup) || dup === keep || !info.has(dup) || info.get(dup)!.registration_no) continue;
      const { error } = await supabase.rpc("merge_directory_placeholder", { _dup: dup, _keep: keep });
      if (error) { console.error(`Merge ${dup} → ${keep}: ${error.message}`); continue; }
      merged.add(dup);
      stats.placeholders_merged++;
    }
  }

  // 6. Save licence rows, review suggestions, licence records and status-change events
  const affected = new Set<string>();
  const seenIds = new Set<string>();
  const { data: recs = [] } = await supabase.from("regulatory_records").select("id, license_number, entity_name, title")
    .eq("regulator", "CBC").eq("record_type", "licensed").range(0, 4999);
  const recByKey = new Map<string, string>();
  for (const r of recs) recByKey.set(rowKey((r.title || "").split(" — ")[0], r.license_number, r.entity_name), r.id);
  const touchedRecs = new Set<string>();
  const aliasRows: AliasRow[] = [];

  await inBatches(items, 10, async (it) => {
    const { entry, list } = it;
    const m = it.match!;
    const prev = prevOf.get(it);
    const matchedId = m.id && m.confidence >= 0.75 ? m.id : null;
    const row = {
      source: "cbc",
      entity_name: entry.entity_name,
      license_number: entry.license_number,
      license_type: list.licenseType,
      status: entry.status,
      website: entry.website,
      registration_no: entry.registration_no,
      lei: entry.lei,
      license_date: entry.license_date,
      source_list: list.name,
      source_url: it.source_url,
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
    if (prev?.matched_company_id && prev.matched_company_id !== matchedId && !merged.has(prev.matched_company_id)) affected.add(prev.matched_company_id);
    if (!matchedId) m.method === "ambiguous" ? stats.review++ : stats.unmatched++;

    // Ambiguous names of currently authorised firms go to the Review tab
    if (m.candidates?.length && !list.former) {
      for (const c of m.candidates) {
        await supabase.from("match_review_queue").upsert({
          kind: "regulator_company", source_table: "regulated_entities", source_id: id, extracted_name: entry.entity_name,
          candidate_type: "directory_company", candidate_id: c.id, candidate_label: c.label,
          confidence: 0.5, reason: `CBC ${list.licenseType} ${entry.license_number || ""} — several directory companies share this name`.replace(/\s+/g, " ").trim(),
        }, { onConflict: "source_table,source_id,extracted_name,candidate_id", ignoreDuplicates: true });
      }
    }

    // Official alternate names become aliases, so news about "Payz" or "Hellenic Bank" finds the firm
    if (matchedId && m.confidence >= 0.9) {
      for (const n of entry.former_names) aliasRows.push({ directory_company_id: matchedId, alias: n, alias_type: "former_name", source: "cbc" });
      for (const n of entry.trade_names) aliasRows.push({ directory_company_id: matchedId, alias: n, alias_type: "trade_name", source: "cbc" });
      if (m.method === "registration_no") aliasRows.push({ directory_company_id: matchedId, alias: entry.entity_name, alias_type: "regulator_name", source: "cbc" });
    }

    // Status change on a row already tracked by this parser → company timeline event
    if (prev?.match_method && prev.status && matchedId && prev.status.toLowerCase() !== entry.status.toLowerCase()) {
      const adverse = CBC_ADVERSE_STATUSES.includes(entry.status);
      await supabase.from("company_events").insert({
        directory_company_id: matchedId,
        event_type: "licence_update",
        title: `CBC ${list.licenseType} ${entry.license_number ? `licence ${entry.license_number}` : "authorisation"}: ${prev.status} → ${entry.status}`,
        event_date: today,
        source_url: it.source_url,
        is_sensitive: adverse,
        status: adverse ? "pending" : "approved",
      });
      stats.status_changes++;
    }

    // Licence register entry (record_type "licensed" — never a warning or sanction)
    const details = [
      entry.license_date && `Authorised ${entry.license_date}`,
      entry.termination_date && `withdrawn ${entry.termination_date}`,
      entry.registration_no && `company reg. HE ${entry.registration_no}`,
      entry.lei && `LEI ${entry.lei}`,
      entry.status_note,
    ].filter(Boolean).join(" · ") || null;
    const rec = {
      regulator: "CBC", record_type: "licensed", entity_name: entry.entity_name, license_number: entry.license_number,
      directory_company_id: matchedId, title: `${list.licenseType} — ${entry.status}`, details,
      decision_date: entry.license_date || entry.termination_date, source_url: it.source_url, status: matchedId ? "published" : "pending",
    };
    const recId = recByKey.get(rowKey(list.licenseType, entry.license_number, entry.entity_name))
      || (!entry.license_number ? recByKey.get(rowKey("Credit Institution", null, entry.entity_name)) : undefined);
    if (recId && !touchedRecs.has(recId)) {
      touchedRecs.add(recId);
      await supabase.from("regulatory_records").update(rec).eq("id", recId);
    } else {
      const { data } = await supabase.from("regulatory_records").insert(rec).select("id").single();
      if (data?.id) touchedRecs.add(data.id);
    }
  });

  stats.aliases_added = await saveAliases(supabase, aliasRows);

  // 7. Full read of both sources: drop old scraper copies, mark firms that vanished "No longer listed"
  if (banksOk && paymentsOk) {
    const gone = existingRows.filter((r: any) => !seenIds.has(r.id));
    await inBatches(gone, 10, async (r: any) => {
      if (r.matched_company_id && !merged.has(r.matched_company_id)) affected.add(r.matched_company_id);
      if (!r.match_method) {
        await supabase.from("regulated_entities").delete().eq("id", r.id);
        stats.superseded_removed++;
        return;
      }
      if (["Withdrawn", "Lapsed", "No longer listed"].includes(r.status)) return;
      await supabase.from("regulated_entities").update({ status: "No longer listed", updated_at: runStart }).eq("id", r.id);
      stats.delisted++;
    });
    const staleRecs = recs.filter((r: any) => !touchedRecs.has(r.id)).map((r: any) => r.id);
    for (const c of chunk(staleRecs, 100)) await supabase.from("regulatory_records").delete().in("id", c);
  }

  // 8. Recompute each affected company's CBC badge from all of its CBC rows
  const ids = [...affected].filter((id) => !merged.has(id));
  const rowsByCompany = new Map<string, any[]>();
  for (const c of chunk(ids, 150)) {
    const { data } = await supabase.from("regulated_entities")
      .select("matched_company_id, status, license_type, license_number, source_list")
      .eq("source", "cbc").gte("match_confidence", 0.75).in("matched_company_id", c);
    for (const r of data || []) rowsByCompany.set(r.matched_company_id, [...(rowsByCompany.get(r.matched_company_id) || []), { ...r, priority: CBC_LIST_PRIORITY[r.source_list] ?? 50 }]);
  }
  await inBatches(ids, 20, async (id) => {
    const flags = cbcFlagsFor(rowsByCompany.get(id) || []);
    await supabase.from("directory_companies").update({ ...flags, regulatory_flags_updated_at: runStart }).eq("id", id);
  });

  const supervised = ids.filter((id) => cbcFlagsFor(rowsByCompany.get(id) || []).cbc_supervised).length;
  return { results, errors, stats: { ...stats, firms_read: items.length, companies_updated: ids.length, currently_authorised: supervised } };
}
