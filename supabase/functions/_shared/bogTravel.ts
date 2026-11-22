// Pure parser for the Bank of Greece open-data file "Number of inbound travellers in Greece by country of origin".
// No Deno/Node imports so Vitest can run it. The file is uploaded by an admin (the Bank of Greece blocks automated downloads).
// Reads only the all-countries Total line; quarters or months are recognised from the header labels; blank cells are skipped, never zero.
import type { Cell, Sheet } from "./xlsxReader.ts";

export type TravelRow = { period: string; value: number; status_flag: string | null };
export type TravelParse = { frequency: "Q" | "M"; rows: TravelRow[]; notes: string[]; sheet: string };

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, "Ι": 1, "ΙΙ": 2, "ΙΙΙ": 3, "ΙV": 4 };
const MONTHS: [RegExp, number][] = [
  [/^(jan|ιαν)/, 1], [/^(feb|φεβ|φλεβ)/, 2], [/^(mar|μαρ|μάρ)/, 3], [/^(apr|απρ|απρ)/, 4], [/^(may|μαΐ|μαι|μάι)/, 5], [/^(jun|ιουν|ιούν)/, 6],
  [/^(jul|ιουλ|ιούλ)/, 7], [/^(aug|αυγ|αύγ)/, 8], [/^(sep|σεπ)/, 9], [/^(oct|οκτ)/, 10], [/^(nov|νοε|νοέ)/, 11], [/^(dec|δεκ)/, 12],
];
const monthOf = (w: string) => { const l = w.toLowerCase(); for (const [re, n] of MONTHS) if (re.test(l)) return n; return null; };
const pad = (n: number) => String(n).padStart(2, "0");

/** Excel serial date → "YYYY-MM-DD" (header cells are sometimes real dates). */
const serialToIso = (n: number) => new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86_400_000).toISOString().slice(0, 10);

/**
 * Turn one header label into a period: "2025-Q3", "Q3 2025", "3rd Quarter 2025", "Γ' τρίμηνο 2025", "III 2025",
 * "Jul-Sep 2025" → "2025-Q3"; "Sep 2025", "2025-09", "Σεπτέμβριος 2025" → "2025-09".
 * Cumulative spans ("January-September 2025") and bare years return null. `year` fills in a year given in a row above.
 */
export function parsePeriodLabel(raw: Cell, year?: number | null): { period: string; provisional: boolean } | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    if (raw > 20000 && raw < 80000) { // Excel date: a month-end or month-start date
      const iso = serialToIso(raw); const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
      return { period: `${y}-${pad(m)}`, provisional: false };
    }
    return null;
  }
  const provisional = /\*|\(p\)|provisional|προσωρ/i.test(raw);
  const s = raw.replace(/\*/g, " ").replace(/\((p|provisional)\)/gi, " ").replace(/\s+/g, " ").trim();
  const yr = /(?:^|\D)((?:19|20)\d{2})(?:\D|$)/.exec(s)?.[1];
  const y = yr ? Number(yr) : year ?? null;
  if (!y) return null;
  const rest = s.replace(String(yr ?? ""), " ").replace(/\s+/g, " ").trim();
  let q: number | null = null;
  let m: RegExpExecArray | null;
  if ((m = /(?:^|[^a-z])q\s*([1-4])(?:\D|$)/i.exec(rest))) q = Number(m[1]);
  else if ((m = /^([1-4])\s*q$/i.exec(rest))) q = Number(m[1]);
  else if ((m = /([1-4])\s*(?:st|nd|rd|th|ο)?\s*(?:quarter|τρίμηνο|τριμ)/i.exec(rest))) q = Number(m[1]);
  else if ((m = /^([ΑαΒβΓγΔδ])['΄’]?\s*(?:τρίμηνο|τριμ)/.exec(rest))) q = "ΑΒΓΔ".indexOf(m[1].toUpperCase()) + 1;
  else if ((m = /^(I{1,3}|IV|Ι{1,3}|ΙV)\b\.?\s*(?:quarter|τρίμηνο)?$/.exec(rest))) q = ROMAN[m[1]] ?? null;
  if (q) return { period: `${y}-Q${q}`, provisional };
  const words = rest.split(/[\s\-–—\/.,]+/).filter(Boolean);
  const months = words.map(monthOf).filter((n): n is number => n != null);
  if (months.length === 2) {
    const [a, b] = months;
    if (b - a === 2 && (a - 1) % 3 === 0) return { period: `${y}-Q${(a + 2) / 3}`, provisional };
    return null; // a cumulative span such as January–September
  }
  if (months.length === 1 && words.length <= 2) return { period: `${y}-${pad(months[0])}`, provisional };
  if ((m = /^(?:(?:19|20)\d{2})[-\/.](0?[1-9]|1[0-2])$/.exec(s))) return { period: `${y}-${pad(Number(m[1]))}`, provisional };
  if ((m = /^(?:(?:19|20)\d{2})\s*-?\s*Q([1-4])$/i.exec(s))) return { period: `${y}-Q${m[1]}`, provisional };
  return null;
}

const text = (c: Cell) => (typeof c === "string" ? c.trim() : c == null ? "" : String(c));
const isTotal = (c: Cell) => /^(grand\s+)?total(\s+(arrivals|travellers|inbound|all countries))?\s*:?$|^(γενικό\s+)?σύνολο(\s+χωρών)?\s*:?$/i.test(text(c));
const yearOf = (c: Cell) => { const t = text(c); const m = /^((?:19|20)\d{2})\*?$/.exec(t) ?? (typeof c === "number" && c >= 1990 && c <= 2100 ? [t, t] : null); return m ? Number(m[1]) : null; };
const numeric = (c: Cell): number | null => {
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  const t = text(c).replace(/\s/g, "");
  if (!t || /^[-–—.:x]+$/i.test(t)) return null;
  const n = Number(t.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

type Found = { periods: Map<string, { value: number; provisional: boolean }>; conflicts: string[]; skipped: string[] };

function collect(pairs: { label: Cell; year: number | null; value: Cell }[]): Found {
  const out: Found = { periods: new Map(), conflicts: [], skipped: [] };
  for (const p of pairs) {
    const per = parsePeriodLabel(p.label, p.year);
    if (!per) { if (text(p.label) && /\d{4}|[a-zα-ω]/i.test(text(p.label)) && numeric(p.value) != null) out.skipped.push(text(p.label)); continue; }
    const v = numeric(p.value);
    if (v == null) continue;
    const prev = out.periods.get(per.period);
    if (prev && Math.abs(prev.value - v) > 1e-9) { out.conflicts.push(per.period); continue; }
    out.periods.set(per.period, { value: v, provisional: per.provisional });
  }
  return out;
}

/** Periods across the top, the Total line as a row. Header text is read from up to 4 rows above, with a year carried right over merged cells. */
function across(rows: Cell[][], r: number, c0: number): Found {
  const width = Math.max(...rows.slice(Math.max(0, r - 8), r + 1).map((x) => x.length));
  let best: Found = { periods: new Map(), conflicts: [], skipped: [] };
  for (let h = r - 1; h >= Math.max(0, r - 8); h--) {
    const above = h > 0 ? rows[h - 1] ?? [] : [];
    let carry: number | null = null;
    const pairs = [];
    for (let c = c0 + 1; c < width; c++) {
      const y = yearOf(above[c]); if (y) carry = y;
      pairs.push({ label: rows[h]?.[c] ?? null, year: carry, value: rows[r]?.[c] ?? null });
    }
    const f = collect(pairs);
    if (f.periods.size > best.periods.size) best = f;
  }
  return best;
}

/** "From"/"To" date columns (the bank's current layout): 1 Jan – 31 Mar → "2025-Q1", a single month → "2025-01"; anything else stays as it is. */
function spanLabel(from: Cell, to: Cell): string | null {
  const isDate = (x: Cell): x is number => typeof x === "number" && x > 20000 && x < 80000;
  if (!isDate(from) || !isDate(to)) return null;
  const a = serialToIso(from), b = serialToIso(to);
  const ya = Number(a.slice(0, 4)), ma = Number(a.slice(5, 7)), yb = Number(b.slice(0, 4)), mb = Number(b.slice(5, 7));
  if (a.slice(8) !== "01" || ya !== yb) return null;
  const end = new Date(Date.UTC(yb, mb, 0)).getUTCDate();
  if (Number(b.slice(8)) !== end) return null;
  if (mb === ma) return `${ya}-${pad(ma)}`;
  if (mb - ma === 2 && (ma - 1) % 3 === 0) return `${ya}-Q${(ma + 2) / 3}`;
  return "cumulative " + a + " " + b; // a longer span: never stored
}

/** Periods down the side, Total as a column header. A year on its own line applies to the quarter/month lines below it. */
function down(rows: Cell[][], r: number, c: number): Found {
  let best: Found = { periods: new Map(), conflicts: [], skipped: [] };
  for (let lc = 0; lc < c; lc++) {
    let carry: number | null = null;
    const pairs = [];
    for (let i = r + 1; i < rows.length; i++) {
      const y = yearOf(rows[i]?.[lc] ?? null);
      if (y) { carry = y; }
      pairs.push({ label: spanLabel(rows[i]?.[lc] ?? null, rows[i]?.[lc + 1] ?? null) ?? rows[i]?.[lc] ?? null, year: carry, value: rows[i]?.[c] ?? null });
      // a year cell can sit in the column left of the quarter label
      if (lc > 0) { const y2 = yearOf(rows[i]?.[lc - 1] ?? null); if (y2) carry = y2; }
    }
    const f = collect(pairs);
    if (f.periods.size > best.periods.size) best = f;
  }
  return best;
}

/** Find the all-countries Total line in the uploaded workbook and return its quarterly (or monthly) values. Throws with a plain reason when it cannot. */
export function parseBogTravellers(sheets: Sheet[]): TravelParse {
  let best: (Found & { sheet: string; where: string }) | null = null;
  for (const sh of sheets) {
    for (let r = 0; r < sh.rows.length; r++) {
      const row = sh.rows[r] ?? [];
      for (let c = 0; c < row.length; c++) {
        if (!isTotal(row[c])) continue;
        for (const f of [across(sh.rows, r, c), down(sh.rows, r, c)]) {
          if (f.periods.size >= 2 && (!best || f.periods.size > best.periods.size)) best = { ...f, sheet: sh.name, where: `${sh.name} row ${r + 1}` };
        }
      }
    }
  }
  if (!best) throw new Error("No 'Total' line with quarterly or monthly figures was found in this file. Check it is the Bank of Greece 'Number of inbound travellers' file.");
  if (best.conflicts.length) throw new Error(`The file gives two different totals for ${[...new Set(best.conflicts)].join(", ")}; nothing was imported.`);
  const keys = [...best.periods.keys()];
  const quarterly = keys.filter((k) => /-Q\d$/.test(k)).length, monthly = keys.length - quarterly;
  if (quarterly && monthly) throw new Error("The Total line mixes quarters and months; nothing was imported.");
  const rows = keys.sort().map((k) => ({ period: k, value: best!.periods.get(k)!.value, status_flag: best!.periods.get(k)!.provisional ? "p" : null }));
  const notes = [`Read from ${best.where}.`];
  if (best.skipped.length) notes.push(`Columns not stored (not a single quarter or month): ${[...new Set(best.skipped)].slice(0, 6).join("; ")}.`);
  const bad = rows.filter((x) => x.value <= 0 || x.value > 50_000);
  if (bad.length) throw new Error(`Totals outside the expected range (thousand travellers): ${bad.slice(0, 4).map((b) => `${b.period} = ${b.value}`).join(", ")}. Nothing was imported.`);
  return { frequency: quarterly ? "Q" : "M", rows, notes, sheet: best.sheet };
}

/** Newest English "Number of inbound travellers" file in a data.gov.gr (CKAN) resource list, by the reference date in its name. */
export function latestBogFile(resources: { name?: string; url?: string }[]): { name: string; url: string; reference_date: string } | null {
  let best: { name: string; url: string; reference_date: string } | null = null;
  for (const r of resources) {
    const m = /BoG_Number_of_inbound_travellers_en_(\d{4}-\d{2}-\d{2})\.xlsx$/i.exec(r.name ?? r.url ?? "");
    if (!m || !r.url) continue;
    if (!best || m[1] > best.reference_date) best = { name: r.name ?? m[0], url: r.url, reference_date: m[1] };
  }
  return best;
}
