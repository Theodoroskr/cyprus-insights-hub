import { describe, it, expect } from "vitest";
import { distinctNeighbours, fallbackFor } from "@/lib/fallbackImage";

describe("distinctNeighbours", () => {
  it("never leaves two identical pictures side by side", () => {
    const a = fallbackFor("compliance", "x");
    const out = distinctNeighbours([a, a, a], ["compliance", "compliance", "compliance"]);
    expect(out[0]).not.toBe(out[1]);
    expect(out[1]).not.toBe(out[2]);
  });
});
