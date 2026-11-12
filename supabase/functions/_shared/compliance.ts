// Pure parsing + classification rules for ComplianceHub official sources (no network, no AI).
// Shared by the ingest-compliance function and the unit tests.

export type Topic = "aml_cft" | "sanctions" | "mica" | "dora" | "licensing" | "regulatory_reporting" | "payments" | "prudential" | "markets" | "governance" | "consumer_protection" | "other";
export type DocType = "consultation" | "draft_standard" | "adopted_legislation" | "circular" | "guidance" | "announcement" | "decision" | "report" | "notice" | "corrigendum";
export type MeasureType = "new_regime" | "listings" | "delistings" | "amendment" | "extension" | "sectoral" | "implementing" | "exemption" | "corrigendum" | "guidance" | "other";

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};
const pad = (n: number) => String(n).padStart(2, "0");

/** "27 Oct. 2026", "11 November 2026", "Thu, 12 Nov 2026 00:00:00 +0100", "2026-10-07T12:00:00Z" → "YYYY-MM-DD" (null when unparseable). */
export function parseDateLoose(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/);
  if (dmy) {
    const m = MONTHS[dmy[2].toLowerCase()];
    if (m) return `${dmy[3]}-${pad(m)}-${pad(Number(dmy[1]))}`;
  }
  const num = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (num) return `${num[3]}-${pad(Number(num[2]))}-${pad(Number(num[1]))}`;
  return null;
}

export const decodeEntities = (s: string) => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;|&rsquo;/g, "’").replace(/&#8216;|&lsquo;/g, "‘")
  .replace(/&#8211;|&ndash;/g, "–").replace(/&#8212;|&mdash;/g, "—").replace(/&#8230;|&hellip;/g, "…").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

export function stripHtml(html: string): string {
  return decodeEntities(html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

export const clean = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
export const isGreek = (s: string) => (s.match(/[\u0370-\u03ff]/g)?.length ?? 0) > Math.max(4, s.length * 0.2);

// ---------------- topics / document types ----------------
const TOPIC_RULES: [Topic, RegExp][] = [
  ["aml_cft", /money laundering|terrorist financing|\bAML\b|\bCFT\b|AML\/CFT|AMLR|AMLD|AMLA|beneficial own|suspicious transaction|\bSTRs?\b|due diligence|FIU|MOKAS|ξέπλυμα|τρομοκρατ/i],
  ["sanctions", /sanction|restrictive measure|asset freeze|NSIU|κυρώσ|περιοριστικ/i],
  ["mica", /\bMiCA|MiCAR|crypto-?asset|stablecoin|\bCASPs?\b|asset-referenced token|e-money token|κρυπτο/i],
  ["dora", /\bDORA\b|operational resilience|ICT[- ]related|ICT risk|cyber[- ]?attack|ICT third-party/i],
  ["licensing", /licen[cs]|authori[sz]ation|registration of|register of|άδει|αδειοδότ/i],
  ["regulatory_reporting", /reporting|report submission|submission of (information|data)|questionnaire|returns?\b|υποβολ/i],
  ["payments", /payment (services|institution)|electronic money|\bEMIs?\b|\bPSD\b|instant payments|πληρωμ/i],
  ["prudential", /capital requirement|risk buffer|macroprudential|liquidity|\bCRR\b|\bCRD\b|prudential|\bIFR\b|\bIFD\b|κεφαλαι/i],
  ["markets", /MiFID|MiFIR|market abuse|\bMAR\b|\bEMIR\b|\bSFTR\b|prospectus|UCITS|\bAIFs?\b|securitisation|benchmark|crowdfunding/i],
];

export function topicsFromText(text: string): Topic[] {
  const out = new Set<Topic>();
  for (const [t, re] of TOPIC_RULES) if (re.test(text)) out.add(t);
  return [...out];
}

export function docTypeFromTitle(title: string, fallback: DocType = "announcement"): DocType {
  if (/^corrigendum|corrigendum to/i.test(title)) return "corrigendum";
  if (/consultation|public hearing|call for (evidence|feedback)|request for feedback|διαβούλευσ/i.test(title)) return "consultation";
  if (/draft (RTS|ITS|regulatory technical|implementing technical|guidelines)|final report/i.test(title)) return "draft_standard";
  if (/guideline|guidance|\bFAQs?\b|questions and answers|Q&A|οδηγί?ες εφαρμογ/i.test(title)) return "guidance";
  if (/\bdecision\b|απόφαση/i.test(title)) return "decision";
  if (/\bdirective\b|οδηγία/i.test(title)) return "adopted_legislation";
  if (/\breport\b|έκθεση/i.test(title)) return "report";
  return fallback;
}

// ---------------- CySEC circulars ----------------
export interface CysecCircular { date: string | null; url: string; circularNo: string | null; title: string }

export function parseCysecListing(html: string, base = "https://www.cysec.gov.cy"): CysecCircular[] {
  const out: CysecCircular[] = [];
  const re = /<div class="text-muted">([^<]+)<\/div>[\s\S]*?<a href="(\/CMSPages\/GetFile\.aspx\?guid=[^"]+)" class="card-title[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = clean(m[3]);
    const no = raw.match(/^(C\d{3,4})\b\s*[-–—:]?\s*(.*)$/);
    out.push({ date: parseDateLoose(m[1]), url: new URL(m[2], base).toString(), circularNo: no ? no[1] : null, title: (no ? no[2] : raw).replace(/^regarding\s+/i, "").trim() || raw });
  }
  return out;
}

/** CySEC circular category (URL segment) → deterministic sector/topic tags. */
export const CYSEC_CATEGORIES: Record<string, { sectors: string[]; topics: Topic[] }> = {
  "aml-cft": { sectors: ["cysec_supervised"], topics: ["aml_cft"] },
  "circulars-dora": { sectors: ["cysec_supervised"], topics: ["dora"] },
  "casp-circulars": { sectors: ["crypto_asset_providers"], topics: ["mica"] },
  "issuers-of-art-under-micar-circulars": { sectors: ["crypto_asset_providers"], topics: ["mica"] },
  "investment-firms": { sectors: ["investment_firms"], topics: [] },
  "aif": { sectors: ["fund_managers"], topics: ["markets"] },
  "ucits": { sectors: ["fund_managers"], topics: ["markets"] },
  "service-providers": { sectors: ["administrative_service_providers"], topics: [] },
  "general": { sectors: ["cysec_supervised"], topics: [] },
};
export function cysecCategory(url: string): string {
  const seg = url.toLowerCase().replace(/\/+$/, "").split("/").pop() ?? "";
  return seg;
}

// ---------------- Central Bank of Cyprus ----------------
export interface CbcAnnouncement { date: string | null; url: string; title: string; slug: string }

export function parseCbcListing(html: string, base = "https://www.centralbank.cy"): CbcAnnouncement[] {
  const out: CbcAnnouncement[] = [];
  const re = /<span class="date">([^<]+)<\/span>\s*<h5>([\s\S]*?)<\/h5>\s*<a href="([^"]+)"(?: title="([^"]*)")?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const url = new URL(m[3], base).toString();
    out.push({ date: parseDateLoose(m[1]), url, title: clean(m[4] || m[2]), slug: url.replace(/\/+$/, "").split("/").pop() ?? url });
  }
  return out;
}

const CBC_KEEP = /directive|circular|decision|supervis|money laundering|\bAML\b|sanction|restrictive|licen[cs]|authoris|consultation|macroprudential|buffer|guideline|payment institution|electronic money|crypto|\bDORA\b|\bMiCA|warning|resolution|deposit guarantee|regulat|οδηγ|εγκύκλι|απόφαση|εποπτ|ξέπλυμα|κυρώσ|άδει|διαβούλευσ|κανονισμ|προειδοποίηση/i;
const CBC_SKIP = /tender|procurement|counterfeit|banknote|is meeting|statistic|speech|remarks|interview|graduate|vacanc|\bcoins?\b|participated|Governing Council meeting|monetary policy|reference interest rate|press conference|conference|workshop|seminar|στοιχεία|ομιλία|συμμετ|εργαστήρι|κερμ|συνέντευξη|στατιστικ|προκήρυξη|διαγωνισμ|συναντήσ|ημερίδα|εκδήλωση|θέσεις/i;
export const isCbcRegulatory = (title: string) => CBC_KEEP.test(title) && !CBC_SKIP.test(title);

// ---------------- RSS ----------------
export interface RssItem { title: string; link: string; guid: string; pubDate: string | null; description: string; category: string }

export function parseRss(xml: string): RssItem[] {
  const tag = (block: string, name: string) => {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
    return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : "";
  };
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const b = m[1];
    return {
      title: clean(tag(b, "title")), link: decodeEntities(tag(b, "link")).trim(), guid: decodeEntities(tag(b, "guid")).trim(),
      pubDate: tag(b, "pubDate") || null, description: clean(tag(b, "description")), category: clean(tag(b, "category")),
    };
  });
}

/** RFC-822 pubDate → calendar date in the publisher's own offset (EUR-Lex stamps midnight CET). */
export function rssDate(pub?: string | null): string | null {
  if (!pub) return null;
  const m = pub.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (m && MONTHS[m[2].toLowerCase()]) return `${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(Number(m[1]))}`;
  return parseDateLoose(pub);
}

// ---------------- Countries ----------------
const COUNTRIES: [string, string, string[]][] = [
  ["Afghanistan", "AF", []], ["Albania", "AL", []], ["Algeria", "DZ", []], ["Angola", "AO", []], ["Armenia", "AM", []], ["Azerbaijan", "AZ", []],
  ["Bahamas", "BS", []], ["Barbados", "BB", []], ["Belarus", "BY", []], ["Benin", "BJ", []], ["Bolivia", "BO", []], ["Bosnia and Herzegovina", "BA", []],
  ["Botswana", "BW", []], ["Bulgaria", "BG", []], ["Burkina Faso", "BF", []], ["Burundi", "BI", []], ["Cambodia", "KH", []], ["Cameroon", "CM", []],
  ["Cayman Islands", "KY", []], ["Central African Republic", "CF", []], ["Chad", "TD", []], ["China", "CN", []], ["Croatia", "HR", []], ["Cuba", "CU", []],
  ["Côte d’Ivoire", "CI", ["cote d'ivoire", "côte d'ivoire", "cote d’ivoire", "ivory coast"]],
  ["Democratic Republic of the Congo", "CD", ["drc", "dr congo"]],
  ["Democratic People's Republic of Korea (DPRK)", "KP", ["democratic people's republic of korea", "democratic people’s republic of korea", "democratic people’s republic of korea (dprk)", "dprk", "north korea"]],
  ["Egypt", "EG", []], ["Eritrea", "ER", []], ["Ethiopia", "ET", []], ["Georgia", "GE", []], ["Ghana", "GH", []], ["Gibraltar", "GI", []],
  ["Guatemala", "GT", []], ["Guinea", "GN", []], ["Guinea-Bissau", "GW", []], ["Guyana", "GY", []], ["Haiti", "HT", []], ["Iceland", "IS", []],
  ["Iran", "IR", []], ["Iraq", "IQ", []], ["Jamaica", "JM", []], ["Jordan", "JO", []], ["Kenya", "KE", []], ["Kosovo", "XK", []], ["Kuwait", "KW", []],
  ["Lao PDR", "LA", ["laos", "lao people's democratic republic"]], ["Lebanon", "LB", []], ["Libya", "LY", []], ["Mali", "ML", []], ["Malta", "MT", []],
  ["Mauritius", "MU", []], ["Moldova", "MD", []], ["Monaco", "MC", []], ["Mongolia", "MN", []], ["Montenegro", "ME", []], ["Morocco", "MA", []],
  ["Mozambique", "MZ", []], ["Myanmar", "MM", ["burma"]], ["Namibia", "NA", []], ["Nepal", "NP", []], ["Nicaragua", "NI", []], ["Niger", "NE", []],
  ["Nigeria", "NG", []], ["North Macedonia", "MK", []], ["Pakistan", "PK", []], ["Panama", "PA", []], ["Papua New Guinea", "PG", []],
  ["Philippines", "PH", []], ["Russia", "RU", ["russian federation"]], ["Senegal", "SN", []], ["Serbia", "RS", []], ["Somalia", "SO", []],
  ["South Africa", "ZA", []], ["South Sudan", "SS", []], ["Sri Lanka", "LK", []], ["Sudan", "SD", []], ["Syria", "SY", ["syrian arab republic"]],
  ["Tanzania", "TZ", []], ["Trinidad and Tobago", "TT", []], ["Tunisia", "TN", []], ["Türkiye", "TR", ["turkey"]], ["Uganda", "UG", []],
  ["Ukraine", "UA", []], ["United Arab Emirates", "AE", ["uae"]], ["Vanuatu", "VU", []], ["Venezuela", "VE", []],
  ["Vietnam", "VN", ["viet nam"]], ["Virgin Islands (UK)", "VG", ["british virgin islands", "virgin islands (uk)"]], ["Yemen", "YE", []],
  ["Zimbabwe", "ZW", []],
];
const norm = (s: string) => s.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
const COUNTRY_INDEX = new Map<string, { name: string; code: string }>();
for (const [name, code, aliases] of COUNTRIES) for (const a of [name, ...aliases]) COUNTRY_INDEX.set(norm(a), { name, code });

export function canonicalCountry(raw: string): { name: string; code: string } | null {
  return COUNTRY_INDEX.get(norm(raw.replace(/[_*#]/g, ""))) ?? null;
}

/** Countries/territories named in a sanctions act title (word-boundary match, longest names first). */
export function countriesInText(text: string): string[] {
  const found = new Set<string>();
  const names = [...COUNTRY_INDEX.keys()].filter((k) => k.length > 3).sort((a, b) => b.length - a.length);
  let t = norm(text);
  for (const k of names) {
    const re = new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`);
    if (re.test(t)) { found.add(COUNTRY_INDEX.get(k)!.name); t = t.replace(re, "$1 $2"); }
  }
  return [...found];
}

// ---------------- EUR-Lex ----------------
export interface EurLexAct {
  celex: string; title: string; legalActRef: string; english: boolean; corrigendum: boolean;
  sanctions: boolean; financial: boolean; topics: Topic[]; regime: string | null; measureType: MeasureType | null; countries: string[]; documentType: DocType;
}

const FINANCIAL_ACT = /money laundering|terrorist financing|crypto-asset|2023\/1114|operational resilience|2022\/2554|2024\/1624|2024\/1620|2024\/1640|payment services|electronic money|credit institutions|investment firms|financial instruments|prudential requirements|market abuse|central securities depositor|alternative investment fund|UCITS|collective investment|benchmark|crowdfunding|beneficial own|Authority for Anti-Money|financial conglomerate|insurance and reinsurance|deposit guarantee|bank recovery|securitisation|transfers of funds|instant credit transfers|financial sanctions/i;

export function classifyEurLex(rawTitle: string): EurLexAct | null {
  const m = rawTitle.match(/^CELEX:\s*([0-9A-Z()]+)\s*:\s*([\s\S]+)$/);
  if (!m) return null;
  const celex = m[1];
  const title = m[2].replace(/\s+/g, " ").trim();
  const english = /\b(Regulation|Decision|Directive|Corrigendum|Recommendation|Notice|Opinion)\b/.test(title) && /\b(of|the|and|on)\b/.test(title) && !/\b(der|des|zur|und|vom|du|de la|della|del)\b/.test(title);
  const corrigendum = /^corrigendum/i.test(title) || /R\(\d+\)$/.test(celex);
  const sanctions = /restrictive measures/i.test(title);
  const financial = FINANCIAL_ACT.test(title);
  const legalActRef = title.replace(/^Corrigendum to\s+/i, "").split(/\s+of\s+\d{1,2}\s+[A-Z][a-z]+\s+\d{4}/)[0].trim().slice(0, 160);
  let regime: string | null = null;
  const r = title.match(/restrictive measures\s+((?:in respect of|in view of|against|directed against|concerning|to combat|in relation to)\s+[\s\S]+?)(?:,\s*(?:and\s+)?(?:repealing|amending)|\s+and\s+(?:repealing|amending)|\(notified|$)/i);
  if (r) regime = r[1].replace(/^(in respect of|in view of|concerning|in relation to)\s+/i, "").replace(/\s+/g, " ").trim().slice(0, 180);
  let measureType: MeasureType | null = null;
  if (sanctions) {
    if (corrigendum) measureType = "corrigendum";
    else if (/\b(prolong|extend|renew)/i.test(title)) measureType = "extension";
    else if (/\bamending\b/i.test(title)) measureType = "amendment";
    else if (/\bimplementing\b/i.test(title)) measureType = "implementing";
    else if (/derogat|exempt/i.test(title)) measureType = "exemption";
    else measureType = "new_regime";
  }
  const topics = topicsFromText(title);
  if (sanctions && !topics.includes("sanctions")) topics.push("sanctions");
  return {
    celex, title, legalActRef, english, corrigendum, sanctions, financial, topics, regime, measureType,
    countries: sanctions ? countriesInText(regime ?? title) : [],
    documentType: corrigendum ? "corrigendum" : "adopted_legislation",
  };
}

/** EUR-Lex quick-search results page (official) → acts with CELEX number and Official Journal date. */
export function parseEurLexSearch(html: string): { celex: string; title: string; ojDate: string | null }[] {
  const out: { celex: string; title: string; ojDate: string | null }[] = [];
  const parts = html.split(/<div[^>]*class="SearchResult"[^>]*>/).slice(1);
  for (const b of parts) {
    const a = b.match(/<a[^>]*href="[^"]*uri=CELEX:([0-9A-Z()]+)[^"]*"[^>]*class="title"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const oj = b.match(/OJ [LC](?: [A-Z])?,\s*[^,<]+,\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
    out.push({ celex: a[1], title: clean(a[2]), ojDate: parseDateLoose(oj?.[1]) });
  }
  return out;
}

// ---------------- AMLA ----------------
const AMLA_SKIP = /interview|\b(meets|attends|takes part|participates|speaks|delivers|highlights|addresses)\b|\bat (the )?[A-Z][\w&' ]+(Summit|Forum|Conference|Congress)|Foro |panel/i;
export const isAmlaNewsRelevant = (title: string) => !AMLA_SKIP.test(title);

export interface AmlaConsultation { url: string; title: string; status: string | null; openingDate: string | null; deadlineDate: string | null; deadlineText: string | null }

export function parseAmlaConsultations(html: string, base = "https://www.amla.europa.eu"): AmlaConsultation[] {
  const out: AmlaConsultation[] = [];
  for (const m of html.matchAll(/<article[^>]*ecl-content-item[^>]*>[\s\S]*?<\/article>/g)) {
    const b = m[0];
    const a = b.match(/<a\s+href="([^"]*public-consultations\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const status = b.match(/Status:\s*([A-Za-z ]+)/)?.[1]?.trim() ?? null;
    const opening = b.match(/Opening date\s*<\/dt>\s*<dd[^>]*>[\s\S]*?<time[^>]*>([^<]+)<\/time>/);
    const deadline = b.match(/Deadline\s*<\/dt>\s*<dd[^>]*>[\s\S]*?<time[^>]*>([^<]+)<\/time>/);
    out.push({
      url: new URL(a[1], base).toString(), title: clean(a[2]), status,
      openingDate: parseDateLoose(opening?.[1]), deadlineDate: parseDateLoose(deadline?.[1]), deadlineText: deadline ? clean(deadline[1]) : null,
    });
  }
  return out;
}

// ---------------- NSIU ----------------
const NSIU_SKIP = /participation of the NSIU|recovery and resilience/i;
export const isNsiuRelevant = (title: string) => !NSIU_SKIP.test(title);

// ---------------- FATF ----------------
export interface FatfReleaseLink { date: string; label: string; callForActionUrl: string | null; increasedMonitoringUrl: string | null }

export function parseFatfIndex(md: string): FatfReleaseLink[] {
  const map = new Map<string, FatfReleaseLink>();
  for (const m of md.matchAll(/\[(High-Risk Jurisdictions subject to a Call for Action|Jurisdictions under Increased Monitoring)\s*[-–—]\s*([^\]]+)\]\((https?:[^)\s]+)\)/gi)) {
    const date = parseDateLoose(m[2]);
    if (!date) continue;
    const r = map.get(date) ?? { date, label: m[2].trim(), callForActionUrl: null, increasedMonitoringUrl: null };
    const url = m[3].replace("/content/fatf-gafi/en/", "/en/");
    if (/call for action/i.test(m[1])) r.callForActionUrl = url; else r.increasedMonitoringUrl = url;
    map.set(date, r);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Lines that may carry a jurisdiction name: headings or stand-alone bold lines (any length is kept so section headings are seen). */
function nameLines(md: string): { heading: boolean; text: string }[] {
  return md.split("\n").map((line) => {
    const heading = /^#{1,6}\s/.test(line) || /^\s*_?\*\*_?[^*]+_?\*\*_?\s*$/.test(line);
    const text = line.replace(/^#{1,6}\s*/, "").replace(/[_*]/g, "").trim();
    return { heading, text };
  }).filter((l) => l.heading && l.text.length > 1);
}

export interface FatfParsed { listed: { name: string; code: string }[]; unrecognised: string[] }

export function parseFatfCallForAction(md: string): { countermeasures: FatfParsed; edd: FatfParsed } {
  const res = { countermeasures: { listed: [], unrecognised: [] } as FatfParsed, edd: { listed: [], unrecognised: [] } as FatfParsed };
  let section: "countermeasures" | "edd" | null = null;
  for (const l of nameLines(md)) {
    if (/apply countermeasures/i.test(l.text)) { section = "countermeasures"; continue; }
    if (/enhanced due diligence/i.test(l.text) && l.text.length > 40) { section = "edd"; continue; }
    if (/related materials/i.test(l.text)) break;
    if (!section || l.text.length > 70) continue;
    const c = canonicalCountry(l.text);
    if (c) { if (!res[section].listed.some((x) => x.code === c.code)) res[section].listed.push(c); }
    else if (l.text.split(" ").length <= 6) res[section].unrecognised.push(l.text);
  }
  return res;
}

export function parseFatfIncreasedMonitoring(md: string): { listed: FatfParsed; removed: FatfParsed } {
  const res = { listed: { listed: [], unrecognised: [] } as FatfParsed, removed: { listed: [], unrecognised: [] } as FatfParsed };
  let section: "listed" | "removed" = "listed";
  for (const l of nameLines(md)) {
    if (/no longer subject/i.test(l.text)) { section = "removed"; continue; }
    if (/related materials/i.test(l.text)) break;
    if (l.text.length > 70) continue;
    const c = canonicalCountry(l.text);
    if (c) { if (!res[section].listed.some((x) => x.code === c.code)) res[section].listed.push(c); }
    else if (section === "removed" && l.text.split(" ").length <= 6) res[section].unrecognised.push(l.text);
  }
  return res;
}

// ---------------- hashing ----------------
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
