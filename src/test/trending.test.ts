import { describe, it, expect } from "vitest";
import { viewWeight } from "@/lib/trending";
describe("Most Read weighting", () => {
  it("a 6-hour-old view counts half a new one", () => {
    expect(viewWeight(0)).toBe(1);
    expect(viewWeight(6)).toBe(0.5);
    expect(viewWeight(12)).toBe(0.25);
  });
});
