/**
 * Pure parser for CYSTAT PxWeb table 2021010E "Arrivals of Tourists by Country of Usual Residence, Monthly".
 * Blank / ".." / "-" cells stay null (not yet published), never zero.
 */

export interface TourismRow {
  period_date: string; year: number; month: number;
  country_code: string; country_label: string;
  kind: "total" | "region" | "country"; region: string | null;
  arrivals: number | null;
}

const REGIONS = new Set(["EUROPE", "E.U. COUNTRIES", "AFRICA", "AMERICA", "ASIA", "OCEANIA"]);

export function cleanLabel(raw: string): string {
  return raw.replace(/\s*\([^)]*\)/g, "").trim();
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Build stable codes per country position; duplicate names (e.g. Georgia in Europe and Asia) get a region suffix. */
export function countryCodes(labels: string[]) {
  const seen = new Set<string>();
  let region: string | null = null;
  return labels.map((raw) => {
    const label = cleanLabel(raw);
    const upper = label.toUpperCase();
    let kind: TourismRow["kind"] = "country";
    if (upper === "TOTAL") kind = "total";
    else if (REGIONS.has(upper)) kind = "region";
    if (kind === "region" && upper !== "E.U. COUNTRIES") region = label;
    if (upper === "NOT STATED") region = null;
    let code = kind === "total" ? "total" : slug(label === "E.U. COUNTRIES" ? "eu" : label);
    if (seen.has(code)) code = `${code}-${slug(region ?? "other")}`;
    seen.add(code);
    const pretty = kind === "region" ? (upper === "E.U. COUNTRIES" ? "EU countries" : label[0] + label.slice(1).toLowerCase()) : kind === "total" ? "Total" : label;
    return { code, label: pretty, kind, region: kind === "country" ? region : null };
  });
}

export function parsePxMonth(raw: string) {
  const m = raw.match(/^(\d{4})M(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]), month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month, period_date: `${year}-${m[2]}-01` };
}

export function parseArrivalValue(raw: string | undefined): number | null | typeof NaN {
  const s = (raw ?? "").trim().replace(/\s/g, "");
  if (s === "" || s === ".." || s === "-" || s === "...") return null;
  if (!/^\d+$/.test(s)) return NaN;
  return Number(s);
}

/** meta = GET response (variables), data = POST json response. */
export function parseTourismPx(
  meta: { variables: { code: string; values: string[]; valueTexts: string[] }[] },
  data: { data: { key: string[]; values: string[] }[] },
) {
  const cVar = meta.variables.find((v) => /COUNTRY/i.test(v.code));
  const mVar = meta.variables.find((v) => /MONTH/i.test(v.code));
  if (!cVar || !mVar) throw new Error("Unexpected table layout: country or month variable missing");
  const codes = countryCodes(cVar.valueTexts);
  const cIdx = new Map(cVar.values.map((v, i) => [v, i]));
  const mIdx = new Map(mVar.values.map((v, i) => [v, i]));
  const rows: TourismRow[] = [];
  const rejected: string[] = [];
  for (const cell of data.data) {
    const ci = cIdx.get(cell.key[0]);
    const mi = mIdx.get(cell.key[1]);
    if (ci == null || mi == null) { rejected.push(`Unknown key ${cell.key.join("/")}`); continue; }
    const p = parsePxMonth(mVar.valueTexts[mi]);
    if (!p) { rejected.push(`Bad month ${mVar.valueTexts[mi]}`); continue; }
    const v = parseArrivalValue(cell.values[0]);
    if (Number.isNaN(v)) { rejected.push(`Bad value "${cell.values[0]}" ${codes[ci].code} ${p.period_date}`); continue; }
    const c = codes[ci];
    rows.push({ ...p, country_code: c.code, country_label: c.label, kind: c.kind, region: c.region, arrivals: v as number | null });
  }
  return { rows, rejected };
}

/** Pull file and upstream links from a data.gov.cy dataset or resource page. */
export function discoverPortalLinks(html: string, base = "https://data.gov.cy") {
  const out = new Map<string, { url: string; format: string }>();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    let format: string | null = null;
    if (/\/sites\/default\/files\/.+\.(csv|xlsx?|json|xml|pdf)$/i.test(href)) format = href.split(".").pop()!.toUpperCase();
    else if (/cystat.*\.px/i.test(href)) format = "PxWeb";
    else if (/\/resource\/\d+$/.test(href)) format = "resource page";
    if (!format) continue;
    const url = href.startsWith("http") ? href : base + href;
    out.set(url, { url, format });
  }
  return [...out.values()];
}
