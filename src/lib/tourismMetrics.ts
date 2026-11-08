import { Obs, ytdComparison, momentum, latestPeriod, pctChange } from "@/lib/realEstateMetrics";

export interface TourismObs {
  year: number; month: number; country_code: string; country_label: string; kind: string; region: string | null; arrivals: number | null;
}

/** Adapt to the shared metric helpers (they group by `district_code`). */
export const asObs = (rows: TourismObs[]): Obs[] =>
  rows.map((r) => ({ year: r.year, month: r.month, district_code: r.country_code, arrivals: r.arrivals }));

export function tourismHeadline(totals: TourismObs[]) {
  const obs = asObs(totals);
  const lp = latestPeriod(obs, "arrivals");
  if (!lp) return null;
  const month = totals.find((r) => r.year === lp.year && r.month === lp.month)?.arrivals ?? null;
  const prevMonth = totals.find((r) => r.year === lp.year - 1 && r.month === lp.month)?.arrivals ?? null;
  return {
    latest: lp,
    month, monthChange: pctChange(month, prevMonth),
    ytd: ytdComparison(obs, "arrivals", lp.year, lp.month),
    m12: momentum(obs, "arrivals", lp.year, lp.month, 12),
  };
}

/** Annual totals; years with fewer than 12 months are flagged partial. */
export function annualTotals(totals: TourismObs[]) {
  const map = new Map<number, { year: number; arrivals: number; months: number }>();
  for (const r of totals) {
    if (r.arrivals == null) continue;
    const e = map.get(r.year) ?? { year: r.year, arrivals: 0, months: 0 };
    e.arrivals += r.arrivals; e.months++;
    map.set(r.year, e);
  }
  return [...map.values()].sort((a, b) => a.year - b.year).map((e) => ({ ...e, partial: e.months < 12 }));
}

/** Country ranking for Jan..month of `year` (individual countries only, not regions). */
export function topCountries(rows: TourismObs[], year: number, month: number, limit = 10) {
  const cur = new Map<string, { code: string; label: string; value: number; prev: number | null }>();
  for (const r of rows) {
    if (r.kind !== "country" || r.arrivals == null || r.month > month) continue;
    if (r.year !== year && r.year !== year - 1) continue;
    const e = cur.get(r.country_code) ?? { code: r.country_code, label: r.country_label, value: 0, prev: null };
    if (r.year === year) e.value += r.arrivals; else e.prev = (e.prev ?? 0) + r.arrivals;
    cur.set(r.country_code, e);
  }
  return [...cur.values()].filter((e) => e.value > 0).sort((a, b) => b.value - a.value).slice(0, limit)
    .map((e) => ({ ...e, change: pctChange(e.value, e.prev) }));
}
