// Parser for the official CySEC entity registers (cysec.gov.cy/en-GB/entities/...).
// Every register uses the same server-rendered "card" layout, so one parser reads them all.
// Pure functions only — imported by the scrape-regulators edge function and by unit tests.

export type CysecList = {
  name: string;
  path: string;
  licenseType: string;
  /** Register of former licensees (withdrawn / renounced / revoked) */
  former?: boolean;
  /** Lower = preferred when a company holds several current licences */
  priority: number;
};

export const CYSEC_LISTS: CysecList[] = [
  { name: "CySEC — Investment Firms", path: "/en-GB/entities/investment-firms/cypriot/", licenseType: "Cyprus Investment Firm (CIF)", priority: 1 },
  { name: "CySEC — UCITS Management Companies", path: "/en-GB/entities/ucits/cypriot-management-companies/ΑΔΕΙΔΟΤΗΜΕΝΕΣ-ΗΜΕΔΑΠΕΣ-ΕΤΑΙΡΕΙΕΣ-ΔΙΑΧΕΙΡΙΣΗΣ/", licenseType: "UCITS Management Company", priority: 2 },
  { name: "CySEC — AIFMs", path: "/en-GB/entities/aifm/authorised/authorised-aifm/", licenseType: "Alternative Investment Fund Manager (AIFM)", priority: 3 },
  { name: "CySEC — Small AIFMs", path: "/en-GB/entities/aifm/small-aifm/ΑΔΕΙΟΔΟΤΗΜΕΝΟΙ-ΜιΔΟΕΕ/", licenseType: "Small AIFM", priority: 4 },
  { name: "CySEC — CASPs (MiCAR)", path: "/en-GB/entities/Crypto-Assets-Entities-(MiCAR)/MiCAR-CASPs/Licensees-(Article-63)/", licenseType: "Crypto-Asset Service Provider (MiCA)", priority: 5 },
  { name: "CySEC — Crowdfunding Service Providers", path: "/en-GB/entities/CROWDFUNDING-SERVICE-PROVIDERS-(CSP)/ΜΗΤΡΩΟ-ΠΥΣΧ/", licenseType: "Crowdfunding Service Provider", priority: 6 },
  { name: "CySEC — Administrative Service Providers", path: "/en-GB/entities/asp/list/", licenseType: "Administrative Service Provider (ASP)", priority: 7 },
  { name: "CySEC — Former Investment Firms", path: "/en-GB/entities/investment-firms/former-investment-firms-cypriot/", licenseType: "Cyprus Investment Firm (CIF)", former: true, priority: 11 },
  { name: "CySEC — Former UCITS Management Companies", path: "/en-GB/entities/ucits/cypriot-management-companies/ΠΡΩΗΝ-ΗΜΕΔΑΠΕΣ-ΕΤΑΙΡΕΙΕΣ-ΔΙΑΧΕΙΡΙΣΗΣ/", licenseType: "UCITS Management Company", former: true, priority: 12 },
  { name: "CySEC — Former AIFMs", path: "/en-GB/entities/aifm/authorised/former-aifm/", licenseType: "Alternative Investment Fund Manager (AIFM)", former: true, priority: 13 },
  { name: "CySEC — Former Small AIFMs", path: "/en-GB/entities/aifm/small-aifm/ΠΡΩΗΝ-ΜιΔΟΕΕ/", licenseType: "Small AIFM", former: true, priority: 14 },
];

export const CYSEC_BASE = "https://www.cysec.gov.cy";
export const cysecUrl = (path: string) => CYSEC_BASE + encodeURI(path);

/** Statuses under which the firm still holds a CySEC licence */
export const CURRENT_STATUSES = ["Active", "Renunciation pending", "Voluntary suspension", "Suspended"];
export const isCurrentStatus = (s?: string | null) => !!s && CURRENT_STATUSES.includes(s);
/** Changes into these statuses are adverse and need editorial review before appearing on a timeline */
export const ADVERSE_STATUSES = ["Suspended", "Revoked", "Withdrawn"];

export type CysecEntry = {
  entity_name: string;
  raw_name: string;
  license_number: string | null;
  registration_no: string | null;
  lei: string | null;
  license_date: string | null; // ISO yyyy-mm-dd
  termination_date: string | null;
  status: string;
  status_note: string | null;
  email: string | null;
  website: string | null;
  detail_url: string | null;
};

const decode = (t: string) =>
  t.replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&#8217;/g, "'").replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ").trim();

const LABELS = "Licence Date|LEI Code|Company Registration Number|CySEC Registration Number|Registration Date|Reg\\. Date|Date of Termination|Telephone|Fax|Country|E-Mail|Approved Trade Names|Scope Of Authori[sz]ation|Administrative Services|Website";

const toIso = (d?: string | null) => {
  const m = d?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};

/** Strip "(ex …)", "(revoke …)" and similar register notes from a firm name */
export function cleanEntityName(raw: string): string {
  const cut = raw.search(/\s*[([](?:ex|formerly|former|revoke|revoked|withdrawn|voluntary|suspended|under examination)\b/i);
  return (cut > 0 ? raw.slice(0, cut) : raw).replace(/\s+/g, " ").trim();
}

/** Map CySEC wording to a short public status label */
export function mapCysecStatus(note: string | null, former = false): string {
  const n = (note || "").toLowerCase();
  if (/under examination/.test(n) && /renunciation/.test(n)) return "Renunciation pending";
  if (/suspen/.test(n)) return /voluntar/.test(n) ? "Voluntary suspension" : "Suspended";
  if (/revok/.test(n)) return "Revoked";
  if (/withdraw/.test(n)) return "Withdrawn";
  if (/renunciation|renounce/.test(n)) return "Voluntary renunciation";
  if (/laps/.test(n)) return "Lapsed";
  if (/non activated|not activated/.test(n)) return "Not activated";
  return former ? "Former licence" : "Active";
}

export function parseCysecRegister(html: string, list: Pick<CysecList, "former">): CysecEntry[] {
  const chunks = html.split(/class="card-title"/);
  const out: CysecEntry[] = [];
  for (let i = 1; i < chunks.length; i++) {
    const part = chunks[i];
    const rawName = decode((part.match(/^[^>]*>([\s\S]*?)<\/a>/) || [])[1] || "");
    if (!rawName || rawName.length < 3) continue;
    const href = (chunks[i - 1].match(/href="([^"]+)"\s*$/) || [])[1] || null;
    const text = decode(part.slice(0, 6000));
    if (!/Licence Number/i.test(text)) continue; // category tiles, not entities

    // Status notes appear in red next to the licence number, or in the firm name
    const redNotes = [...part.slice(0, 6000).matchAll(/color:#eb0000[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => decode(m[1]));
    const licRaw = (text.match(new RegExp(`Licence Number\\s*:\\s*(.*?)\\s*(?=${LABELS}|$)`, "i")) || [])[1] || "";
    const licNote = (licRaw.match(/\(([^)]+)\)/) || [])[1] || null;
    const nameNote = (rawName.match(/\((revoke[^)]*|withdrawn[^)]*|suspended[^)]*|voluntary[^)]*)\)/i) || [])[1] || null;
    const firstNote = (s?: string | null) => (s ? ((s.match(/\(([^)]+)\)/) || [])[1] || s).trim() : null);
    const note = firstNote(redNotes.find(Boolean)) || licNote || nameNote || null;
    const licNum = licRaw.replace(/\(.*$/, "").trim();

    const reg = text.match(/Company Registration Number\s*:\s*(?:HE|ΗΕ|H\.E\.)?\s*0*([0-9]{2,7})\b/i)?.[1] || null;
    const email = text.match(/E-Mail\s*:\s*([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/i)?.[1]?.toLowerCase() || null;
    const site = text.match(/Website\s*:\s*((?:https?:\/\/)?[\w-]+(?:\.[\w-]+)+\S*)/i)?.[1] || null;
    const webmail = /@(gmail|yahoo|hotmail|outlook|live|icloud|protonmail)\./i;

    out.push({
      entity_name: cleanEntityName(rawName),
      raw_name: rawName,
      license_number: /\d/.test(licNum) ? licNum : null,
      registration_no: reg,
      lei: text.match(/LEI Code\s*:\s*([A-Z0-9]{20})/i)?.[1] || null,
      license_date: toIso(text.match(/Licence Date\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1]),
      termination_date: toIso(text.match(/Date of Termination\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1]),
      status: mapCysecStatus(note, !!list.former),
      status_note: note,
      email,
      website: site || (email && !webmail.test(email) ? email.split("@")[1] : null),
      detail_url: href ? (href.startsWith("http") ? href : CYSEC_BASE + href) : null,
    });
  }
  return out;
}

type LicenceRow = { status: string | null; license_type: string | null; license_number: string | null; priority?: number | null };

/** Choose the licence shown on a company profile: current licences first, then by register priority */
export function pickPrimaryLicence<T extends LicenceRow>(rows: T[]): T | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const ca = isCurrentStatus(a.status) ? 0 : 1, cb = isCurrentStatus(b.status) ? 0 : 1;
    if (ca !== cb) return ca - cb;
    const sa = CURRENT_STATUSES.indexOf(a.status || ""), sb = CURRENT_STATUSES.indexOf(b.status || "");
    if (ca === 0 && sa !== sb) return sa - sb;
    return (a.priority ?? 99) - (b.priority ?? 99);
  })[0];
}

/** Directory flags derived from a company's CySEC licence rows (null = no CySEC record at all) */
export function directoryFlagsFor(rows: LicenceRow[]) {
  const p = pickPrimaryLicence(rows);
  if (!p) return { cysec_licensed: false, cysec_license_type: null, cysec_license_number: null, cysec_status: null };
  return {
    cysec_licensed: isCurrentStatus(p.status),
    cysec_license_type: p.license_type,
    cysec_license_number: p.license_number,
    cysec_status: p.status,
  };
}
