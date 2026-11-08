/**
 * Pure parsers for the Department of Lands and Surveys open-data CSVs
 * (data.gov.cy datasets 1007 sale contracts, 1005 transfers). No network, no Deno APIs.
 * Blank cells stay null — they mean "not yet published", never zero.
 */

export const DISTRICT_ALIASES: Record<string, string> = {
  NICOSIA: "NICOSIA", LEFKOSIA: "NICOSIA", "ΛΕΥΚΩΣΙΑ": "NICOSIA",
  LIMASSOL: "LIMASSOL", LEMESOS: "LIMASSOL", "ΛΕΜΕΣΟΣ": "LIMASSOL",
  LARNACA: "LARNACA", LARNAKA: "LARNACA", "ΛΑΡΝΑΚΑ": "LARNACA",
  PAPHOS: "PAPHOS", PAFOS: "PAPHOS", "ΠΑΦΟΣ": "PAPHOS",
  FAMAGUSTA: "FAMAGUSTA", AMMOCHOSTOS: "FAMAGUSTA", "ΑΜΜΟΧΩΣΤΟΣ": "FAMAGUSTA",
};

export function normalizeDistrict(raw: string): string | null {
  const key = raw
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-ZΑ-Ω]/g, "");
  return DISTRICT_ALIASES[key] ?? null;
}

export function parsePeriod(raw: string): { year: number; month: number; period_date: string } | null {
  const m = raw.trim().match(/^(\d{1,2})[\/.\-](\d{4})$/) ?? null;
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return { year, month, period_date: `${year}-${String(month).padStart(2, "0")}-01` };
}

/** Returns null for blank, NaN marker for malformed. */
function num(raw: string | undefined): number | null | typeof NaN {
  const s = (raw ?? "").trim().replace(/\s/g, "");
  if (s === "" || s === "-") return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

export function decodeCsv(bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-1253").decode(bytes);
  }
  return text.replace(/^\uFEFF/, "");
}

function splitRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const delim = (lines[0] ?? "").split(";").length > (lines[0] ?? "").split(",").length ? ";" : ",";
  return lines.map((l) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, "")));
}

export interface ContractRow { year: number; month: number; period_date: string; district_code: string; contract_count: number | null }
export interface TransferRow {
  year: number; month: number; period_date: string; district_code: string;
  transfer_cases: number | null; parcel_count: number | null;
  declared_value_eur: number | null; accepted_value_eur: number | null;
}
export interface ParseResult<T> { rows: T[]; total: number; rejected: { line: number; reason: string }[] }

export function detectDataset(text: string): "sale_contracts" | "transfers" | null {
  const header = (text.split(/\r?\n/)[0] ?? "").toUpperCase();
  if (header.includes("DISTRICT") && (header.includes("CASES") || header.includes("TEMAXIA"))) return "transfers";
  if (header.includes("MONTH") && header.includes("NICOSIA")) return "sale_contracts";
  return null;
}

/** Wide format: MONTH,NICOSIA,FAMAGUSTA,LARNACA,LIMASSOL,PAFOS */
export function parseSaleContracts(text: string): ParseResult<ContractRow> {
  const [header, ...body] = splitRows(text);
  const rows: ContractRow[] = [];
  const rejected: ParseResult<ContractRow>["rejected"] = [];
  if (!header) return { rows, total: 0, rejected: [{ line: 1, reason: "Empty file" }] };
  const cols = header.slice(1).map((h) => normalizeDistrict(h));
  if (cols.some((c) => c === null)) rejected.push({ line: 1, reason: `Unknown district column in: ${header.join(",")}` });
  body.forEach((cells, i) => {
    const p = parsePeriod(cells[0] ?? "");
    if (!p) { rejected.push({ line: i + 2, reason: `Bad month "${cells[0]}"` }); return; }
    cols.forEach((code, j) => {
      if (!code) return;
      const v = num(cells[j + 1]);
      if (Number.isNaN(v)) { rejected.push({ line: i + 2, reason: `Bad number "${cells[j + 1]}" for ${code}` }); return; }
      if (v !== null && (v < 0 || !Number.isInteger(v))) { rejected.push({ line: i + 2, reason: `Invalid count ${v} for ${code}` }); return; }
      rows.push({ ...p, district_code: code, contract_count: v as number | null });
    });
  });
  return { rows, total: body.length, rejected };
}

/** Long format: MONTH,DISTRICT,Cases,Temaxia,Total Declared Amount,Total Accepted Amount */
export function parseTransfers(text: string): ParseResult<TransferRow> {
  const [header, ...body] = splitRows(text);
  const rows: TransferRow[] = [];
  const rejected: ParseResult<TransferRow>["rejected"] = [];
  if (!header) return { rows, total: 0, rejected: [{ line: 1, reason: "Empty file" }] };
  const h = header.map((x) => x.toUpperCase());
  const idx = (re: RegExp) => h.findIndex((x) => re.test(x));
  const iM = idx(/MONTH|ΜΗΝΑΣ/), iD = idx(/DISTRICT|ΕΠΑΡΧΙΑ/), iC = idx(/CASES/), iT = idx(/TEMAXIA|ΤΕΜΑΧΙΑ/),
    iDec = idx(/DECLARED/), iAcc = idx(/ACCEPTED/);
  if ([iM, iD, iC, iT, iDec, iAcc].some((x) => x < 0)) {
    return { rows, total: body.length, rejected: [{ line: 1, reason: `Unexpected columns: ${header.join(",")}` }] };
  }
  const seen = new Set<string>();
  body.forEach((cells, i) => {
    const line = i + 2;
    const p = parsePeriod(cells[iM] ?? "");
    if (!p) { rejected.push({ line, reason: `Bad month "${cells[iM]}"` }); return; }
    const code = normalizeDistrict(cells[iD] ?? "");
    if (!code) { rejected.push({ line, reason: `Unknown district "${cells[iD]}"` }); return; }
    const vals = [iC, iT, iDec, iAcc].map((k) => num(cells[k]));
    if (vals.some((v) => Number.isNaN(v))) { rejected.push({ line, reason: "Malformed number" }); return; }
    const [c, t, dec, acc] = vals as (number | null)[];
    if ((c !== null && (c < 0 || !Number.isInteger(c))) || (t !== null && (t < 0 || !Number.isInteger(t)))) {
      rejected.push({ line, reason: "Counts must be whole, non-negative numbers" }); return;
    }
    const key = `${code}|${p.period_date}`;
    if (seen.has(key)) { rejected.push({ line, reason: `Duplicate ${code} ${p.period_date}` }); return; }
    seen.add(key);
    rows.push({
      ...p, district_code: code, transfer_cases: c, parcel_count: t,
      declared_value_eur: dec === null ? null : Math.round(dec * 100) / 100,
      accepted_value_eur: acc === null ? null : Math.round(acc * 100) / 100,
    });
  });
  return { rows, total: body.length, rejected };
}

/** Extract downloadable resource links from a data.gov.cy dataset page. */
export function discoverResourceLinks(html: string, base = "https://data.gov.cy"): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href="(\/sites\/default\/files\/[^"]+\.csv)"/gi)) out.add(base + m[1]);
  return [...out];
}
