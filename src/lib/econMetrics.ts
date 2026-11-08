export interface EconObs { series_code: string; period_date: string; period_label: string; value: number | null }

export const SERIES_LABELS: Record<string, string> = {
  cpi_yoy: "Inflation (CPI, % y/y)",
  hicp_yoy: "Inflation (HICP, % y/y)",
  cpi_index: "Consumer Price Index (2025=100)",
  gdp_real_yoy: "Real GDP growth (% y/y, seasonally adjusted)",
  gdp_real_qoq: "Real GDP growth (% q/q, seasonally adjusted)",
  gdp_current_meur: "GDP at current prices (€ million)",
  unemployment_rate: "Unemployment rate (15+, %)",
  youth_unemployment_rate: "Youth unemployment rate (15-24, %)",
};

/** Human label for a CYSTAT period code: 2026M09 -> "Sep 2026", 2026Q2 -> "Q2 2026". */
export function prettyPeriod(label: string): string {
  const m = label.match(/^(\d{4})M(\d{2})$/);
  if (m) return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m[2]) - 1]} ${m[1]}`;
  const q = label.match(/^(\d{4})Q([1-4])$/);
  return q ? `Q${q[2]} ${q[1]}` : label;
}

/** Latest published value of a series, and the change against the previous observation and the same period a year earlier. */
export function latestOf(rows: EconObs[], code: string) {
  const s = rows.filter((r) => r.series_code === code && r.value != null).sort((a, b) => a.period_date.localeCompare(b.period_date));
  const last = s[s.length - 1];
  if (!last) return null;
  const prev = s[s.length - 2] ?? null;
  const yearAgoDate = `${Number(last.period_date.slice(0, 4)) - 1}${last.period_date.slice(4)}`;
  const yearAgo = s.find((r) => r.period_date === yearAgoDate) ?? null;
  return { ...last, value: last.value as number, prev, yearAgo };
}

/** Annual sum of quarterly GDP at current prices; only complete years (4 quarters) count. */
export function annualGdp(rows: EconObs[]) {
  const by = new Map<number, { sum: number; n: number }>();
  for (const r of rows) {
    if (r.series_code !== "gdp_current_meur" || r.value == null) continue;
    const y = Number(r.period_date.slice(0, 4));
    const e = by.get(y) ?? { sum: 0, n: 0 };
    e.sum += r.value; e.n++; by.set(y, e);
  }
  return [...by.entries()].filter(([, e]) => e.n === 4).map(([year, e]) => ({ year, gdp: Math.round(e.sum) })).sort((a, b) => a.year - b.year);
}
