import { describe, it, expect } from "vitest";
import { parseCpiSheet, diffCpi } from "../../supabase/functions/_shared/cpiWorkbook";

const H = ["Country / Territory", "ISO3", "TI Region", "CPI 2025 Score", "Global Rank"];
const sheet = (rows: unknown[][]) => [H, ...rows];
const ok = sheet([["Denmark", "DNK", "WE/EU", 89, 1], ["Cyprus", "CYP", "WE/EU", 55, 2], ["Latvia", "LVA", "WE/EU", 55, 2], ["Greece", "GRC", "WE/EU", 50, 4]]);

describe("CPI workbook import", () => {
  it("reads the edition year from the score column", () => {
    const r = parseCpiSheet(ok);
    expect(r.ok && r.year).toBe(2025);
  });
  it("marks shared ranks as tied", () => {
    const r = parseCpiSheet(ok);
    if (!r.ok) throw new Error("should parse");
    expect(r.rows.find((x) => x.country_iso3 === "CYP")?.rank_tied).toBe(true);
    expect(r.rows.find((x) => x.country_iso3 === "GRC")?.rank_tied).toBe(false);
  });
  it("rejects a workbook without the expected number of countries", () => {
    expect(parseCpiSheet(ok, 182).ok).toBe(false);
  });
  it("rejects a duplicated country code", () => {
    expect(parseCpiSheet(sheet([["Denmark", "DNK", "WE/EU", 89, 1], ["Denmark", "DNK", "WE/EU", 89, 1]])).ok).toBe(false);
  });
  it("rejects a score above 100", () => {
    expect(parseCpiSheet(sheet([["Denmark", "DNK", "WE/EU", 101, 1]])).ok).toBe(false);
  });
  it("rejects a non-integer rank", () => {
    expect(parseCpiSheet(sheet([["Denmark", "DNK", "WE/EU", 89, 1.5]])).ok).toBe(false);
  });
  it("rejects ranks that contradict scores", () => {
    expect(parseCpiSheet(sheet([["Denmark", "DNK", "WE/EU", 80, 1], ["Finland", "FIN", "WE/EU", 88, 2]])).ok).toBe(false);
  });
  it("re-importing the same rows shows no changes", () => {
    const r = parseCpiSheet(ok);
    if (!r.ok) throw new Error("should parse");
    const d = diffCpi(r.rows.map((x) => ({ ...x })), r.rows);
    expect([d.added.length, d.changed.length, d.removed.length, d.unchanged]).toEqual([0, 0, 0, 4]);
  });
});

import { ranking } from "./cpi";
describe("CPI ranking table", () => {
  const rows = [
    { country_iso3: "GRC", country_name: "Greece", country_name_el: null, region: "WE/EU", edition_year: 2025, score: 50, rank: 56, rank_tied: true },
    { country_iso3: "BHR", country_name: "Bahrain", country_name_el: null, region: "MENA", edition_year: 2025, score: 50, rank: 56, rank_tied: true },
    { country_iso3: "CYP", country_name: "Cyprus", country_name_el: null, region: "WE/EU", edition_year: 2025, score: 55, rank: 49, rank_tied: true },
  ];
  it("keeps tied ranks when sorted by name", () => {
    const r = ranking(rows, 2025, "", { sort: "name" });
    expect(r.map((x) => [x.country_iso3, x.rank, x.rank_tied])).toEqual([["BHR", 56, true], ["CYP", 49, true], ["GRC", 56, true]]);
  });
  it("filters by TI region", () => {
    expect(ranking(rows, 2025, "", { region: "MENA" }).map((x) => x.country_iso3)).toEqual(["BHR"]);
  });
});
