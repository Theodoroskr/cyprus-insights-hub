/**
 * Funding & Subsidies rules shared by the importer (Deno) and the site (Vite).
 * Pure functions only: no network, no database.
 */

export type CallStatus = "review" | "verified" | "rejected" | "ineligible" | "merged";
export type CallState = "upcoming" | "open" | "ongoing" | "closed";

export interface CallInput {
  issuer: string;
  programme?: string | null;
  call_reference?: string | null;
  round?: string | null;
  title_en: string;
  title_el?: string | null;
  summary_en?: string | null;
  eligibility_summary?: string | null;
  instrument_type?: string;
  sectors?: string[];
  applicant_types?: string[];
  geography?: string;
  eligible_costs?: string | null;
  cofunding_rate?: string | null;
  max_award_eur?: number | null;
  total_budget_eur?: number | null;
  opening_date?: string | null;
  deadline_date?: string | null;
  deadline_time?: string | null;
  consortium_requirements?: string | null;
  application_url?: string | null;
  official_url: string;
}

export interface ExistingCall extends CallInput {
  id: string;
  status: CallStatus;
  editor_locked_fields?: string[];
}

/** Fields an editor must approve before they change on an already verified call. */
export const REVIEWED_FIELDS = ["deadline_date", "deadline_time", "total_budget_eur", "max_award_eur", "eligibility_summary", "applicant_types", "call_state"] as const;

const ISSUER_CODES: [RegExp, string][] = [
  [/research\s*(&|and)?\s*innovation foundation|ιδρυμα ερευνας|ιδεκ|\brif\b/i, "rif"],
  [/european commission|funding\s*&?\s*tenders|\beu\b/i, "ec"],
  [/energy,? commerce|meci|υπουργειο ενεργειας/i, "meci"],
  [/deputy ministry of tourism|υφυπουργειο τουρισμου/i, "dmt"],
  [/res and energy conservation|resecfund|ταμειο ape/i, "resec"],
  [/hrda|human resource development|αναδ/i, "hrda"],
];

function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function issuerCode(issuer: string): string {
  const s = deaccent(issuer).toLowerCase();
  for (const [re, code] of ISSUER_CODES) if (re.test(s)) return code;
  return s.replace(/[^a-z0-9α-ω]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export function normRef(ref: string | null | undefined): string {
  return deaccent(ref ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** One record per call: issuer + official reference + round. Titles stand in only when no reference exists. */
export function dedupeKey(c: Pick<CallInput, "issuer" | "call_reference" | "round" | "title_en">): string {
  const ref = normRef(c.call_reference);
  const base = ref || "T:" + deaccent(c.title_en).toLowerCase().replace(/[^a-z0-9α-ω]+/g, " ").trim().slice(0, 120);
  return [issuerCode(c.issuer), base, normRef(c.round) || "-"].join("|");
}

/** Call codes as Cyprus issuers publish them, e.g. CONCEPT-HYDRO-1026, NCC-CY-FTI-1026, HORIZON-CL5-2026-11-D3-06. */
export function extractCallReference(text: string): string | null {
  const m = text.match(/\b([A-Z][A-Z0-9]{1,14}(?:-[A-Z0-9]{1,14}){1,6})\b/);
  if (!m) return null;
  return /\d/.test(m[1]) ? m[1] : null;
}

export function callState(c: { opening_date?: string | null; deadline_date?: string | null }, today: string): CallState {
  if (c.deadline_date && c.deadline_date < today) return "closed";
  if (c.opening_date && c.opening_date > today) return "upcoming";
  if (!c.deadline_date) return "ongoing";
  return "open";
}

const SECTOR_RULES: [string, RegExp][] = [
  ["tourism", /touris|hotel|hospitality|τουρισ|ξενοδοχ|agrotour/i],
  ["energy", /energy|renewable|photovolta|solar|hydrogen|ενεργει|φωτοβολτα|\bres\b|CL5/i],
  ["research_innovation", /research|innovation|horizon|r&i|eurostars|startup|start-up|proof of concept|καινοτομ|ερευν|EIC|MSCA|ERC/i],
  ["digital", /digital|cyber|\bai\b|artificial intelligence|data|ψηφιακ|κυβερνοασφ/i],
  ["agriculture", /agricultur|rural|farm|γεωργ|αγροτ|AGRIP/i],
  ["fisheries", /fisher|aquacultur|maritime|αλιεί|υδατοκαλλ|EMFAF/i],
  ["culture", /cultur|creative|heritage|πολιτισ|CREA/i],
  ["education_training", /erasmus|education|training|skills|εκπαιδ|κατάρτισ/i],
  ["employment", /employment|labour|job|απασχόλ|εργασ/i],
  ["environment_climate", /environment|climate|circular|biodiversity|LIFE-|περιβαλλ|κλιμα/i],
  ["health", /health|medic|EU4H|υγει/i],
  ["transport", /transport|mobility|CEF-T|μεταφορ/i],
  ["sme_business", /\bsme|small and medium|entrepreneur|business|enterprise|μμε|επιχειρ|SMP-/i],
];

export function classifySectors(text: string, defaults: string[] = []): string[] {
  const out = new Set(defaults);
  for (const [s, re] of SECTOR_RULES) if (re.test(text)) out.add(s);
  if (out.size === 0) out.add("other");
  return [...out];
}

/** EU programme name from a topic/call identifier prefix. */
export function euProgramme(identifier: string): string {
  const p = identifier.split("-")[0];
  const map: Record<string, string> = {
    HORIZON: "Horizon Europe", DIGITAL: "Digital Europe", LIFE: "LIFE", ERASMUS: "Erasmus+", CREA: "Creative Europe",
    EMFAF: "European Maritime, Fisheries and Aquaculture Fund", CEF: "Connecting Europe Facility", SMP: "Single Market Programme",
    EU4H: "EU4Health", CERV: "Citizens, Equality, Rights and Values", I3: "Interregional Innovation Investments", EDF: "European Defence Fund",
    AGRIP: "Agricultural promotion", ESF: "European Social Fund+", EUAF: "Union Anti-Fraud Programme", RFCS: "Research Fund for Coal and Steel",
    INNOVFUND: "Innovation Fund", SOCPL: "Social Prerogative", JUST: "Justice Programme", UCPM: "Union Civil Protection Mechanism",
    ISF: "Internal Security Fund", AMIF: "Asylum, Migration and Integration Fund", BMVI: "Border Management and Visa", PPPA: "Pilot projects and preparatory actions",
    EURATOM: "Euratom", IMREG: "Interregional Mobility", ESA: "European Solidarity Corps", ESC: "European Solidarity Corps",
  };
  return map[p] ?? p;
}

const OTHER_STATES = ["Austria","Belgium","Bulgaria","Croatia","Czech","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden","Ukraine","Norway","Iceland","Türkiye","Turkey","Albania","Serbia","Moldova","Georgia","Armenia","Israel","Tunisia","Morocco","Egypt"];
const STATE_CODES = ["AT","BE","BG","HR","CZ","DK","EE","FI","FR","DE","EL","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","UA","NO","IS","TR","AL","RS","MD","GE","AM","IL","TN","MA","EG"];

/**
 * Can an applicant established in Cyprus apply?
 * EU topics (calls for proposals, tenders) are open to every Member State.
 * Cascade funding calls (third-party support) are run by a project and are often limited to one country:
 * they count only when the text names Cyprus, or names no single other country.
 */
export function euEligibleForCyprus(kind: "topic" | "cascade", text: string, acronym = ""): { eligible: boolean; reason?: string } {
  if (kind === "topic") return { eligible: true };
  if (/cyprus|cypriot|κύπρ|κυπρ|\bCY\b/i.test(text) || /-CY\b|\bCY-/i.test(acronym)) return { eligible: true };
  const code = acronym.toUpperCase().match(/-([A-Z]{2})$/)?.[1];
  if (code && STATE_CODES.includes(code)) return { eligible: false, reason: `Limited to applicants in ${code}` };
  const domestic = /\b(domestic|national|resident in|established in|registered in)\b/i.test(text);
  const named = OTHER_STATES.filter((s) => new RegExp(`\\b${s}`, "i").test(text));
  if (domestic && named.length === 1) return { eligible: false, reason: `Limited to applicants in ${named[0]}` };
  return { eligible: true };
}

export type ChangeKind = "deadline_extension" | "deadline_change" | "budget_change" | "budget_exhausted" | "suspension" | "eligibility_change" | "correction";

export interface Change { field: string; old_value: string | null; new_value: string | null; change_kind: ChangeKind }

export interface MergePlan {
  action: "insert" | "update" | "none";
  /** Fields written straight away. */
  patch: Record<string, unknown>;
  /** Changes held for an editor (verified calls only). */
  changes: Change[];
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return Array.isArray(v) ? [...v].sort().join(",") : String(v);
}

function kindFor(field: string, oldV: string | null, newV: string | null, text = ""): ChangeKind {
  if (/suspend|αναστολ/i.test(text)) return "suspension";
  if (/exhaust|εξάντλ/i.test(text)) return "budget_exhausted";
  if (field.startsWith("deadline")) return oldV && newV && newV > oldV ? "deadline_extension" : "deadline_change";
  if (field.includes("budget") || field.includes("award")) return "budget_change";
  if (field === "eligibility_summary" || field === "applicant_types") return "eligibility_change";
  return "correction";
}

/**
 * How an imported record lands. New key: insert. Existing call: fill blanks, never touch editor-locked fields,
 * and send changes to reviewed fields of a verified call to the editor instead of writing them.
 */
export function planMerge(existing: ExistingCall | null, incoming: CallInput, noticeText = ""): MergePlan {
  if (!existing) return { action: "insert", patch: { ...incoming, dedupe_key: dedupeKey(incoming) }, changes: [] };
  const locked = new Set(existing.editor_locked_fields ?? []);
  const patch: Record<string, unknown> = {};
  const changes: Change[] = [];
  for (const [field, value] of Object.entries(incoming)) {
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (locked.has(field)) continue;
    const oldV = str((existing as unknown as Record<string, unknown>)[field]);
    const newV = str(value);
    if (oldV === newV) continue;
    const reviewed = (REVIEWED_FIELDS as readonly string[]).includes(field);
    if (existing.status === "verified" && reviewed && oldV !== null) {
      changes.push({ field, old_value: oldV, new_value: newV, change_kind: kindFor(field, oldV, newV, noticeText) });
    } else if (oldV === null || existing.status !== "verified" || !reviewed) {
      // Titles/summaries/links on verified calls are refreshed only when blank, so editor wording survives.
      if (existing.status === "verified" && oldV !== null && ["title_en", "title_el", "summary_en", "summary_el"].includes(field)) continue;
      patch[field] = value;
    }
  }
  const hasPatch = Object.keys(patch).length > 0;
  return { action: hasPatch || changes.length ? "update" : "none", patch, changes };
}

/** A notice that only reports a change to an existing call (extension, suspension...) rather than a new call. */
export function isChangeNotice(title: string): boolean {
  return /extension|extended|παράταση|suspen|αναστολ|correction|corrigendum|διόρθωσ|exhaust|εξάντλ|amend|τροποπ/i.test(title);
}

/** Headlines that announce a funding call (Greek or English). */
export function looksLikeCall(title: string): boolean {
  return /call for proposals|new call|pre-announcement|funding programme|grant scheme|subsid|voucher|scheme|πρόσκληση|προκήρυξη|σχέδιο χορηγ|χορηγ|επιδότ/i.test(title);
}
