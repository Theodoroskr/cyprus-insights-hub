import { describe, it, expect } from "vitest";
import { parseRegistrationNumber, pageCount, pageRange, visiblePages, companyCardBadges, safeSearchTerm } from "@/lib/directorySearch";

describe("parseRegistrationNumber", () => {
  it("reads HE-prefixed numbers in Latin and Greek letters", () => {
    expect(parseRegistrationNumber("HE 6771")).toBe("6771");
    expect(parseRegistrationNumber("ΗΕ6771")).toBe("6771");
    expect(parseRegistrationNumber("he-6771")).toBe("6771");
  });
  it("reads bare numbers", () => {
    expect(parseRegistrationNumber("6771")).toBe("6771");
  });
  it("ignores company names", () => {
    expect(parseRegistrationNumber("Deloitte")).toBeNull();
    expect(parseRegistrationNumber("Hellenic Bank 2")).toBeNull();
  });
});

describe("pagination", () => {
  it("shows 25 companies per page", () => {
    expect(pageRange(1)).toEqual([0, 24]);
    expect(pageRange(3)).toEqual([50, 74]);
    expect(pageCount(20000)).toBe(800);
    expect(pageCount(0)).toBe(1);
  });
  it("collapses long page lists with gaps", () => {
    expect(visiblePages(5, 800)).toEqual([1, null, 4, 5, 6, null, 800]);
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
  });
});

describe("companyCardBadges", () => {
  it("shows current regulator badges and active status", () => {
    const labels = companyCardBadges({ cysec_licensed: true, cbc_supervised: true, organisation_status: "Active" }).map((b) => b.label);
    expect(labels).toEqual(["CBC Supervised", "CySEC Licensed", "Active"]);
  });
  it("marks a lapsed CySEC licence as former, never as licensed", () => {
    const labels = companyCardBadges({ cysec_licensed: false, cysec_status: "Withdrawn" }).map((b) => b.label);
    expect(labels).toEqual(["Former CySEC"]);
  });
  it("shows dissolved status", () => {
    expect(companyCardBadges({ organisation_status: "Dissolved" }).map((b) => b.label)).toEqual(["Dissolved"]);
  });
});

it("strips characters that break the search filter", () => {
  expect(safeSearchTerm("Smith, (Cyprus) Ltd")).toBe("Smith Cyprus Ltd");
});
