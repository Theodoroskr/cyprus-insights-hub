import { describe, it, expect } from "vitest";
import { ECON_SPECS, buildQuery, parseEconPx, parseEconValue, parsePeriod } from "../../supabase/functions/_shared/econParse";
import { annualGdp, latestOf, prettyPeriod } from "@/lib/econMetrics";

const gdpSpec = ECON_SPECS.find((s) => s.path.endsWith("0620005E.px"))!;
const gdpMeta = { variables: [
  { code: "QUARTER", values: ["0", "1"], valueTexts: ["2026Q1", "2026Q2"] },
  { code: "MEASURE", values: ["0", "1"], valueTexts: ["In Real terms (% change compared to the same quarter of the previous year)", "In Real terms (% change compared to the previous quarter)"] },
  { code: "TYPE OF DATA", values: ["0", "1"], valueTexts: ["Not seasonally adjusted (raw) data", "Working day and seasonally adjusted data"] },
  { code: "NA AGGREGATE", values: ["0"], valueTexts: ["B1GQ Gross domestic product"] },
] };

describe("economic indicator parsing", () => {
  it("treats unpublished cells as null, never zero", () => {
    for (const s of ["..", "...", "-", "N.A.", ""]) expect(parseEconValue(s)).toBeNull();
    expect(parseEconValue("-0.4")).toBe(-0.4);
    expect(parseEconValue("4.37")).toBe(4.37);
    expect(Number.isNaN(parseEconValue("abc"))).toBe(true);
  });
  it("maps quarters to their first month", () => {
    expect(parsePeriod("2026Q2")).toEqual({ frequency: "quarterly", period_date: "2026-04-01", period_label: "2026Q2" });
    expect(parsePeriod("2026M09")?.period_date).toBe("2026-09-01");
    expect(parsePeriod("2026M13")).toBeNull();
  });
  it("selects seasonally adjusted GDP by label, not position", () => {
    const q = buildQuery(gdpSpec, gdpMeta);
    expect(q.query.find((x) => x.code === "TYPE OF DATA")?.selection.values).toEqual(["1"]);
  });
  it("fails loudly when CYSTAT renames a variable", () => {
    const broken = { variables: gdpMeta.variables.filter((v) => v.code !== "TYPE OF DATA") };
    expect(() => buildQuery(gdpSpec, broken)).toThrow(/TYPE OF DATA/);
  });
  it("parses a PxWeb response into series rows", () => {
    const data = { columns: [{ code: "QUARTER" }, { code: "MEASURE" }, { code: "TYPE OF DATA" }, { code: "NA AGGREGATE" }, { code: "x", type: "c" }],
      data: [{ key: ["1", "0", "1", "0"], values: ["3.3"] }, { key: ["1", "1", "1", "0"], values: ["1.2"] }, { key: ["0", "0", "1", "0"], values: ["N.A."] }] };
    const { rows, rejected } = parseEconPx(gdpSpec, gdpMeta, data);
    expect(rejected).toEqual([]);
    expect(rows).toContainEqual({ series_code: "gdp_real_yoy", frequency: "quarterly", period_date: "2026-04-01", period_label: "2026Q2", value: 3.3 });
    expect(rows.find((r) => r.series_code === "gdp_real_yoy" && r.period_label === "2026Q1")?.value).toBeNull();
  });
});

describe("economic indicator metrics", () => {
  it("finds the latest value and the same period a year earlier", () => {
    const rows = [
      { series_code: "unemployment_rate", period_date: "2025-04-01", period_label: "2025Q2", value: 4.5 },
      { series_code: "unemployment_rate", period_date: "2026-01-01", period_label: "2026Q1", value: 4.0 },
      { series_code: "unemployment_rate", period_date: "2026-04-01", period_label: "2026Q2", value: 3.6 },
    ];
    const l = latestOf(rows, "unemployment_rate")!;
    expect(l.value).toBe(3.6);
    expect(l.prev?.value).toBe(4.0);
    expect(l.yearAgo?.value).toBe(4.5);
  });
  it("sums only complete years of quarterly GDP", () => {
    const q = (d: string, v: number) => ({ series_code: "gdp_current_meur", period_date: d, period_label: "", value: v });
    const out = annualGdp([q("2025-01-01", 1), q("2025-04-01", 2), q("2025-07-01", 3), q("2025-10-01", 4), q("2026-01-01", 5)]);
    expect(out).toEqual([{ year: 2025, gdp: 10 }]);
  });
  it("labels periods for readers", () => {
    expect(prettyPeriod("2026M10")).toBe("Oct 2026");
    expect(prettyPeriod("2026Q2")).toBe("Q2 2026");
  });
});
