export type StatDataset = {
  id: string; code: string; dataset_code: string; title_en: string; title_el: string | null; category: string; description: string | null;
  unit_label: string; frequency: string; geos: string[]; decimals: number; higher_is_better: boolean | null; sort_order: number;
  source_label: string | null; source_updated_at: string | null; last_success_at: string | null; latest_period: string | null;
};
export type StatObs = { dataset_id: string; geo: string; period: string; period_date: string; value: number; status_flag: string | null };

export const CATEGORY_LABELS: Record<string, string> = {
  inflation: "Inflation · Πληθωρισμός",
  cost_of_living: "Cost of living · Κόστος διαβίωσης",
  labour: "Jobs · Απασχόληση",
  income: "Household income · Εισόδημα νοικοκυριών",
  consumption: "Household spending · Κατανάλωση",
  savings: "Savings · Αποταμίευση",
  earnings: "Earnings · Αποδοχές",
  poverty: "Financial vulnerability · Οικονομική ευαλωτότητα",
};
export const GEO_LABELS: Record<string, string> = { CY: "Cyprus", EU27_2020: "EU-27", EA: "Euro area" };
export const FLAG_LABELS: Record<string, string> = { e: "estimate", p: "provisional", b: "break in series", d: "definition differs", u: "low reliability", c: "confidential", f: "forecast", s: "Eurostat estimate" };

export function flagText(flag: string | null | undefined): string | null {
  if (!flag) return null;
  return flag.split("").map((c) => FLAG_LABELS[c] ?? c).join(", ");
}

/** "2026-10" → "Oct 2026", "2025" → "2025", "2025-Q2" → "Q2 2025". */
export function prettyStatPeriod(p: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const q = /^(\d{4})-Q(\d)$/.exec(p);
  if (q) return `Q${q[2]} ${q[1]}`;
  return p;
}

/** The same period one year earlier: "2026-10" → "2025-10", "2025" → "2024", "2025-Q2" → "2024-Q2". */
export function yearEarlier(p: string): string {
  const y = Number(p.slice(0, 4)) - 1;
  return `${y}${p.slice(4)}`;
}

export type Headline = {
  latest: StatObs | null;
  yearAgo: StatObs | null;
  change: number | null;
  benchmarks: { geo: string; obs: StatObs | null }[];
};

/** Latest Cyprus figure, the same period a year earlier, and EU benchmarks for the same period only (never a different period). */
export function headline(ds: StatDataset, obs: StatObs[]): Headline {
  const mine = obs.filter((o) => o.dataset_id === ds.id);
  const cy = mine.filter((o) => o.geo === "CY").sort((a, b) => b.period_date.localeCompare(a.period_date));
  const latest = cy[0] ?? null;
  const yearAgo = latest ? cy.find((o) => o.period === yearEarlier(latest.period)) ?? null : null;
  const benchmarks = ds.geos.filter((g) => g !== "CY").map((geo) => ({ geo, obs: latest ? mine.find((o) => o.geo === geo && o.period === latest.period) ?? null : null }));
  return { latest, yearAgo, change: latest && yearAgo ? latest.value - yearAgo.value : null, benchmarks };
}

export function formatStat(v: number | null | undefined, ds: Pick<StatDataset, "decimals" | "unit_label">): string {
  if (v == null) return "Data not available";
  const n = v.toLocaleString("en-GB", { minimumFractionDigits: ds.decimals, maximumFractionDigits: ds.decimals });
  if (ds.unit_label.startsWith("%")) return `${n}%`;
  if (ds.unit_label.startsWith("€")) return `€${n}`;
  return n;
}

export const databrowserUrl = (code: string) => `https://ec.europa.eu/eurostat/databrowser/view/${code}/default/table?lang=en`;
