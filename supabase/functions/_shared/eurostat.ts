// Pure helpers for the Eurostat Statistics API (JSON-stat 2.0). No Deno/Node imports so tests can run in Vitest.

export const EUROSTAT_API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";

export type DatasetSpec = {
  dataset_code: string;
  filters: Record<string, string>;
  geos: string[];
  since_period: string;
};

export type StatRow = { geo: string; period: string; period_date: string; value: number; status_flag: string | null };
export type ParsedStat = { label: string; updated: string | null; rows: StatRow[]; rejected: string[] };

export function eurostatUrl(spec: DatasetSpec): string {
  const q = new URLSearchParams();
  for (const g of spec.geos) q.append("geo", g);
  q.set("sinceTimePeriod", spec.since_period);
  for (const [k, v] of Object.entries(spec.filters ?? {})) q.set(k, v);
  return `${EUROSTAT_API}${encodeURIComponent(spec.dataset_code)}?${q.toString()}`;
}

/** "2025" → 2025-01-01, "2025-03" → 2025-03-01, "2025-Q2" → 2025-04-01, "2025-S2" → 2025-07-01. */
export function periodToDate(p: string): string | null {
  let m = /^(\d{4})$/.exec(p);
  if (m) return `${m[1]}-01-01`;
  m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(p);
  if (m) return `${m[1]}-${m[2]}-01`;
  m = /^(\d{4})-Q([1-4])$/.exec(p);
  if (m) return `${m[1]}-${String((Number(m[2]) - 1) * 3 + 1).padStart(2, "0")}-01`;
  m = /^(\d{4})-S([12])$/.exec(p);
  if (m) return `${m[1]}-${m[2] === "1" ? "01" : "07"}-01`;
  return null;
}

// deno-lint-ignore no-explicit-any
type Json = any;

/**
 * Validate a JSON-stat 2.0 dataset and flatten it into one row per geo/period.
 * Every dimension other than geo and time must be fixed to a single value by the filters,
 * otherwise observations would be ambiguous and the whole response is rejected.
 */
export function parseJsonStat(doc: Json, expectedGeos: string[]): ParsedStat {
  if (!doc || doc.class !== "dataset" || !Array.isArray(doc.id) || !Array.isArray(doc.size) || typeof doc.dimension !== "object") {
    throw new Error("Response is not a JSON-stat dataset");
  }
  const ids: string[] = doc.id;
  const sizes: number[] = doc.size;
  if (ids.length !== sizes.length) throw new Error("JSON-stat id/size mismatch");
  if (!ids.includes("geo") || !ids.includes("time")) throw new Error("Dataset has no geo or time dimension");
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] !== "geo" && ids[i] !== "time" && sizes[i] !== 1) {
      throw new Error(`Dimension "${ids[i]}" has ${sizes[i]} values; filters must select exactly one`);
    }
  }
  const order = (dim: string): string[] => {
    const idx = doc.dimension[dim]?.category?.index;
    if (Array.isArray(idx)) return idx;
    if (idx && typeof idx === "object") return Object.entries(idx as Record<string, number>).sort((a, b) => a[1] - b[1]).map(([k]) => k);
    return [];
  };
  const geoList = order("geo");
  const timeList = order("time");
  const unknown = geoList.filter((g) => !expectedGeos.includes(g));
  if (unknown.length) throw new Error(`Unexpected geographies in response: ${unknown.join(", ")}`);

  const strides = sizes.map((_, i) => sizes.slice(i + 1).reduce((a, b) => a * b, 1));
  const gPos = ids.indexOf("geo"), tPos = ids.indexOf("time");
  const values = doc.value ?? {};
  const status = doc.status ?? {};
  const get = (src: Json, k: number) => (Array.isArray(src) ? src[k] : src[String(k)]);

  const rows: StatRow[] = [];
  const rejected: string[] = [];
  geoList.forEach((geo, gi) => {
    timeList.forEach((period, ti) => {
      const k = gi * strides[gPos] + ti * strides[tPos];
      const raw = get(values, k);
      if (raw === undefined || raw === null) return; // not published: never stored as zero
      const date = periodToDate(period);
      if (!date) { rejected.push(`${geo} ${period}: unrecognised period`); return; }
      const v = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(v)) { rejected.push(`${geo} ${period}: non-numeric value`); return; }
      const flag = get(status, k);
      rows.push({ geo, period, period_date: date, value: v, status_flag: typeof flag === "string" && flag ? flag : null });
    });
  });
  return { label: String(doc.label ?? ""), updated: typeof doc.updated === "string" ? doc.updated : null, rows, rejected };
}

export const sameValue = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(a - b) < 1e-9);

export type Existing = { value: number; status_flag: string | null };
export type Diff = { inserts: StatRow[]; flagUpdates: StatRow[]; revisions: { row: StatRow; previous: Existing }[]; unchanged: number };

/** New observations publish straight away; a changed historical value becomes a revision for review; nothing is ever deleted. */
export function diffObservations(rows: StatRow[], existing: Map<string, Existing>, pendingKeys: Set<string> = new Set()): Diff {
  const out: Diff = { inserts: [], flagUpdates: [], revisions: [], unchanged: 0 };
  for (const r of rows) {
    const key = `${r.geo}|${r.period}`;
    const old = existing.get(key);
    if (!old) { out.inserts.push(r); continue; }
    if (sameValue(old.value, r.value)) {
      if ((old.status_flag ?? null) !== (r.status_flag ?? null)) out.flagUpdates.push(r);
      else out.unchanged++;
      continue;
    }
    if (!pendingKeys.has(key)) out.revisions.push({ row: r, previous: old });
    else out.unchanged++;
  }
  return out;
}
