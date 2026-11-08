import { describe, it, expect } from "vitest";
import { needsReview } from "@/lib/resourceFreshness";

describe("needsReview", () => {
  const now = new Date("2026-11-08T12:00:00Z");
  it("flags resources never reviewed", () => expect(needsReview(null, now)).toBe(true));
  it("flags resources reviewed more than 6 months ago", () => expect(needsReview("2026-04-11T00:00:00Z", now)).toBe(true));
  it("keeps resources reviewed within 6 months", () => expect(needsReview("2026-06-01T00:00:00Z", now)).toBe(false));
});
