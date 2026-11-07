// Parsers for the official Central Bank of Cyprus registers.
//  - Credit institutions: server-rendered HTML list (licensing-supervision/banks/register-of-credit-institutions…)
//  - Electronic money, payment and account-information institutions: the CBC's own .xlsx registers,
//    linked from licensing-supervision/payment-institutions-and-electronic-money-institutions/registers
// Pure functions only — used by the scrape-regulators edge function, the admin review panel and unit tests.
import { extractAlternateNames, foldHomoglyphs } from "./companyMatcher.ts";
import { type Cell, excelDateToIso, type Sheet } from "./xlsxReader.ts";

export const CBC_BASE = "https://www.centralbank.cy";
export const CBC_CREDIT_INSTITUTIONS_URL = `${CBC_BASE}/en/licensing-supervision/banks/register-of-credit-institutions-operating-in-cyprus`;
export const CBC_PAYMENT_REGISTERS_URL = `${CBC_BASE}/en/licensing-supervision/payment-institutions-and-electronic-money-institutions/registers`;

export type CbcList = { name: string; licenseType: string; priority: number; former?: boolean };
export const CBC_LISTS = {
  bank: { name: "CBC — Credit Institutions", licenseType: "Credit Institution", priority: 1 },
  branch: { name: "CBC — Branches of Foreign Credit Institutions", licenseType: "Credit Institution (branch of foreign bank)", priority: 2 },
  rep: { name: "CBC — Representative Offices", licenseType: "Bank Representative Office", priority: 6 },
  emi: { name: "CBC — Electronic Money Institutions", licenseType: "Electronic Money Institution (EMI)", priority: 3 },
  emiFormer: { name: "CBC — Former Electronic Money Institutions", licenseType: "Electronic Money Institution (EMI)", priority: 13, former: true },
  pi: { name: "CBC — Payment Institutions", licenseType: "Payment Institution (PI)", priority: 4 },
  piFormer: { name: "CBC — Former Payment Institutions", licenseType: "Payment Institution (PI)", priority: 14, former: true },
  aisp: { name: "CBC — Account Information Service Providers", licenseType: "Account Information Service Provider (AISP)", priority: 5 },
} satisfies Record<string, CbcList>;
export const CBC_LIST_PRIORITY: Record<string, number> = Object.fromEntries(Object.values(CBC_LISTS).map((l) => [l.name, l.priority]));

/** Statuses under which the firm still holds a CBC authorisation, best first */
export const CBC_CURRENT_STATUSES = ["Active", "Representative office", "Restricted", "Licence not yet activated", "Licensed – not yet operating", "Withdrawal in progress"];
export const isCbcCurrent = (s?: string | null) => !!s && CBC_CURRENT_STATUSES.includes(s);
/** Changes into these statuses need editorial review before appearing on a company timeline */
export const CBC_ADVERSE_STATUSES = ["Restricted", "Withdrawal in progress", "Withdrawn", "Lapsed"];

export type CbcEntry = {
  entity_name: string;
  raw_name: string;
  license_number: string | null;
  registration_no: string | null;
  lei: string | null;
  license_date: string | null;
  termination_date: string | null;
  status: string;
  status_note: string | null;
  website: string | null;
  former_names: string[];
  trade_names: string[];
};

const decode = (t: string) =>
  t.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();

const toIso = (v: Cell): string | null => {
  if (typeof v === "number") return v > 20000 && v < 80000 ? excelDateToIso(v) : null;
  const s = String(v ?? "");
  const all = [...s.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)];
  const m = all[all.length - 1]; // "Original … / Current Lic. date" → the latest one
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[0] : null;
};

/**
 * Firm name without the register's notes: first line, before any "*" or note in brackets.
 * Short brackets that are part of the legal name — "(Cyprus)", "(Europe)", "(Cy)" — are kept.
 */
export function cleanCbcName(raw: string): string {
  let s = raw.replace(/\r/g, "").split("\n")[0];
  const star = s.indexOf("*");
  if (star > 0) s = s.slice(0, star);
  s = s.replace(/\s*\(([^)]*)\)?/g, (m, inner: string) =>
    inner.trim().split(/\s+/).length <= 3 && !/^(ex|formerly|former|previous|previously|operating|trading|commercial|licen[cs]e|the)\b/i.test(inner.trim()) ? m : " ");
  return foldHomoglyphs(s).replace(/\s+/g, " ").trim(); // the register writes "Αlpha" with a Greek Α
}

/** Map the CBC's notes to a short public status label */
export function mapCbcStatus(raw: string, kind: "bank" | "emi" | "pi" | "former"): string {
  const n = raw.toLowerCase();
  if (kind === "former") return /no longer valid|not made use/.test(n) ? "Lapsed" : "Withdrawn";
  if (/operations shall commence upon approval/.test(n)) return "Licensed – not yet operating";
  if (/process of withdrawing|decided to terminate/.test(n)) return "Withdrawal in progress";
  if (kind === "emi" && /by the time its licence as an emi gets activated/.test(n)) return "Licence not yet activated";
  return "Active";
}

/** Credit institutions page: numbered lists under section headings */
export function parseCreditInstitutions(html: string): { list: CbcList; entry: CbcEntry }[] {
  const start = html.search(/LOCAL\s*(?:&nbsp;|\s)*AUTHORISED/i);
  const endIdx = html.search(/National Identification Codes/i);
  const body = html.slice(Math.max(0, start - 200), endIdx > start ? endIdx : undefined);
  const restricted = /not permitted to engage in any banking business/i.test(body);
  const out: { list: CbcList; entry: CbcEntry }[] = [];
  let section: CbcList = CBC_LISTS.bank;
  for (const m of body.matchAll(/<(b|strong)>([\s\S]*?)<\/\1>|<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    if (m[2] != null) {
      const h = decode(m[2]).toUpperCase();
      if (/REPRESENTATIVE OFFICES/.test(h)) section = CBC_LISTS.rep;
      else if (/SUBSIDIARIES|LOCAL AUTHORISED/.test(h)) section = CBC_LISTS.bank;
      else if (/^\W*(?:[A-Z]|I+)\.\s*BRANCHES/.test(h)) section = CBC_LISTS.branch;
      continue;
    }
    const li = m[3];
    const text = decode(li);
    const name = decode((li.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i) || [])[1] || text);
    if (!name || name.length < 3) continue;
    const href = (li.match(/<a\b[^>]*href="([^"]+)"/i) || [])[1] || null;
    const starred = /\*\s*$/.test(text);
    const alt = extractAlternateNames(text);
    out.push({
      list: section,
      entry: {
        entity_name: cleanCbcName(name),
        raw_name: text,
        license_number: null, registration_no: null, lei: null, license_date: null, termination_date: null,
        status: section === CBC_LISTS.rep ? "Representative office" : starred && restricted ? "Restricted" : "Active",
        status_note: starred && restricted ? "Licence amended: no new banking business permitted" : null,
        website: href && /^https?:/i.test(href) ? href.replace(/\/$/, "") : null,
        former_names: alt.formerNames,
        trade_names: alt.tradeNames,
      },
    });
  }
  return out;
}

/** The .xlsx register links on the CBC registers page (file names carry the update date) */
export function findRegisterLinks(html: string): { emi: string | null; pi: string | null } {
  const links = [...html.matchAll(/href="([^"]+\.xlsx)"/gi)].map((m) => (m[1].startsWith("http") ? m[1] : CBC_BASE + m[1]));
  const pick = (re: RegExp) => links.find((l) => re.test(decodeURIComponent(l)) && !/passp|incom/i.test(l)) || null;
  return { emi: pick(/EMI-REGISTER|Electronic Money/i), pi: pick(/PI-register|Payment Institutions\//i) };
}

const str = (v: Cell) => (v == null ? "" : String(v)).trim();

/** Current-licence sheets ("EMIs", "PI licensed in CY", "AISP licensed in CY") */
export function parseInstitutionSheet(sheet: Sheet, list: CbcList, kind: "emi" | "pi"): CbcEntry[] {
  const hdr = sheet.rows.findIndex((r) => r.some((c) => /^names? of licensed/i.test(str(c))));
  if (hdr < 0) return [];
  const h = sheet.rows[hdr].map(str);
  const col = (re: RegExp) => h.findIndex((c) => re.test(c));
  const cName = col(/^names? of licensed/i), cLic = col(/licen[cs]e\s*\n?\s*no/i), cLei = col(/\bLEI\b/i);
  const cReg = col(/registr/i), cDate = col(/date of authori|authori[sz]ation dates?/i);
  const out: CbcEntry[] = [];
  for (const r of sheet.rows.slice(hdr + 1)) {
    const raw = str(r[cName]);
    if (!raw || raw.length < 3) continue;
    const lic = cLic >= 0 ? str(r[cLic]) : "";
    if (!/\d/.test(lic)) continue; // notes and agent rows have no licence number
    const reg = cReg >= 0 ? str(r[cReg]).replace(/\s/g, "") : "";
    const alt = extractAlternateNames(raw);
    const status = mapCbcStatus(raw, kind);
    out.push({
      entity_name: cleanCbcName(raw),
      raw_name: raw.replace(/\s+/g, " "),
      license_number: lic,
      registration_no: (reg.match(/^(?:HE|ΗΕ)?0*(\d{2,8})$/i) || [])[1] || null,
      lei: cLei >= 0 ? (str(r[cLei]).match(/^[A-Z0-9]{20}$/) || [])[0] || null : null,
      license_date: cDate >= 0 ? toIso(r[cDate]) : null,
      termination_date: null,
      status,
      status_note: status === "Active" ? null : raw.split("\n").slice(1).join(" ").replace(/\s+/g, " ").trim().slice(0, 300) || null,
      website: null,
      former_names: alt.formerNames,
      trade_names: alt.tradeNames,
    });
  }
  return out;
}

/** "…licence withdrawn" sheets: licence number, name (often with the withdrawal date), optional date column */
export function parseWithdrawnSheet(sheet: Sheet): CbcEntry[] {
  const out: CbcEntry[] = [];
  for (const r of sheet.rows) {
    const lic = str(r[0]);
    const raw = str(r[1]);
    if (!/^\d+(\.\d+)+/.test(lic)) {
      // A note row under the previous firm, e.g. "The licence of Atlas Pay Ltd is no longer valid…"
      if (!lic && raw && out.length && /no longer valid|not made use/i.test(raw)) {
        const prev = out[out.length - 1];
        prev.status = "Lapsed";
        prev.status_note = raw.slice(0, 300);
      }
      continue;
    }
    if (!raw) continue;
    const alt = extractAlternateNames(raw);
    out.push({
      entity_name: cleanCbcName(raw),
      raw_name: raw.replace(/\s+/g, " "),
      license_number: lic,
      registration_no: null, lei: null, license_date: null,
      termination_date: toIso(r[2] ?? null) || toIso((raw.match(/withdrawn on ([\d/]+)/i) || [])[1] ?? null),
      status: mapCbcStatus(raw, "former"),
      status_note: null,
      website: null,
      former_names: alt.formerNames,
      trade_names: alt.tradeNames,
    });
  }
  return out;
}

/** All entries from the EMI and PI workbooks */
export function parsePaymentWorkbooks(emi: Sheet[], pi: Sheet[]): { list: CbcList; entry: CbcEntry }[] {
  const out: { list: CbcList; entry: CbcEntry }[] = [];
  for (const s of emi) {
    if (/withdraw/i.test(s.name)) parseWithdrawnSheet(s).forEach((entry) => out.push({ list: CBC_LISTS.emiFormer, entry }));
    else parseInstitutionSheet(s, CBC_LISTS.emi, "emi").forEach((entry) => out.push({ list: CBC_LISTS.emi, entry }));
  }
  for (const s of pi) {
    if (/withdraw/i.test(s.name)) parseWithdrawnSheet(s).forEach((entry) => out.push({ list: CBC_LISTS.piFormer, entry }));
    else {
      const list = /aisp/i.test(s.name) ? CBC_LISTS.aisp : CBC_LISTS.pi;
      parseInstitutionSheet(s, list, "pi").forEach((entry) => out.push({ list, entry }));
    }
  }
  return out;
}

/** Sheets worth reading (skips the large agent/contact sheets) */
export const wantedCbcSheet = (name: string) => /^EMIs$|licen[cs]e withdrawn|licensed in CY/i.test(name.trim());

type CbcRow = { status: string | null; license_type: string | null; license_number: string | null; priority?: number | null };

/** The CBC authorisation shown on a company profile: current first, then best status, then register priority */
export function cbcFlagsFor(rows: CbcRow[]) {
  if (!rows.length) return { cbc_supervised: false, cbc_license_type: null, cbc_license_number: null, cbc_status: null };
  const rank = (s: string | null) => (isCbcCurrent(s) ? CBC_CURRENT_STATUSES.indexOf(s!) : 50);
  const p = [...rows].sort((a, b) => rank(a.status) - rank(b.status) || (a.priority ?? 99) - (b.priority ?? 99))[0];
  return { cbc_supervised: isCbcCurrent(p.status), cbc_license_type: p.license_type, cbc_license_number: p.license_number, cbc_status: p.status };
}
