import type { StatObs } from "@/lib/eurostatView";
import { yearEarlier } from "@/lib/eurostatView";

export type Lang = "el" | "en";
export type PulseObs = Pick<StatObs, "geo" | "period" | "period_date" | "value" | "status_flag">;

/** Observations for one geography, oldest first. */
export function seriesFor(obs: PulseObs[], geo: string): PulseObs[] {
  return obs.filter((o) => o.geo === geo).sort((a, b) => a.period_date.localeCompare(b.period_date));
}

/** Latest observation and the year-on-year change, only when the same period a year earlier exists. */
export function latestWithYoy(series: PulseObs[], mode: "points" | "percent"): { latest: PulseObs | null; yearAgo: PulseObs | null; change: number | null } {
  const latest = series.length ? series[series.length - 1] : null;
  const yearAgo = latest ? series.find((o) => o.period === yearEarlier(latest.period)) ?? null : null;
  let change: number | null = null;
  if (latest && yearAgo) {
    if (mode === "points") change = latest.value - yearAgo.value;
    else if (yearAgo.value !== 0) change = ((latest.value - yearAgo.value) / Math.abs(yearAgo.value)) * 100;
  }
  return { latest, yearAgo, change };
}

/** Goods balance = exports − imports, only for periods where both are published (same series, units and period). */
export function tradeBalance(exports: PulseObs[], imports: PulseObs[]): PulseObs[] {
  const imp = new Map(imports.map((o) => [o.period, o]));
  return exports.filter((e) => imp.has(e.period)).map((e) => {
    const i = imp.get(e.period)!;
    const flag = [e.status_flag, i.status_flag].filter(Boolean).join("") || null;
    return { geo: e.geo, period: e.period, period_date: e.period_date, value: Math.round((e.value - i.value) * 10) / 10, status_flag: flag };
  }).sort((a, b) => a.period_date.localeCompare(b.period_date));
}

/** Latest period for which every listed geography has a value (headline comparisons never mix periods). */
export function latestCommonPeriod(obs: PulseObs[], geos: string[]): string | null {
  const byPeriod = new Map<string, { date: string; geos: Set<string> }>();
  for (const o of obs) {
    const e = byPeriod.get(o.period) ?? { date: o.period_date, geos: new Set<string>() };
    e.geos.add(o.geo); byPeriod.set(o.period, e);
  }
  const common = [...byPeriod.entries()].filter(([, e]) => geos.every((g) => e.geos.has(g))).sort((a, b) => b[1].date.localeCompare(a[1].date));
  return common[0]?.[0] ?? null;
}

/** Months a release may lag behind today before a figure is shown as out of date. */
const RELEASE_WINDOW_MONTHS: Record<string, number> = { M: 4, Q: 7, A: 20 };

function monthsBetween(periodDate: string, now: Date): number {
  const d = new Date(`${periodDate}T00:00:00Z`);
  return (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + (now.getUTCMonth() - d.getUTCMonth());
}

/** "stale" when the latest reference period is older than the expected release window, or the last successful refresh is over 3 days old. */
export function isStale(latestPeriodDate: string | null, frequency: string, lastSuccessAt: string | null, now: Date = new Date()): boolean {
  if (!latestPeriodDate) return false;
  const window = RELEASE_WINDOW_MONTHS[frequency] ?? 4;
  if (monthsBetween(latestPeriodDate, now) > window) return true;
  if (lastSuccessAt && now.getTime() - new Date(lastSuccessAt).getTime() > 3 * 86_400_000) return true;
  return false;
}

/** "2026-10" → "Οκτ 2026" / "Oct 2026"; "2025-Q2" → "Q2 2025" / "2ο τρίμ. 2025". */
export function periodLabel(p: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toLocaleString(lang === "el" ? "el-GR" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const q = /^(\d{4})-Q(\d)$/.exec(p);
  if (q) return lang === "el" ? `${q[2]}ο τρίμ. ${q[1]}` : `Q${q[2]} ${q[1]}`;
  return p;
}

export function formatValue(v: number | null | undefined, unit: string, decimals: number, lang: Lang): string | null {
  if (v == null) return null;
  const n = v.toLocaleString(lang === "el" ? "el-GR" : "en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (unit.startsWith("%")) return `${n}%`;
  if (unit.startsWith("€ million")) {
    const abs = Math.abs(v).toLocaleString(lang === "el" ? "el-GR" : "en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${v < 0 ? "−" : ""}€${abs}${lang === "el" ? " εκατ." : "m"}`;
  }
  return n;
}

export const GEO_NAMES: Record<string, { en: string; el: string }> = {
  EL: { en: "Greece", el: "Ελλάδα" }, CY: { en: "Cyprus", el: "Κύπρος" }, EU27_2020: { en: "EU-27", el: "ΕΕ-27" }, EA: { en: "Euro area", el: "Ευρωζώνη" },
};
