/**
 * GEMI business-register counts, from the Open Data `/companies` search (no date filter exists):
 *  - active businesses = totalCount of `isActive=true` (a running count for the current month);
 *  - new registrations in a month = (records incorporated on/after the 1st of the month)
 *    − (records incorporated on/after the 1st of the next month), each found by searching the
 *    list sorted newest-first (`-incorporationDate`) for the first older record.
 * Pure helpers here; network calls live in ingest-gemi.
 */
export const GEMI_ACTIVE_CODE = "gr_gemi_active";
export const GEMI_NEW_CODE = "gr_gemi_new";
export const GEMI_SINCE = "2024-01";

/** GEMI dates arrive as ISO ("2024-05-10", "2024-05-10T00:00:00") or Greek style ("10/05/2024"). */
export function parseGemiDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

/** "2024-01" … up to (not including) `untilMonth`. */
export function monthsBetween(fromMonth: string, untilMonth: string): string[] {
  const out: string[] = [];
  let [y, m] = fromMonth.split("-").map(Number);
  for (;;) {
    const p = `${y}-${String(m).padStart(2, "0")}`;
    if (p >= untilMonth) break;
    out.push(p);
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

export const nextMonth = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};
export const monthOf = (d: Date) => d.toISOString().slice(0, 7);

export type GemiPage = { dates: (string | null)[] };
export type Probe = (offset: number) => Promise<GemiPage>;

/**
 * Number of records whose date is on/after `day` in a newest-first list of `total` records.
 * `nullsFirst`: records without a date sit at the top (they count as "newer" so they cancel out
 * when two counts are subtracted). `from` is a known lower bound (a newer day's count);
 * `guess` the expected distance (last month's size) to start the search close by.
 */
export async function countOnOrAfter(probe: Probe, day: string, total: number, opts: { nullsFirst: boolean; from?: number; guess?: number; pageSize: number }): Promise<number> {
  const newer = (d: string | null) => (d === null ? opts.nullsFirst : d >= day);
  let lo = Math.max(0, opts.from ?? 0); // every record before `lo` is newer
  let hi = total;                        // every record from `hi` on is older
  let step = Math.max(opts.pageSize, opts.guess ?? opts.pageSize);
  let galloping = true;
  while (lo < hi) {
    const o = galloping ? Math.min(lo + step, hi - 1) : Math.floor((lo + hi) / 2);
    const start = Math.max(lo, o);
    const { dates } = await probe(start);
    if (!dates.length) { hi = start; galloping = false; continue; }
    const i = dates.findIndex((d) => !newer(d));
    if (i === -1) { lo = start + dates.length; step *= 2; continue; }
    if (i > 0) return start + i;
    hi = start; galloping = false;
  }
  return lo;
}

/**
 * Registrations per month for `months` (newest first, gaps allowed). Stops early when `outOfTime()`
 * says so and returns the month to resume before (`next`).
 */
export async function countMonths(probe: Probe, total: number, months: string[], opts: { nullsFirst: boolean; pageSize: number; outOfTime?: () => boolean }) {
  const values = new Map<string, number>();
  let next: string | null = null;
  if (!months.length) return { values, next };
  const o = { nullsFirst: opts.nullsFirst, pageSize: opts.pageSize };
  let upperMonth = nextMonth(months[0]);
  let upper = await countOnOrAfter(probe, `${upperMonth}-01`, total, o);
  let lastSize = 0;
  for (const p of months) {
    if (opts.outOfTime?.()) { next = nextMonth(p); break; }
    if (upperMonth !== nextMonth(p)) upper = await countOnOrAfter(probe, `${nextMonth(p)}-01`, total, { ...o, from: upper });
    const lower = await countOnOrAfter(probe, `${p}-01`, total, { ...o, from: upper, guess: lastSize });
    values.set(p, lower - upper);
    lastSize = lower - upper; upper = lower; upperMonth = p;
  }
  return { values, next };
}
