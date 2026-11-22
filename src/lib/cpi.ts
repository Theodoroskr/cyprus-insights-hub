// Corruption Perceptions Index helpers shared by the research pages and tests.
export type CpiEdition = { edition_year: number; release_date: string | null; countries_covered: number | null; global_avg: number | null; eu_avg: number | null; below_50: number | null; verified_at: string | null; source_url: string };
export type CpiResult = { country_iso3: string; country_name: string; country_name_el: string | null; region: string | null; edition_year: number; score: number | null; rank: number | null; rank_tied: boolean };
export type CpiMarket = "cyprus" | "greece" | "global";
export type Lang = "en" | "el";

export const CPI_SOURCES = {
  cpi: "https://www.transparency.org/en/cpi/2025",
  cyprus: "https://www.transparency.org/en/countries/cyprus",
  greece: "https://www.transparency.org/en/countries/greece",
  eu: "https://www.transparency.de/fileadmin/Redaktion/Aktuelles/2026/CPI_2025/CPI2025_FINAL_ALL_MAPS_EN.pdf",
  ruleOfLaw: "https://commission.europa.eu/publications/2026-rule-law-report-communication-and-country-chapters_en",
  greco: "https://www.coe.int/en/web/greco",
};

export const MARKET_ISO: Record<Exclude<CpiMarket, "global">, string> = { cyprus: "CYP", greece: "GRC" };
export const defaultLang = (m: CpiMarket): Lang => (m === "greece" ? "el" : "en");
export const cpiPath = (m: CpiMarket, lang?: Lang) =>
  `/research/corruption-perceptions/${m}${lang && lang !== defaultLang(m) ? `?lang=${lang}` : ""}`;

/** "=49th of 182" — keeps ties and the edition's own denominator. */
export function rankLabel(r: Pick<CpiResult, "rank" | "rank_tied"> | undefined, of: number | null | undefined, lang: Lang = "en"): string {
  if (!r || r.rank == null) return lang === "el" ? "Μη διαθέσιμο" : "Unavailable";
  const n = lang === "el" ? `${r.rank}η` : `${r.rank}${ordinal(r.rank)}`;
  const tied = r.rank_tied ? (lang === "el" ? "ισοβαθμία, " : "tied ") : "";
  const denom = of ? (lang === "el" ? ` από ${of}` : ` of ${of}`) : "";
  return `${tied}${n}${denom}`;
}
function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
}

export const fmtScore = (v: number | null | undefined, lang: Lang = "en") => (v == null ? (lang === "el" ? "Μη διαθέσιμο" : "Unavailable") : `${v}/100`);

/** Year-on-year change; null when either year is missing (never treated as zero). */
export function yoy(results: CpiResult[], iso: string, year: number): number | null {
  const cur = results.find((r) => r.country_iso3 === iso && r.edition_year === year)?.score;
  const prev = results.find((r) => r.country_iso3 === iso && r.edition_year === year - 1)?.score;
  return cur == null || prev == null ? null : cur - prev;
}

/** Score trend for charts: one point per edition, score only. */
export function trend(results: CpiResult[], isos: string[], years: number[]) {
  return years.map((y) => {
    const row: Record<string, number | null> = { year: y };
    for (const iso of isos) row[iso] = results.find((r) => r.country_iso3 === iso && r.edition_year === y)?.score ?? null;
    return row;
  });
}

/** Ranking for one edition sorted by rank then score; search matches English or Greek names. */
export function ranking(results: CpiResult[], year: number, q = "") {
  const s = q.trim().toLowerCase();
  return results
    .filter((r) => r.edition_year === year)
    .filter((r) => !s || r.country_name.toLowerCase().includes(s) || (r.country_name_el ?? "").toLowerCase().includes(s) || r.country_iso3.toLowerCase() === s)
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || (b.score ?? -1) - (a.score ?? -1));
}

export const MAX_COMPARE = 3;
export function toggleCompare(sel: string[], iso: string): string[] {
  if (sel.includes(iso)) return sel.filter((x) => x !== iso);
  return sel.length >= MAX_COMPARE ? sel : [...sel, iso];
}

/** Points below the EU benchmark, e.g. Cyprus 55 vs 62 → 7. */
export const gapToEu = (score: number | null | undefined, eu: number | null | undefined) => (score == null || eu == null ? null : eu - score);

/** Homepage card summary for the latest edition; null when nothing is published. */
export function homeSummary(editions: CpiEdition[], results: CpiResult[]) {
  const ed = [...editions].sort((a, b) => b.edition_year - a.edition_year)[0];
  if (!ed) return null;
  const cy = results.find((r) => r.country_iso3 === "CYP" && r.edition_year === ed.edition_year);
  if (!cy || cy.score == null) return null;
  const gr = results.find((r) => r.country_iso3 === "GRC" && r.edition_year === ed.edition_year);
  return { edition: ed, cyprus: cy, greece: gr ?? null, change: yoy(results, "CYP", ed.edition_year) };
}
