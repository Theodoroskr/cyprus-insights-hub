import { describe, it, expect } from "vitest";
import { rankLabel, yoy, gapToEu, trend, ranking, toggleCompare, defaultLang, cpiPath, type CpiResult } from "@/lib/cpi";
import { canonicalIntegrityUrl, contentFingerprint, claimStatus } from "../../supabase/functions/_shared/integritySources";

const r = (iso: string, y: number, score: number | null, rank: number | null, tied = false): CpiResult =>
  ({ country_iso3: iso, country_name: iso, country_name_el: null, region: null, edition_year: y, score, rank, rank_tied: tied });
const data = [r("CYP", 2025, 55, 49, true), r("CYP", 2024, 56, 46), r("GRC", 2025, 50, 56, true), r("GRC", 2024, 49, null), r("DNK", 2025, 89, 1)];

describe("CPI rules", () => {
  it("Cyprus 2025 is tied 49th of 182", () => expect(rankLabel(data[0], 182)).toBe("tied 49th of 182"));
  it("Cyprus down 1, Greece up 1", () => { expect(yoy(data, "CYP", 2025)).toBe(-1); expect(yoy(data, "GRC", 2025)).toBe(1); });
  it("EU gap: Cyprus 7, Greece 12", () => { expect(gapToEu(55, 62)).toBe(7); expect(gapToEu(50, 62)).toBe(12); });
  it("missing rank reads unavailable, never zero", () => expect(rankLabel(data[3], 180)).toBe("Unavailable"));
  it("missing year gives no change", () => expect(yoy(data, "DNK", 2025)).toBeNull());
  it("trend leaves gaps as null", () => expect(trend(data, ["CYP"], [2023, 2025])).toEqual([{ year: 2023, CYP: null }, { year: 2025, CYP: 55 }]));
  it("ranking leads with Denmark", () => expect(ranking(data, 2025)[0].country_iso3).toBe("DNK"));
  it("compare stops at three", () => expect(toggleCompare(["A", "B", "C"], "D")).toEqual(["A", "B", "C"]));
  it("Greece defaults to Greek, Cyprus to English", () => { expect(defaultLang("greece")).toBe("el"); expect(defaultLang("cyprus")).toBe("en"); expect(cpiPath("greece", "en")).toBe("/research/corruption-perceptions/greece?lang=en"); });
});

describe("source dedupe", () => {
  it("same page with tracking params is one URL", () =>
    expect(canonicalIntegrityUrl("https://WWW.coe.int/en/web/greco/news/?utm_source=x#top")).toBe(canonicalIntegrityUrl("https://www.coe.int/en/web/greco/news")));
  it("fingerprint ignores spacing and case", () => expect(contentFingerprint("GRECO  Report")).toBe(contentFingerprint("greco report")));
  it("investigation is never a ruling", () => { expect(claimStatus("Police investigation into tender")).toBe("investigation"); expect(claimStatus("Court ruling convicts official")).toBe("ruling"); });
});
