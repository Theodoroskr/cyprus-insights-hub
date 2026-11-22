import { describe, expect, it } from "vitest";
import { parseBogTravellers, parsePeriodLabel } from "../../supabase/functions/_shared/bogTravel";

describe("Bank of Greece travellers file", () => {
  it("reads quarter labels in English and Greek", () => {
    expect(parsePeriodLabel("Q3 2025")?.period).toBe("2025-Q3");
    expect(parsePeriodLabel("2025Q1")?.period).toBe("2025-Q1");
    expect(parsePeriodLabel("3rd Quarter 2025")?.period).toBe("2025-Q3");
    expect(parsePeriodLabel("Γ' τρίμηνο 2025")?.period).toBe("2025-Q3");
    expect(parsePeriodLabel("Jul-Sep 2025")?.period).toBe("2025-Q3");
    expect(parsePeriodLabel("III", 2024)?.period).toBe("2024-Q3");
    expect(parsePeriodLabel("Sep 2025")?.period).toBe("2025-09");
  });

  it("never treats a cumulative span or a bare year as a quarter", () => {
    expect(parsePeriodLabel("January-September 2025")).toBeNull();
    expect(parsePeriodLabel("2025")).toBeNull();
  });

  it("takes the Total row with quarters across the top and a year above", () => {
    const rows = [
      ["Number of inbound travellers (thous.)"],
      [null, "2024", null, null, null, "2025", null, null],
      ["Country", "Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3"],
      ["Germany", 100, 900, 1500, 300, 110, 950, 1600],
      ["Total", 1500, 9800, 16000, 3500, 1650, 10200, 16900],
    ];
    const r = parseBogTravellers([{ name: "Sheet1", rows }]);
    expect(r.frequency).toBe("Q");
    expect(r.rows.find((x) => x.period === "2025-Q3")?.value).toBe(16900);
    expect(r.rows.find((x) => x.period === "2024-Q1")?.value).toBe(1500);
    expect(r.rows).toHaveLength(7);
  });

  it("takes the Total column with periods down the side and skips blanks instead of storing zero", () => {
    const rows = [
      ["Period", "Germany", "Total"],
      ["2025", null, null],
      ["I", 110, 1650],
      ["II", 950, 10200],
      ["III", 1600, ""],
    ];
    const r = parseBogTravellers([{ name: "Data", rows }]);
    expect(r.rows.map((x) => x.period)).toEqual(["2025-Q1", "2025-Q2"]);
  });

  it("reads the bank's From/To date layout as quarters, not months", () => {
    const d = (iso: string) => (Date.parse(iso) - Date.UTC(1899, 11, 30)) / 86_400_000;
    const sheet = { name: "Sheet1", rows: [
      ["From", "To", "EU", "TOTAL"],
      [d("2025-01-01"), d("2025-03-31"), 1, 2576.3],
      [d("2025-04-01"), d("2025-06-30"), 1, 10697.2],
    ] };
    const p = parseBogTravellers([sheet]);
    expect(p.frequency).toBe("Q");
    expect(p.rows.map((r) => r.period)).toEqual(["2025-Q1", "2025-Q2"]);
    expect(p.rows[1].value).toBe(10697.2);
  });
  it("refuses a file that gives two different totals for one quarter", () => {
    const rows = [["", "Q1 2025", "Q2 2025", "Q1 2025"], ["Total", 1650, 10200, 1700]];
    expect(() => parseBogTravellers([{ name: "S", rows }])).toThrow(/two different totals/);
  });

  it("refuses totals far outside the thousand-travellers range", () => {
    const rows = [["", "Q1 2025", "Q2 2025"], ["Total", 1650000, 10200000]];
    expect(() => parseBogTravellers([{ name: "S", rows }])).toThrow(/expected range/);
  });
});

describe("newest Bank of Greece file on data.gov.gr", () => {
  it("picks the latest reference date from the English file names", async () => {
    const { latestBogFile } = await import("../../supabase/functions/_shared/bogTravel");
    const f = latestBogFile([
      { name: "BoG_Number_of_inbound_travellers_en_2025-06-30.xlsx", url: "a" },
      { name: "BoG_Number_of_inbound_travellers_en_2025-09-30.xlsx", url: "b" },
      { name: "BoG_Number_of_inbound_travellers_el_2025-12-31.xlsx", url: "c" },
    ]);
    expect(f?.reference_date).toBe("2025-09-30");
  });
});
