import { describe, it, expect } from "vitest";
import { chcCompanyUrl } from "@/lib/companiesHouseCyprus";

describe("Companies House Cyprus links", () => {
  it("limited company uses HE + product", () => {
    expect(chcCompanyUrl({ company_name: "X Ltd", registration_no: "459123", organisation_type: "Company" }, "cyprus-credit-report"))
      .toBe("https://companieshousecyprus.com/company/HE459123?product=cyprus-credit-report");
  });
  it("all certificates has no product", () => {
    expect(chcCompanyUrl({ company_name: "X", registration_no: "1", organisation_type: "Company" })).toBe("https://companieshousecyprus.com/company/HE1");
  });
  it("overseas uses AE, business name uses B", () => {
    expect(chcCompanyUrl({ company_name: "X", registration_no: "77", organisation_type: "Overseas company" })).toBe("https://companieshousecyprus.com/company/AE77");
    expect(chcCompanyUrl({ company_name: "X", registration_no: "88", organisation_type: "Business name" })).toBe("https://companieshousecyprus.com/company/B88");
  });
  it("no number or partnership falls back to name search", () => {
    expect(chcCompanyUrl({ company_name: "A & B", registration_no: null })).toBe("https://companieshousecyprus.com/search?q=A%20%26%20B");
    expect(chcCompanyUrl({ company_name: "Law LLP", registration_no: "470561", organisation_type: "Law Firm / Partnership" }, "cyprus-company-profile"))
      .toBe("https://companieshousecyprus.com/search?q=Law%20LLP");
  });
  it("does not double a prefix", () => {
    expect(chcCompanyUrl({ company_name: "X", registration_no: "HE123" })).toBe("https://companieshousecyprus.com/company/HE123");
  });
});
