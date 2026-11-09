import { describe, expect, it } from "vitest";
import { filterLicences, groupByLicenceType, isCurrentLicence, licenceTypeLabel, type LicenceRow } from "./licensedFirms";

const row = (name: string, type: string, status: string, num = ""): LicenceRow => ({
  id: name, entity_name: name, license_type: type, license_number: num, status,
  license_date: null, last_seen_at: null, matched_company_id: null,
});

describe("CySEC-licensed firms list", () => {
  it("counts only Active licences as current", () => {
    expect(isCurrentLicence("Active")).toBe(true);
    expect(isCurrentLicence("Voluntary renunciation")).toBe(false);
    expect(isCurrentLicence("Renunciation pending")).toBe(false);
    expect(isCurrentLicence("Withdrawn")).toBe(false);
    expect(isCurrentLicence("Suspended")).toBe(false);
  });

  it("hides former licences unless asked", () => {
    const rows = [row("Alpha Ltd", "Cyprus Investment Firm (CIF)", "Active"), row("Beta Ltd", "Cyprus Investment Firm (CIF)", "Withdrawn")];
    expect(filterLicences(rows, { includeInactive: false, query: "", type: null }).map((r) => r.entity_name)).toEqual(["Alpha Ltd"]);
    expect(filterLicences(rows, { includeInactive: true, query: "", type: null })).toHaveLength(2);
  });

  it("finds a firm by licence number", () => {
    const rows = [row("Alpha Ltd", "Cyprus Investment Firm (CIF)", "Active", "123/10")];
    expect(filterLicences(rows, { includeInactive: false, query: "123/10", type: null })).toHaveLength(1);
  });

  it("puts both CIF spellings in one group", () => {
    expect(licenceTypeLabel("Investment Firm (CIF)")).toBe("Cyprus Investment Firm (CIF)");
    const groups = groupByLicenceType([
      row("B", "Investment Firm (CIF)", "Revoked"),
      row("A", "Cyprus Investment Firm (CIF)", "Active"),
      row("C", "Crypto-Asset Service Provider (MiCA)", "Active"),
    ]);
    expect(groups[0].type).toBe("Cyprus Investment Firm (CIF)");
    expect(groups[0].rows.map((r) => r.entity_name)).toEqual(["A", "B"]);
  });
});
