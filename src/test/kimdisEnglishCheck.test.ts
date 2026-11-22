import { describe, it, expect } from "vitest";
import { readsInEnglish } from "../../supabase/functions/_shared/kimdisEnglish";

describe("KIMDIS translation check", () => {
  const src = "ΠΑΡΑΤΑΣΗ ΥΠΟΒΟΛΗΣ ΠΡΟΣΦΟΡΩΝ ΤΗΣ 37110/22-10-2026 ΔΙΑΚΗΡΥΞΗΣ (ΑΔΑ: Ρ1ΦΝ46ΜΑΖΤ-ΨΜΞ)";
  it("accepts English that keeps Greek reference codes from the source", () => {
    expect(readsInEnglish("Extension of the bid deadline for notice 37110/22-10-2026 (ADA: Ρ1ΦΝ46ΜΑΖΤ-ΨΜΞ)", src)).toBe(true);
  });
  it("rejects text still written in Greek words", () => {
    expect(readsInEnglish("Παράταση of the deadline (ADA: Ρ1ΦΝ46ΜΑΖΤ-ΨΜΞ)", src)).toBe(false);
  });
  it("rejects Greek codes that were not in the source", () => {
    expect(readsInEnglish("Extension (ADA: ΩΩΩ46ΜΑΖΤ)", src)).toBe(false);
  });
});
