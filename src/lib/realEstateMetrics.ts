/** Pure calculations for the Real Estate Intelligence pages. All inputs are published official observations. */

export const DISTRICTS = [
  { code: "NICOSIA", slug: "nicosia", en: "Nicosia", el: "Λευκωσία" },
  { code: "LIMASSOL", slug: "limassol", en: "Limassol", el: "Λεμεσός" },
  { code: "LARNACA", slug: "larnaca", en: "Larnaca", el: "Λάρνακα" },
  { code: "PAPHOS", slug: "paphos", en: "Paphos", el: "Πάφος" },
  { code: "FAMAGUSTA", slug: "famagusta", en: "Famagusta", el: "Αμμόχωστος" },
] as const;

export interface Obs {
  year: number;
  month: number;
  district_code: string;
  [field: string]: number | string | null;
}

export type Frequency = "monthly" | "quarterly" | "annual";

const ym = (y: number, m: number) => y * 12 + (m - 1);

export function pctChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function ratio(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** Sum a field over rows matching a filter; null when no row has a value (unpublished ≠ zero). */
export function sumField(rows: Obs[], field: string, filter: (r: Obs) => boolean = () => true): number | null {
  let total = 0;
  let any = false;
  for (const r of rows) {
    if (!filter(r)) continue;
    const v = r[field];
    if (typeof v === "number") { total += v; any = true; }
    else if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) { total += Number(v); any = true; }
  }
  return any ? total : null;
}

/** Latest month with at least one published value for the field. */
export function latestPeriod(rows: Obs[], field: string): { year: number; month: number } | null {
  let best: { year: number; month: number } | null = null;
  for (const r of rows) {
    if (r[field] == null) continue;
    if (!best || ym(r.year, r.month) > ym(best.year, best.month)) best = { year: r.year, month: r.month };
  }
  return best;
}

/** Year-to-date total for Jan..month of `year`, compared with the same months a year earlier. */
export function ytdComparison(rows: Obs[], field: string, year: number, month: number) {
  const current = sumField(rows, field, (r) => r.year === year && r.month <= month);
  const previous = sumField(rows, field, (r) => r.year === year - 1 && r.month <= month);
  return { current, previous, change: pctChange(current, previous) };
}

/**
 * Trailing-window momentum: the `months` ending at (year, month) vs the same window one year earlier.
 * Returns null if either window has missing months.
 */
export function momentum(rows: Obs[], field: string, year: number, month: number, months: number) {
  const end = ym(year, month);
  const totals = new Map<number, number>();
  for (const r of rows) {
    const v = r[field];
    if (v == null) continue;
    const k = ym(r.year, r.month);
    totals.set(k, (totals.get(k) ?? 0) + Number(v));
  }
  const windowSum = (to: number) => {
    let s = 0;
    for (let k = to - months + 1; k <= to; k++) {
      if (!totals.has(k)) return null;
      s += totals.get(k)!;
    }
    return s;
  };
  const current = windowSum(end);
  const previous = windowSum(end - 12);
  return { current, previous, change: pctChange(current, previous) };
}

export function periodKey(year: number, month: number, freq: Frequency): string {
  if (freq === "annual") return String(year);
  if (freq === "quarterly") return `${year} Q${Math.ceil(month / 3)}`;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Group rows into periods; each period maps field→total and per-district totals. Periods with no data are dropped. */
export function seriesBy(rows: Obs[], fields: string[], freq: Frequency) {
  const map = new Map<string, Record<string, number | string>>();
  const months = new Map<string, Set<number>>();
  for (const r of rows) {
    const key = periodKey(r.year, r.month, freq);
    const entry = map.get(key) ?? { period: key };
    let has = false;
    for (const f of fields) {
      const v = r[f];
      if (v == null) continue;
      has = true;
      entry[f] = Number(entry[f] ?? 0) + Number(v);
      entry[`${f}:${r.district_code}`] = Number(entry[`${f}:${r.district_code}`] ?? 0) + Number(v);
    }
    if (has) {
      map.set(key, entry);
      const s = months.get(key) ?? new Set<number>();
      s.add(r.month);
      months.set(key, s);
    }
  }
  return [...map.values()]
    .map((e) => {
      const n = months.get(String(e.period))?.size ?? 0;
      const expected = freq === "annual" ? 12 : freq === "quarterly" ? 3 : 1;
      return { ...e, period: String(e.period), partial: n < expected, monthsCovered: n } as Record<string, number | string> & { period: string; partial: boolean; monthsCovered: number };
    })
    .sort((a, b) => String(a.period).localeCompare(String(b.period)));
}

export function districtShares(rows: Obs[], field: string, filter: (r: Obs) => boolean) {
  const national = sumField(rows, field, filter);
  return DISTRICTS.map((d) => {
    const v = sumField(rows, field, (r) => r.district_code === d.code && filter(r));
    return { code: d.code, name: d.en, value: v, share: national ? ((v ?? 0) / national) * 100 : null };
  });
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const periodLabel = (p: { year: number; month: number } | null) => (p ? `${MONTHS[p.month - 1]} ${p.year}` : "—");
