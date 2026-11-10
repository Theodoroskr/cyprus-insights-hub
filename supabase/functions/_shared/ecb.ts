// Pure helpers for the ECB Data Portal SDMX API (Central Bank of Cyprus statistics). No Deno imports so Vitest can run them.
import { periodToDate, type StatRow } from "./eurostat.ts";

export const ECB_API = "https://data-api.ecb.europa.eu/service/data/";
/** Our geo codes → ECB REF_AREA codes. */
const TO_ECB: Record<string, string> = { CY: "CY", EA: "U2" };
const FROM_ECB: Record<string, string> = { CY: "CY", U2: "EA" };

export type EcbSpec = { dataset_code: string; filters: { series?: string }; geos: string[]; since_period: string };

export function ecbUrl(spec: EcbSpec): string {
  const tpl = spec.filters?.series ?? "";
  if (!/^[A-Z0-9.]*\{geo\}[A-Z0-9.]*$/.test(tpl) || !/^[A-Z]{2,10}$/.test(spec.dataset_code)) throw new Error("Invalid ECB series template");
  const areas = spec.geos.map((g) => { const a = TO_ECB[g]; if (!a) throw new Error(`Unsupported geography ${g}`); return a; });
  const key = tpl.replace("{geo}", areas.join("+"));
  return `${ECB_API}${spec.dataset_code}/${key}?format=csvdata&detail=dataonly&startPeriod=${encodeURIComponent(spec.since_period)}`;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out;
}

/** Parse SDMX CSV into one row per geo/period. Blank values are skipped (never zero); duplicates and unknown areas are rejected. */
export function parseEcbCsv(csv: string, expectedGeos: string[]): { rows: StatRow[]; rejected: string[] } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) throw new Error("ECB returned an empty file");
  const head = splitCsvLine(lines[0]);
  const iArea = head.indexOf("REF_AREA"), iTime = head.indexOf("TIME_PERIOD"), iVal = head.indexOf("OBS_VALUE");
  if (iArea < 0 || iTime < 0 || iVal < 0) throw new Error("ECB file is missing REF_AREA, TIME_PERIOD or OBS_VALUE");
  const rows: StatRow[] = []; const rejected: string[] = []; const seen = new Set<string>();
  for (const line of lines.slice(1)) {
    const c = splitCsvLine(line);
    const geo = FROM_ECB[c[iArea]];
    const period = c[iTime]; const raw = (c[iVal] ?? "").trim();
    if (!geo || !expectedGeos.includes(geo)) { rejected.push(`${c[iArea]} ${period}: unexpected area`); continue; }
    if (raw === "" || raw === "NaN") continue;
    const date = periodToDate(period);
    if (!date) { rejected.push(`${geo} ${period}: unrecognised period`); continue; }
    const v = Number(raw);
    if (!Number.isFinite(v)) { rejected.push(`${geo} ${period}: non-numeric value`); continue; }
    const k = `${geo}|${period}`;
    if (seen.has(k)) { rejected.push(`${geo} ${period}: duplicate observation`); continue; }
    seen.add(k);
    rows.push({ geo, period, period_date: date, value: v, status_flag: null });
  }
  return { rows, rejected };
}

/** Hour of day in Cyprus (Europe/Nicosia, with summer time). */
export function nicosiaHour(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Nicosia", hour: "2-digit", hourCycle: "h23" }).format(d));
}
