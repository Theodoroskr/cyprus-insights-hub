// Company name matcher shared by news linking and every regulator import.
// Order of evidence: registration number → curated/official alias → unique normalised registry name.
// Names are compared as "keys": the same normalisation as the database `normalize_company_name`
// (legal suffixes, "Cyprus", punctuation removed), plus a second pass that drops trailing city /
// branch words, so "Deloitte Cyprus", "Cyta Limassol" or "KPMG in Cyprus" reach the official record.

// ---------- pure helpers (unit-tested) ----------

// Greek capitals that look Latin, e.g. the CBC register writes "Αlpha Bank" with a Greek Α
const HOMOGLYPHS: Record<string, string> = {
  "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H", "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X",
  "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ο": "o", "ρ": "p", "τ": "t", "υ": "u", "χ": "x",
};
/** Fold Greek look-alike letters inside words that are otherwise written in Latin script */
export function foldHomoglyphs(s: string): string {
  return s.replace(/[\p{L}]+/gu, (w) => (/[A-Za-z]/.test(w) && /[\u0370-\u03FF]/.test(w) ? [...w].map((c) => HOMOGLYPHS[c] ?? c).join("") : w));
}

const W = "[\\p{L}\\p{N}_]";
const LEGAL_RE = new RegExp(
  `(?<!${W})(public company limited|public co ltd|public limited|limited|ltd|plc|llc|inc|s\\.?a\\.?|co|company|group|holdings?|the|cyprus|λτδ|λιμιτεδ)(?!${W})`, "gu");

/** Mirror of the database function public.normalize_company_name (keep the two in sync) */
export function normalizeCompanyName(name: string | null | undefined): string | null {
  const s = (name || "").toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(LEGAL_RE, " ")
    .replace(/[^a-z0-9α-ω]+/g, " ")
    .trim();
  return s || null;
}

/** Trailing words that describe where/which office, not who: dropped in the second matching pass */
export const LOCATION_SUFFIXES = [
  "limassol", "lemesos", "nicosia", "lefkosia", "larnaca", "larnaka", "paphos", "pafos", "famagusta", "ammochostos",
  "kyrenia", "paralimni", "strovolos", "ayia napa", "agia napa", "cy", "cyp", "office", "offices", "branch", "hq",
  "headquarters", "in", "at", "public",
];
const SUFFIX_RE = new RegExp(`\\s(?:${LOCATION_SUFFIXES.map((w) => w.replace(/ /g, "\\s")).join("|")})$`);

/** Keys to try for a name: the full key first, then the key without trailing city/branch words */
export function matchKeys(name: string | null | undefined): string[] {
  const cleaned = foldHomoglyphs(name || "").replace(/['’]s\b/gi, "");
  const full = normalizeCompanyName(cleaned);
  if (!full) return [];
  const keys = [full];
  let k = full;
  while (SUFFIX_RE.test(k)) {
    k = k.replace(SUFFIX_RE, "").trim();
    if (k && !keys.includes(k)) keys.push(k);
  }
  return keys;
}

/** Registration numbers are stored as digits ("HE 143641" → "143641") */
export function normalizeRegNo(reg: string | null | undefined): string | null {
  const m = (reg || "").replace(/\s|\./g, "").toUpperCase().match(/^(?:HE|ΗΕ|H\.E)?0*(\d{2,8})$/);
  return m ? m[1] : null;
}

export const isInactiveStatus = (s?: string | null) => /dissolv|liquidat|receiver|struck|removed/i.test(s || "");

/** Keys too generic to identify a company on their own */
const GENERIC = new Set(["bank", "group", "holdings", "trading", "services", "investments", "capital", "finance", "consulting", "solutions", "international", "global", "europe", "eu", "management"]);
export const isUsableKey = (k: string, strict: boolean) =>
  !GENERIC.has(k) && !/\b(of|and|for)$/.test(k) && (strict ? k.length >= 6 || k.includes(" ") : k.length >= 3);

export type DirCandidate = { id: string; name_key: string | null; company_name: string; registration_no: string | null; organisation_status?: string | null; organisation_type?: string | null };

/**
 * Choose among directory companies sharing a key. A company with a different registration number is a
 * different company; if several remain, dissolved ones are ignored and a registered record wins over
 * unregistered placeholders. Returns null when still ambiguous.
 */
export function pickCandidate(cands: DirCandidate[], regNo?: string | null): { pick: DirCandidate | null; rest: DirCandidate[]; why: string } {
  let c = cands.filter((h) => !regNo || !h.registration_no || h.registration_no === regNo);
  if (c.length <= 1) return { pick: c[0] || null, rest: [], why: "unique" };
  const live = c.filter((h) => !isInactiveStatus(h.organisation_status));
  if (live.length === 1) return { pick: live[0], rest: [], why: "only_active" };
  if (live.length) c = live;
  const registered = c.filter((h) => h.registration_no);
  if (registered.length === 1) return { pick: registered[0], rest: c.filter((h) => !h.registration_no), why: "registered_over_placeholder" };
  return { pick: null, rest: c, why: "ambiguous" };
}

/** Former names and trading names written in a register entry, e.g. "X Ltd (formerly Y Ltd) (trading name "Z")" */
/** Top-level bracketed notes, respecting nested brackets: "A (ex B (EU) Ltd)" → ["ex B (EU) Ltd"] */
function bracketNotes(raw: string): string[] {
  const out: string[] = [];
  let depth = 0, start = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "(" || raw[i] === "[") { if (depth++ === 0) start = i + 1; }
    else if ((raw[i] === ")" || raw[i] === "]") && depth > 0) { if (--depth === 0) out.push(raw.slice(start, i)); }
  }
  if (depth > 0 && start >= 0) out.push(raw.slice(start)); // unclosed note at the end
  return out;
}

export function extractAlternateNames(raw: string): { formerNames: string[]; tradeNames: string[] } {
  const formerNames: string[] = [], tradeNames: string[] = [];
  const clean = (s: string) => s.replace(/^[\s,:\-–"“”']+|[\s,.;:\-–"“”']+$/g, "").replace(/\s+/g, " ").trim();
  for (const note of bracketNotes(raw)) {
    const m = note.match(/^\s*(?:ex|formerly|former name|previous name|previously)[:,]?\s+([\s\S]+)$/i);
    if (!m) continue;
    for (const part of m[1].split(/,?\s*(?:and,?\s*)?(?:previously|formerly)[,:]?\s+|\s+and\s+/i)) {
      const n = clean(part.replace(/^(?:ex|formerly)\s+/i, ""));
      if (n.length >= 3 && !/licen[cs]e|withdrawn|revoke/i.test(n)) formerNames.push(n);
    }
  }
  for (const m of raw.matchAll(/(?:trading names?|trade ?marks?|commercial names?|brand names?)\s*(?:-|:|–)?\s*([^)\n]+)/gi)) {
    const body = m[1];
    const quoted = [...body.matchAll(/["“]([^"”]+)["”]/g)].map((q) => q[1]);
    for (const n of (quoted.length ? quoted : body.split(/,|\s+and\s+/))) {
      const t = clean(n);
      if (t.length >= 3) tradeNames.push(t);
    }
  }
  return { formerNames: [...new Set(formerNames)], tradeNames: [...new Set(tradeNames)] };
}

// ---------- database resolver (edge functions) ----------

export type MatchInput = { name: string; registration_no?: string | null };
export type Match = {
  id: string | null;
  confidence: number;
  method: "registration_no" | "alias" | "alias_suffix" | "name_key" | "name_key_suffix" | "created" | "manual" | "ambiguous" | "none";
  label?: string;
  key?: string | null;
  candidates?: { id: string; label: string }[];
  /** Unregistered same-name placeholders that can be folded into the match */
  placeholders?: string[];
};

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const labelOf = (c: DirCandidate) => `${c.company_name}${c.registration_no ? ` (HE ${c.registration_no})` : ""}`;

/** Resolve many names in a few queries. `strict` (news) needs longer, more specific names for a name-only match. */
// deno-lint-ignore no-explicit-any
export async function resolveCompanies(supabase: any, inputs: MatchInput[], opts: { strict?: boolean } = {}): Promise<Match[]> {
  const strict = !!opts.strict;
  const regs = [...new Set(inputs.map((i) => normalizeRegNo(i.registration_no)).filter(Boolean))] as string[];
  const byReg = new Map<string, DirCandidate>();
  for (const c of chunk(regs, 150)) {
    const { data } = await supabase.from("directory_companies").select("id, name_key, company_name, registration_no, organisation_status").in("registration_no", c);
    for (const d of data || []) byReg.set(d.registration_no, d);
  }
  const keysPer = inputs.map((i) => matchKeys(i.name));
  const allKeys = [...new Set(keysPer.flat())];
  const alias = new Map<string, { id: string; label: string }>();
  const hits = new Map<string, DirCandidate[]>();
  for (const c of chunk(allKeys, 100)) {
    const [{ data: al }, { data: dc }] = await Promise.all([
      supabase.from("company_aliases").select("alias_key, directory_company_id, directory_companies(company_name)").in("alias_key", c),
      supabase.from("directory_companies").select("id, name_key, company_name, registration_no, organisation_status, organisation_type").in("name_key", c).limit(3000),
    ]);
    for (const a of al || []) alias.set(a.alias_key, { id: a.directory_company_id, label: a.directory_companies?.company_name ?? a.alias_key });
    for (const h of dc || []) hits.set(h.name_key, [...(hits.get(h.name_key) || []), h]);
  }

  return inputs.map((input, i): Match => {
    const keys = keysPer[i];
    const reg = normalizeRegNo(input.registration_no);
    const r = reg ? byReg.get(reg) : undefined;
    const sameKeyPlaceholders = (id: string) =>
      keys.length ? (hits.get(keys[0]) || []).filter((h) => h.id !== id && !h.registration_no).map((h) => h.id) : [];
    if (r) return { id: r.id, confidence: 1, method: "registration_no", label: r.company_name, key: keys[0] ?? null, placeholders: sameKeyPlaceholders(r.id) };
    if (!keys.length) return { id: null, confidence: 0, method: "none", key: null };

    let ambiguous: DirCandidate[] | null = null;
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      const suffix = k > 0;
      const a = alias.get(key);
      if (a && key.length >= 2) return { id: a.id, confidence: suffix ? 0.96 : 0.98, method: suffix ? "alias_suffix" : "alias", label: a.label, key, placeholders: sameKeyPlaceholders(a.id) };
      if (!isUsableKey(key, strict)) continue;
      const cands = hits.get(key) || [];
      if (!cands.length) continue;
      const { pick, rest } = pickCandidate(cands, reg);
      if (pick) return { id: pick.id, confidence: suffix ? 0.93 : 0.95, method: suffix ? "name_key_suffix" : "name_key", label: pick.company_name, key, placeholders: rest.filter((x) => !x.registration_no).map((x) => x.id) };
      ambiguous ??= rest;
    }
    if (ambiguous?.length) return { id: null, confidence: 0, method: "ambiguous", key: keys[0], candidates: ambiguous.slice(0, 5).map((c) => ({ id: c.id, label: labelOf(c) })) };
    return { id: null, confidence: 0, method: "none", key: keys[0] };
  });
}

export type AliasRow = { directory_company_id: string; alias: string; alias_type: "former_name" | "trade_name" | "regulator_name" | "curated"; source: string };

/**
 * Save official alternate names as aliases. Skipped when the name already belongs to another
 * company (alias or registry name) — such names are not safe identifiers.
 */
// deno-lint-ignore no-explicit-any
export async function saveAliases(supabase: any, rows: AliasRow[]): Promise<number> {
  // alias_key is generated by the database with normalize_company_name — mirrored here for the checks
  const stripNotes = (s: string) => s.replace(/\s*[([](?:ex|formerly|former|previously)\b[^)\]]*[)\]]?.*$/i, "").replace(/\s+/g, " ").trim();
  const withKeys = rows.map((r) => ({ ...r, alias: stripNotes(r.alias) }))
    .map((r) => ({ ...r, alias_key: normalizeCompanyName(r.alias) }))
    .filter((r) => r.alias_key && r.alias_key.length >= 3 && !GENERIC.has(r.alias_key) && !/\b(of|and|for)$/.test(r.alias_key));
  if (!withKeys.length) return 0;
  const keys = [...new Set(withKeys.map((r) => r.alias_key!))];
  const taken = new Set<string>();
  const owners = new Map<string, Set<string>>();
  const ownKey = new Map<string, string | null>();
  for (const c of chunk([...new Set(withKeys.map((r) => r.directory_company_id))], 150)) {
    const { data } = await supabase.from("directory_companies").select("id, name_key").in("id", c);
    for (const d of data || []) ownKey.set(d.id, d.name_key);
  }
  for (const c of chunk(keys, 100)) {
    const [{ data: al }, { data: dc }] = await Promise.all([
      supabase.from("company_aliases").select("alias_key").in("alias_key", c),
      supabase.from("directory_companies").select("id, name_key").in("name_key", c).limit(3000),
    ]);
    for (const a of al || []) taken.add(a.alias_key);
    for (const d of dc || []) owners.set(d.name_key, new Set([...(owners.get(d.name_key) || []), d.id]));
  }
  const seen = new Set<string>();
  const insert = withKeys.filter((r) => {
    const k = r.alias_key!;
    if (taken.has(k) || seen.has(k)) return false;
    const own = owners.get(k);
    if (own && (own.size > 1 || !own.has(r.directory_company_id))) return false; // another company's name
    if (own?.has(r.directory_company_id)) return false; // already the registry name
    // Only a spelling variant of the registry name ("… Public Ltd" vs "… Public Limited"): adds nothing
    if (r.alias_type === "regulator_name" && matchKeys(r.alias).includes(ownKey.get(r.directory_company_id) ?? "\u0000")) return false;
    seen.add(k);
    return true;
  });
  for (const c of chunk(insert.map(({ alias_key: _k, ...r }) => r), 100)) {
    const { error } = await supabase.from("company_aliases").upsert(c, { onConflict: "alias_key", ignoreDuplicates: true });
    if (error) console.error("Alias save:", error.message);
  }
  return insert.length;
}
