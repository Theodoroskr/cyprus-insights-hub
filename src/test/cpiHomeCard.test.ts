import { describe, it, expect } from "vitest";
import { homeSummary, type CpiEdition, type CpiResult } from "@/lib/cpi";
const ed = (y: number) => ({ edition_year: y, countries_covered: 182, eu_avg: 62 } as CpiEdition);
const r = (iso: string, y: number, score: number) => ({ country_iso3: iso, edition_year: y, score, rank: 49, rank_tied: true } as CpiResult);
describe("homepage CPI card", () => {
  it("hides when nothing is published", () => expect(homeSummary([], [])).toBeNull());
  it("uses latest edition and YoY change", () => {
    const s = homeSummary([ed(2024), ed(2025)], [r("CYP", 2024, 56), r("CYP", 2025, 55), r("GRC", 2025, 50)]);
    expect(s?.edition.edition_year).toBe(2025);
    expect(s?.change).toBe(-1);
    expect(s?.greece?.score).toBe(50);
  });
});
