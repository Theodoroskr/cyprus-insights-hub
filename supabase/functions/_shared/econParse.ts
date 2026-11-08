/**
 * Pure helpers for CYSTAT PxWeb economic-indicator tables (inflation, GDP, unemployment).
 * Variables are picked by their English labels, not position, so a reordered table fails loudly instead of loading wrong numbers.
 * Blank / ".." / "..." / "-" cells stay null (not yet published), never zero.
 */

export interface PxVar { code: string; values: string[]; valueTexts: string[] }
export interface PxMeta { variables: PxVar[] }
export interface PxData { columns?: { code: string; type?: string }[]; data: { key: string[]; values: string[] }[] }

export interface EconSpec {
  slug: string;              // open_data_sources row this table belongs to
  path: string;              // PxWeb path under 8.CYSTAT-DB
  timeVar: RegExp;           // MONTH or QUARTER
  fixed: Record<string, RegExp>;           // variable code -> label to keep (exactly one value)
  seriesVar: string;                        // variable whose values split into series
  series: [RegExp, string][];               // label -> series_code
}

export interface EconRow { series_code: string; frequency: "monthly" | "quarterly"; period_date: string; period_label: string; value: number | null }

const BASE = "https://cystatdb.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/";
export const tableUrl = (s: EconSpec) => BASE + s.path.split("/").map(encodeURIComponent).join("/");

export const ECON_SPECS: EconSpec[] = [
  {
    slug: "cystat-inflation-monthly",
    path: "Price Indices/Consumer Price Index/0410070E.px",
    timeVar: /^MONTH$/,
    fixed: { COICOP18: /^General Consumer Price Index$/ },
    seriesVar: "INDICATOR",
    series: [[/^Index-Monthly$/, "cpi_index"], [/^% change - same month of previous year$/, "cpi_yoy"]],
  },
  {
    slug: "cystat-inflation-monthly",
    path: "Price Indices/Harmonised Index of Consumer Prices/0420034E.px",
    timeVar: /^MONTH$/,
    fixed: {},
    seriesVar: "INDICATOR",
    series: [[/^% change - same month of previous year$/, "hicp_yoy"]],
  },
  {
    slug: "cystat-gdp-quarterly",
    path: "National Accounts/Quarterly National Accounts/0620005E.px",
    timeVar: /^QUARTER$/,
    fixed: { "TYPE OF DATA": /^Working day and seasonally adjusted/, "NA AGGREGATE": /^B1GQ / },
    seriesVar: "MEASURE",
    series: [[/same quarter of the previous year/, "gdp_real_yoy"], [/compared to the previous quarter/, "gdp_real_qoq"]],
  },
  {
    slug: "cystat-gdp-quarterly",
    path: "National Accounts/Quarterly National Accounts/0620010E.px",
    timeVar: /^QUARTER$/,
    fixed: { "TYPE OF DATA": /^Not seasonally adjusted/, "NA AGGREGATE": /^B1GQ / },
    seriesVar: "MEASURE",
    series: [[/^Current prices \(Million Euro\)$/, "gdp_current_meur"]],
  },
  {
    slug: "cystat-unemployment-quarterly",
    path: "Labour Market/Labour Force Survey/0110010E.px",
    timeVar: /^QUARTER$/,
    fixed: { MEASURE: /^Percentage$/, SEX: /^Total$/ },
    seriesVar: "INDICATOR",
    series: [[/^Unemployment - 15\+$/, "unemployment_rate"], [/^Unemployment - 15-24$/, "youth_unemployment_rate"]],
  },
];

export function parsePeriod(raw: string): { frequency: "monthly" | "quarterly"; period_date: string; period_label: string } | null {
  let m = raw.match(/^(\d{4})M(\d{2})$/);
  if (m) {
    const mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    return { frequency: "monthly", period_date: `${m[1]}-${m[2]}-01`, period_label: raw };
  }
  m = raw.match(/^(\d{4})Q([1-4])$/);
  if (m) {
    const mo = (Number(m[2]) - 1) * 3 + 1;
    return { frequency: "quarterly", period_date: `${m[1]}-${String(mo).padStart(2, "0")}-01`, period_label: raw };
  }
  return null;
}

export function parseEconValue(raw: string | undefined): number | null {
  const s = (raw ?? "").trim().replace(/\s/g, "");
  if (s === "" || s === ".." || s === "..." || s === "-" || s === ":" || /^n\.?a\.?$/i.test(s)) return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

/** Build the PxWeb POST query for a spec from the table metadata. Throws if a required label is missing. */
export function buildQuery(spec: EconSpec, meta: PxMeta) {
  const pick = (code: string, re: RegExp, many: boolean) => {
    const v = meta.variables.find((x) => x.code === code);
    if (!v) throw new Error(`${spec.path}: variable ${code} missing`);
    const vals = v.values.filter((_, i) => re.test(v.valueTexts[i]));
    if (vals.length === 0 || (!many && vals.length !== 1)) throw new Error(`${spec.path}: expected ${many ? "a" : "one"} "${re.source}" in ${code}, found ${vals.length}`);
    return vals;
  };
  const time = meta.variables.find((v) => spec.timeVar.test(v.code));
  if (!time) throw new Error(`${spec.path}: time variable missing`);
  const query = [{ code: time.code, selection: { filter: "all", values: ["*"] } }];
  for (const [code, re] of Object.entries(spec.fixed)) query.push({ code, selection: { filter: "item", values: pick(code, re, false) } });
  const seriesVals = spec.series.flatMap(([re]) => pick(spec.seriesVar, re, false));
  query.push({ code: spec.seriesVar, selection: { filter: "item", values: seriesVals } });
  for (const v of meta.variables) {
    if (!query.some((q) => q.code === v.code)) {
      if (v.values.length !== 1) throw new Error(`${spec.path}: unexpected extra variable ${v.code}`);
      query.push({ code: v.code, selection: { filter: "item", values: v.values } });
    }
  }
  return { query, response: { format: "json" } };
}

export function parseEconPx(spec: EconSpec, meta: PxMeta, data: PxData) {
  const time = meta.variables.find((v) => spec.timeVar.test(v.code))!;
  const sVar = meta.variables.find((v) => v.code === spec.seriesVar)!;
  const cols = (data.columns ?? []).filter((c) => c.type !== "c").map((c) => c.code);
  const tPos = cols.indexOf(time.code), sPos = cols.indexOf(sVar.code);
  if (tPos < 0 || sPos < 0) throw new Error(`${spec.path}: response columns missing`);
  const tText = new Map(time.values.map((v, i) => [v, time.valueTexts[i]]));
  const sText = new Map(sVar.values.map((v, i) => [v, sVar.valueTexts[i]]));
  const rows: EconRow[] = [];
  const rejected: string[] = [];
  for (const cell of data.data) {
    const p = parsePeriod(tText.get(cell.key[tPos]) ?? "");
    const label = sText.get(cell.key[sPos]) ?? "";
    const code = spec.series.find(([re]) => re.test(label))?.[1];
    if (!p || !code) { rejected.push(`Unknown key ${cell.key.join("/")}`); continue; }
    const v = parseEconValue(cell.values[0]);
    if (Number.isNaN(v)) { rejected.push(`Bad value "${cell.values[0]}" ${code} ${p.period_label}`); continue; }
    rows.push({ series_code: code, ...p, value: v });
  }
  return { rows, rejected };
}

/** Values from CYSTAT are rounded to one or two decimals; treat tiny float noise as unchanged. */
export const sameValue = (a: number | null, b: number | null) => (a == null || b == null ? a === b : Math.abs(a - b) < 1e-9);
