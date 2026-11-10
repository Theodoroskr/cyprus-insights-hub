import { describe, it, expect } from "vitest";
import { diffObservations, eurostatUrl, parseJsonStat, periodToDate } from "../../supabase/functions/_shared/eurostat";

const doc = {
  class: "dataset", label: "HICP", updated: "2026-11-04T11:00:00+0100",
  id: ["freq", "unit", "geo", "time"], size: [1, 1, 2, 3],
  dimension: {
    freq: { category: { index: { M: 0 } } }, unit: { category: { index: { RCH_A: 0 } } },
    geo: { category: { index: { EU27_2020: 0, CY: 1 } } },
    time: { category: { index: { "2026-08": 0, "2026-09": 1, "2026-10": 2 } } },
  },
  value: { "0": 2.1, "1": 2.2, "3": 4.9, "4": 5.0, "5": 5.4 },
  status: { "5": "e" },
};

describe("Eurostat import", () => {
  it("reads values by geo and period, keeps flags, and skips gaps instead of storing zero", () => {
    const p = parseJsonStat(doc, ["CY", "EU27_2020"]);
    expect(p.rows).toHaveLength(5);
    expect(p.rows.find((r) => r.geo === "CY" && r.period === "2026-10")).toMatchObject({ value: 5.4, status_flag: "e", period_date: "2026-10-01" });
    expect(p.rows.find((r) => r.geo === "EU27_2020" && r.period === "2026-10")).toBeUndefined();
  });
  it("rejects a response whose filters leave a dimension ambiguous", () => {
    expect(() => parseJsonStat({ ...doc, size: [1, 2, 2, 3] }, ["CY", "EU27_2020"])).toThrow(/exactly one/);
  });
  it("sends changed historical values to review and never overwrites them", () => {
    const rows = parseJsonStat(doc, ["CY", "EU27_2020"]).rows;
    const existing = new Map([["CY|2026-08", { value: 4.8, status_flag: null }], ["CY|2026-09", { value: 5.0, status_flag: "p" }]]);
    const d = diffObservations(rows, existing);
    expect(d.revisions.map((r) => r.row.period)).toEqual(["2026-08"]);
    expect(d.flagUpdates.map((r) => r.period)).toEqual(["2026-09"]);
    expect(d.inserts).toHaveLength(3);
  });
  it("builds quarter dates and the CY-filtered URL", () => {
    expect(periodToDate("2025-Q3")).toBe("2025-07-01");
    expect(eurostatUrl({ dataset_code: "prc_hicp_minr", filters: { unit: "RCH_A" }, geos: ["CY"], since_period: "2024-01" })).toContain("geo=CY&sinceTimePeriod=2024-01&unit=RCH_A");
  });
});

import { headline, yearEarlier, type StatDataset } from "./eurostatView";
describe("Eurostat dashboard figures", () => {
  const ds = { id: "d", geos: ["CY", "EU27_2020"] } as StatDataset;
  const o = (geo: string, period: string, value: number) => ({ dataset_id: "d", geo, period, period_date: `${period}-01`, value, status_flag: null });
  it("compares Cyprus with the EU only for the same period", () => {
    const h = headline(ds, [o("CY", "2026-10", 5.4), o("CY", "2025-10", 0.2), o("EU27_2020", "2026-09", 2.5)]);
    expect(h.latest?.period).toBe("2026-10");
    expect(h.change).toBeCloseTo(5.2);
    expect(h.benchmarks[0].obs).toBeNull();
  });
  it("finds the same period a year earlier", () => {
    expect(yearEarlier("2025-Q2")).toBe("2024-Q2");
    expect(yearEarlier("2025")).toBe("2024");
  });
});
