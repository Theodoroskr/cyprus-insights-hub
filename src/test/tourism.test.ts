import { describe, it, expect } from "vitest";
import { parseTourismPx, countryCodes, parseArrivalValue } from "../../supabase/functions/_shared/tourismParse";
import { annualTotals, topCountries, tourismHeadline, TourismObs } from "@/lib/tourismMetrics";

describe("tourism parsing", () => {
  it("gives duplicate country names distinct codes", () => {
    const c = countryCodes(["TOTAL", "EUROPE", "Georgia (Until 2010 it was included in Europe)", "ASIA", "Georgia (It is included in Asia since 2011 )"]);
    expect(c[2].code).toBe("georgia");
    expect(c[4].code).toBe("georgia-asia");
    expect(c[0].kind).toBe("total");
  });
  it("treats '..' as not published, not zero", () => {
    expect(parseArrivalValue("..")).toBeNull();
    expect(parseArrivalValue("54067")).toBe(54067);
  });
  it("parses a PxWeb response", () => {
    const meta = { variables: [
      { code: "COUNTRY OF USUAL RESIDENCE", values: ["0", "1"], valueTexts: ["TOTAL", "Israel"] },
      { code: "MONTH", values: ["0"], valueTexts: ["2026M09"] },
    ] };
    const r = parseTourismPx(meta, { data: [{ key: ["0", "0"], values: ["500000"] }, { key: ["1", "0"], values: [".."] }] });
    expect(r.rows[0]).toMatchObject({ country_code: "total", period_date: "2026-09-01", arrivals: 500000 });
    expect(r.rows[1].arrivals).toBeNull();
  });
});

const t = (year: number, month: number, arrivals: number | null, code = "total", kind = "total"): TourismObs =>
  ({ year, month, country_code: code, country_label: code, kind, region: null, arrivals });

describe("tourism metrics", () => {
  const totals = [...Array.from({ length: 12 }, (_, i) => t(2025, i + 1, 100)), ...Array.from({ length: 9 }, (_, i) => t(2026, i + 1, 120))];
  it("compares year to date with the same months last year", () => {
    const h = tourismHeadline(totals)!;
    expect(h.latest).toEqual({ year: 2026, month: 9 });
    expect(h.ytd.current).toBe(1080);
    expect(h.ytd.previous).toBe(900);
  });
  it("flags a part year", () => {
    expect(annualTotals(totals).find((a) => a.year === 2026)?.partial).toBe(true);
  });
  it("ranks only countries, not regions", () => {
    const rows = [t(2026, 1, 50, "uk", "country"), t(2026, 1, 999, "europe", "region"), t(2026, 1, 70, "israel", "country")];
    expect(topCountries(rows, 2026, 9).map((r) => r.code)).toEqual(["israel", "uk"]);
  });
});
