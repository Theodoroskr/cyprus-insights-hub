import { describe, it, expect } from "vitest";
import { isLive, pick } from "./academy";
import { ACADEMY_SEED } from "./academySeed";

describe("academy publishing rule", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  it("hides drafts and items under review", () => {
    expect(isLive({ status: "draft", publish_at: null }, now)).toBe(false);
    expect(isLive({ status: "review", publish_at: null }, now)).toBe(false);
  });
  it("shows published items with no date or a past date", () => {
    expect(isLive({ status: "published", publish_at: null }, now)).toBe(true);
    expect(isLive({ status: "published", publish_at: "2026-11-01T00:00:00Z" }, now)).toBe(true);
  });
  it("hides published items scheduled for the future", () => {
    expect(isLive({ status: "published", publish_at: "2026-12-01T00:00:00Z" }, now)).toBe(false);
  });
});

describe("language fallback", () => {
  it("falls back to English when Greek text is empty", () => {
    expect(pick({ body_en: "Hello", body_el: "" }, "body", "el")).toBe("Hello");
    expect(pick({ body_en: "Hello", body_el: "Γεια" }, "body", "el")).toBe("Γεια");
  });
});

describe("starter programmes", () => {
  it("has the five programmes with 6, 8, 8, 7 and 8 modules", () => {
    expect(ACADEMY_SEED.map((p) => p.lessons.length)).toEqual([6, 8, 8, 7, 8]);
  });
});
