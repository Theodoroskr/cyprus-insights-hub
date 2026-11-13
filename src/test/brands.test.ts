import { describe, expect, it } from "vitest";
import { brands, hubLinks } from "@/config/brands";

describe("brand logo marks", () => {
  it("uses each hub's first letter as its mark", () => {
    for (const brand of Object.values(brands)) {
      expect(brand.logoLetter).toBe(brand.name.charAt(0));
    }
  });

  it("keeps a single letter per hub, like BusinessHub's B", () => {
    for (const brand of Object.values(brands)) {
      expect(brand.logoLetter).toHaveLength(1);
    }
  });

  it("gives every hub in the group strip its own badge colour", () => {
    for (const hub of hubLinks) {
      expect(hub.brand.badgeClass).toMatch(/^bg-/);
    }
  });
});
