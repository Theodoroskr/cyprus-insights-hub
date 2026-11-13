/** Shapes and helpers for the Cyprus Rankings page (data from the `get_rankings` database function). */

export interface OldestCompany { slug: string | null; name: string; registration_date: string; city: string | null }
export interface DistrictCount { slug: string; name_en: string; name_el: string; companies: number }
export interface LicenceCount { source: "cysec" | "cbc"; licence_type: string; firms: number; last_seen_at: string | null }
export interface PropertyDistrict {
  slug: string; name_en: string; name_el: string;
  last12: number | null; prev12: number | null; months12: number; months_prev: number;
}
export interface InNews {
  entity_type: "company" | "directory_company"; entity_id: string; label: string; stories: number;
  latest: string; directory_slug: string | null; company_slug: string | null;
}
export interface RankingsData {
  generated_at: string;
  oldest: OldestCompany[];
  districts: DistrictCount[];
  licences: LicenceCount[];
  property_period_end: string | null;
  property: PropertyDistrict[];
  in_news: InNews[];
}

/**
 * Year-on-year change, rounded to one decimal. Returns null unless both periods have all 12 months,
 * so a part-year is never shown as a fall.
 */
export function yearOnYear(p: Pick<PropertyDistrict, "last12" | "prev12" | "months12" | "months_prev">): number | null {
  if (p.months12 !== 12 || p.months_prev !== 12 || p.last12 == null || !p.prev12) return null;
  return Math.round(((p.last12 - p.prev12) / p.prev12) * 1000) / 10;
}

/** The profile page for a company in the news list; the registry profile is preferred. */
export function inNewsHref(n: Pick<InNews, "directory_slug" | "company_slug">): string | null {
  if (n.directory_slug) return `/directory/company/${n.directory_slug}`;
  if (n.company_slug) return `/companies/${n.company_slug}`;
  return null;
}

/** Whole years between a registration date and a reference date. */
export function yearsSince(date: string, now: Date = new Date()): number {
  const d = new Date(date);
  let years = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) years -= 1;
  return years;
}

export interface ShareQuote { symbol: string; name: string; value: number; change_pct: number; updated_at: string }

/** Tracked shares ranked by today's change, biggest rise first; unpriced shares are left out. */
export function rankShares(quotes: ShareQuote[]): ShareQuote[] {
  return quotes
    .filter((q) => Number(q.value) > 0)
    .map((q) => ({ ...q, value: Number(q.value), change_pct: Number(q.change_pct) }))
    .sort((a, b) => b.change_pct - a.change_pct || a.name.localeCompare(b.name));
}

export const LICENCE_SOURCE_LABEL: Record<LicenceCount["source"], string> = {
  cysec: "CySEC",
  cbc: "Central Bank of Cyprus",
};
