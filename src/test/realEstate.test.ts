import { describe, it, expect } from "vitest";
import { parseSaleContracts, parseTransfers, normalizeDistrict, detectDataset } from "../../supabase/functions/_shared/realEstateParse";
import { ytdComparison, momentum, seriesBy, pctChange, Obs } from "@/lib/realEstateMetrics";

describe("real estate CSV parsing", () => {
  it("keeps blank future months as null, not zero", () => {
    const r = parseSaleContracts("MONTH,NICOSIA,FAMAGUSTA,LARNACA,LIMASSOL,PAFOS\n09/2026,374,63,393,506,345\n10/2026,,,,,\n");
    expect(r.rows.find((x) => x.period_date === "2026-10-01" && x.district_code === "PAPHOS")?.contract_count).toBeNull();
    expect(r.rows.find((x) => x.period_date === "2026-09-01" && x.district_code === "PAPHOS")?.contract_count).toBe(345);
  });
  it("maps PAFOS and Greek district names to one code", () => {
    expect(normalizeDistrict("PAFOS")).toBe("PAPHOS");
    expect(normalizeDistrict("ΠΑΦΟΣ")).toBe("PAPHOS");
    expect(normalizeDistrict("Λευκωσία")).toBe("NICOSIA");
  });
  it("parses transfer values to exact cents and rejects duplicates", () => {
    const csv = "MONTH,DISTRICT,Cases,Temaxia,Total Declared Amount,Total Accepted Amount\n01/2026,ΛΕΥΚΩΣΙΑ,387,427,58918300.28,64262021.73\n01/2026,ΛΕΥΚΩΣΙΑ,1,1,1,1\n";
    expect(detectDataset(csv)).toBe("transfers");
    const r = parseTransfers(csv);
    expect(r.rows[0].accepted_value_eur).toBe(64262021.73);
    expect(r.rejected).toHaveLength(1);
  });
});

const rows: Obs[] = [];
for (const year of [2025, 2026]) for (let m = 1; m <= 12; m++) {
  if (year === 2026 && m > 9) continue;
  rows.push({ year, month: m, district_code: "NICOSIA", n: year === 2025 ? 100 : 110 });
}

describe("real estate metrics", () => {
  it("compares year-to-date with the same months only", () => {
    const r = ytdComparison(rows, "n", 2026, 9);
    expect(r.current).toBe(990);
    expect(r.previous).toBe(900);
    expect(r.change).toBeCloseTo(10);
  });
  it("marks an incomplete year as partial", () => {
    const s = seriesBy(rows, ["n"], "annual");
    expect(s.find((x) => x.period === "2026")?.partial).toBe(true);
    expect(s.find((x) => x.period === "2025")?.partial).toBe(false);
  });
  it("returns null momentum when the earlier window is missing", () => {
    expect(momentum(rows, "n", 2025, 3, 3).change).toBeNull();
    expect(momentum(rows, "n", 2026, 9, 3).change).toBeCloseTo(10);
  });
  it("gives no percentage change from a zero base", () => {
    expect(pctChange(5, 0)).toBeNull();
  });
});
