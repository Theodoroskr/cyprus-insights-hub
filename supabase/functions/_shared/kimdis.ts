// Pure helpers for the Greek public procurement register (KIMDIS / ΚΗΜΔΗΣ Open Data API).
// No Deno/Node imports so the site and Vitest can use them too.

export const KIMDIS_API = "https://cerpp.eprocurement.gov.gr/khmdhs-opendata";
export const KIMDIS_SEARCH_URL = "https://www.gov.gr/en/services/1001013/demosioteta-demosion-sumbaseon-kemdes";

export type ProcurementKind = "tender" | "award";
/** API endpoint per kind: Προσκλήσεις-Προκηρύξεις-Διακηρύξεις ("notice") and Αναθέσεις ("auction"). */
export const KIMDIS_ENDPOINT: Record<ProcurementKind, "notice" | "auction"> = { tender: "notice", award: "auction" };

export type FocusCategory = "it" | "cyber" | "compliance" | "professional";
export const FOCUS_LABELS: Record<FocusCategory, { en: string; el: string }> = {
  it: { en: "IT & software", el: "Πληροφορική & λογισμικό" },
  cyber: { en: "Cybersecurity", el: "Κυβερνοασφάλεια" },
  compliance: { en: "Compliance, legal & audit", el: "Συμμόρφωση, νομικά & έλεγχος" },
  professional: { en: "Professional services", el: "Επαγγελματικές υπηρεσίες" },
};

/** CPV code prefixes per focus category (CPV 2008). */
const FOCUS_CPV: Record<FocusCategory, string[]> = {
  it: ["72", "48", "302"],
  cyber: ["4873", "4876", "72212730"],
  compliance: ["7921", "7911", "7914"],
  professional: ["79", "73", "66"],
};
/** Words in a title that mark cybersecurity or compliance work even when the CPV code is generic. */
const FOCUS_WORDS: Partial<Record<FocusCategory, RegExp>> = {
  cyber: /(κυβερνοασφ[άα]λ|cyber|ασφ[άα]λει(α|ας) πληροφορ|ασφ[άα]λει(α|ας) (των )?πληροφοριακ|penetration|τε[ίι]χο(υς|ς)? προστασ[ίι]ας|firewall|\bSOC\b|NIS ?2)/i,
  compliance: /(GDPR|συμμ[όο]ρφωσ|κανονιστικ|προστασ[ίι]α(ς)? (των )?(προσωπικ[ώω]ν )?δεδομ[έε]νων|\bDPO\b|\bΥΠΔ\b|ξ[έε]πλυμα|\bAML\b|εσωτερικ[όοού]+ ελ[έε]γχ|ISO ?27001)/i,
};

export function focusOf(cpvCodes: string[], title: string): FocusCategory[] {
  const digits = cpvCodes.map((c) => c.replace(/\D/g, ""));
  const out: FocusCategory[] = [];
  for (const cat of Object.keys(FOCUS_CPV) as FocusCategory[]) {
    const byCpv = digits.some((d) => FOCUS_CPV[cat].some((p) => d.startsWith(p)));
    const byWord = FOCUS_WORDS[cat]?.test(title) ?? false;
    if (byCpv || byWord) out.push(cat);
  }
  return out;
}

/** Last Sunday of a month, as a UTC day number. */
function lastSunday(year: number, month: number): number {
  const d = new Date(Date.UTC(year, month + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
}

/** KIMDIS dates carry no time zone; they are Greek local time. "2026-11-26T15:00:00" → "2026-11-26T13:00:00.000Z". */
export function athensToIso(local: string | null | undefined): string | null {
  if (!local) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/.exec(local.trim());
  if (!m) return null;
  const [y, mo, d, h = "0", mi = "0", s = "0"] = m.slice(1).map((x) => x ?? undefined) as string[];
  const Y = Number(y), M = Number(mo) - 1, D = Number(d);
  const asUtc = Date.UTC(Y, M, D, Number(h), Number(mi), Number(s));
  // EU summer time: last Sunday of March 01:00 UTC → last Sunday of October 01:00 UTC.
  const start = Date.UTC(Y, 2, lastSunday(Y, 2), 1);
  const end = Date.UTC(Y, 9, lastSunday(Y, 9), 1);
  let offset = 2;
  const guess = asUtc - 3 * 3_600_000;
  if (guess >= start && guess < end) offset = 3;
  return new Date(asUtc - offset * 3_600_000).toISOString();
}

// deno-lint-ignore no-explicit-any
type Json = any;

export type ProcurementRow = {
  reference_number: string; kind: ProcurementKind; title: string;
  authority_name: string | null; authority_code: string | null;
  notice_type: string | null; procedure_type: string | null; contract_type: string | null;
  published_at: string | null; signed_date: string | null; deadline_at: string | null;
  value_without_vat: number | null; value_with_vat: number | null; currency: string | null;
  cpv_codes: string[]; cpv_labels: string[]; focus: FocusCategory[];
  nuts_code: string | null; nuts_label: string | null; cancelled: boolean;
  amends_reference: string | null; winners: string[];
  official_url: string; diavgeia_url: string | null; source_updated_at: string | null;
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const REF = { tender: /^\d{2}PROC\d{9}$/, award: /^\d{2}AWRD\d{9}$/ } as const;

/**
 * One KIMDIS record → a stored row, or a reason it was rejected.
 * Values are kept as published (a 0 stays 0, a missing value stays null), never guessed.
 */
export function mapRecord(kind: ProcurementKind, r: Json): { row: ProcurementRow } | { rejected: string } {
  const ref = str(r?.referenceNumber);
  if (!ref || !REF[kind].test(ref)) return { rejected: `bad reference ${ref ?? "(none)"}` };
  const title = str(r?.title);
  if (!title) return { rejected: `${ref}: no title` };
  const items: Json[] = (kind === "tender" ? r.objectDetails : r.objectDetailsList) ?? [];
  const cpvs = new Map<string, string>();
  const currencies = new Set<string>();
  for (const it of Array.isArray(items) ? items : []) {
    for (const c of it?.cpvs ?? []) { const k = str(c?.key); if (k && /^\d{8}-\d$/.test(k) && !cpvs.has(k)) cpvs.set(k, str(c?.value) ?? k); }
    const cur = str(it?.currency?.key); if (cur) currencies.add(cur);
  }
  const amends = kind === "tender"
    ? (r.amendPreviousNotice ? str(r.amendedNoticeADAM) : null)
    : (r.amendPreviousAuction ? str(r.amendedAuctionADAM) : null);
  const winners: string[] = kind === "award"
    ? (r.contractingDataDetails?.contractingMembersDataList ?? []).map((w: Json) => str(w?.name)).filter(Boolean)
    : [];
  const cpvCodes = [...cpvs.keys()];
  const signed = str(r.signedDate);
  return {
    row: {
      reference_number: ref, kind, title,
      authority_name: str(r.organization?.value), authority_code: str(r.organization?.key),
      notice_type: kind === "tender" ? str(r.noticeType?.value) : str(r.auctionDiaygeiaType?.value),
      procedure_type: str((kind === "tender" ? r.typeOfProcedure : r.procedureType)?.value),
      contract_type: str(r.contractType?.value),
      published_at: athensToIso(str(r.submissionDate)),
      signed_date: signed ? signed.slice(0, 10) : null,
      deadline_at: kind === "tender" ? athensToIso(str(r.finalSubmissionDate)) : null,
      value_without_vat: num(r.totalCostWithoutVAT), value_with_vat: num(r.totalCostWithVAT),
      currency: currencies.size === 1 ? [...currencies][0] : null,
      cpv_codes: cpvCodes, cpv_labels: cpvCodes.map((k) => cpvs.get(k)!),
      focus: focusOf(cpvCodes, title),
      nuts_code: str(r.nutsCode?.key), nuts_label: str(r.nutsCode?.value),
      cancelled: r.cancelled === true,
      amends_reference: amends, winners,
      official_url: `${KIMDIS_API}/${KIMDIS_ENDPOINT[kind]}/attachment/${ref}`,
      diavgeia_url: str(r.diavgeiaLink),
      source_updated_at: athensToIso(str(r.lastUpdateDate)),
    },
  };
}

export type OpenCheck = { kind: ProcurementKind; deadline_at: string | null; cancelled: boolean; superseded_by?: string | null };
/** Open tender = a call for tenders, not cancelled or replaced by an amendment, with a submission deadline still in the future. */
export function isOpenTender(n: OpenCheck, now: Date = new Date()): boolean {
  return n.kind === "tender" && !n.cancelled && !n.superseded_by && !!n.deadline_at && new Date(n.deadline_at).getTime() > now.getTime();
}

export type SearchFilters = {
  kind?: ProcurementKind; q?: string; authority?: string; focus?: FocusCategory | "";
  minValue?: number | null; maxValue?: number | null; from?: string | null; to?: string | null;
};
type Matchable = OpenCheck & { title: string; authority_name: string | null; focus: string[]; value_without_vat: number | null; published_at: string | null };

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Same filter rules for the Opportunities page and the daily digest. Open-tender rule applies to kind "tender". */
export function matchesSearch(n: Matchable, f: SearchFilters, now: Date = new Date()): boolean {
  const kind = f.kind ?? "tender";
  if (n.kind !== kind) return false;
  if (kind === "tender" && !isOpenTender(n, now)) return false;
  if (n.superseded_by) return false;
  if (f.q && !fold(n.title).includes(fold(f.q.trim()))) return false;
  if (f.authority && !fold(n.authority_name ?? "").includes(fold(f.authority.trim()))) return false;
  if (f.focus && !n.focus.includes(f.focus)) return false;
  if (f.minValue != null && (n.value_without_vat == null || n.value_without_vat < f.minValue)) return false;
  if (f.maxValue != null && (n.value_without_vat == null || n.value_without_vat > f.maxValue)) return false;
  const day = n.published_at ? n.published_at.slice(0, 10) : null;
  if (f.from && (!day || day < f.from)) return false;
  if (f.to && (!day || day > f.to)) return false;
  return true;
}
