import { describe, expect, it } from "vitest";
import { safeTerm, searchSection, searchSource } from "@/lib/searchTerms";

describe("search terms", () => {
  it("ICPAC finds the ICPAC source", () => { expect(searchSource("ICPAC")).toBe("icpac"); });
  it("Compliance finds the compliance section", () => { expect(searchSection("Compliance")).toBe("compliance"); });
  it("Business maps to the general section", () => { expect(searchSection("Business")).toBe("general"); });
  it("other words match no section or source", () => {
    expect(searchSection("Bank of Cyprus")).toBeNull();
    expect(searchSource("Bank of Cyprus")).toBeNull();
  });
  it("removes characters that would break the filter", () => { expect(safeTerm("a,(b)")).toBe("a  b"); });
});
