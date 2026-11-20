import { describe, it, expect } from "vitest";
import { pickStories, liveBanners, type NewsletterStory, type NewsletterBanner } from "@/lib/newsletter";

const story = (id: string, title: string, vertical = "general"): NewsletterStory => ({
  id, title, summary: null, what_happened: null, why_it_matters: null, image_url: null, vertical, tags: null,
  published_at: "2026-11-19T10:00:00Z",
});
const cy = (n: number) => Array.from({ length: n }, (_, i) => story(`c${i}`, `Cyprus ${["ports", "banks", "hotels", "tax", "energy", "wages", "housing", "exports", "farms", "telecoms"][i]} report number ${i}`, ["general", "fintech", "compliance", "sme", "energy"][i % 5]));
const intl = (n: number) => Array.from({ length: n }, (_, i) => story(`i${i}`, `ECB ${["rates", "bonds", "inflation", "lending", "markets"][i]} update edition ${i}`));

describe("weekly briefing story mix", () => {
  it("8 stories at 75% Cyprus gives 6 Cyprus and 2 International", () => {
    const picked = pickStories([...cy(10), ...intl(5)], {}, 8, 0.75);
    expect(picked.filter((s) => s.id.startsWith("c"))).toHaveLength(6);
    expect(picked.filter((s) => s.id.startsWith("i"))).toHaveLength(2);
  });

  it("fills with Cyprus stories when there is only 1 International story", () => {
    const picked = pickStories([...cy(10), ...intl(1)], {}, 8, 0.75);
    expect(picked.filter((s) => s.id.startsWith("c"))).toHaveLength(7);
    expect(picked.filter((s) => s.id.startsWith("i"))).toHaveLength(1);
  });

  it("never includes the same headline twice", () => {
    const a = story("a", "Cyprus inflation rises to 5.4% in October");
    const b = story("b", "Cyprus inflation rises to 5.4% in October");
    const picked = pickStories([a, b, ...cy(3)], { a: 10, b: 9 }, 4, 1);
    expect(picked.filter((s) => s.id === "a" || s.id === "b")).toHaveLength(1);
  });
});

describe("weekly briefing routine notices", () => {
  it("leaves Official Journal and CySEC warning notices out of the automatic pick", () => {
    const picked = pickStories([
      story("oj", "Official Journal 15/11/2026"),
      story("w", "CySEC Warning regarding the website apex-capitalltd.com - 06/02/2025"),
      ...cy(4),
    ], { oj: 100, w: 90 }, 4, 1);
    expect(picked.map((s) => s.id)).not.toContain("oj");
    expect(picked.map((s) => s.id)).not.toContain("w");
  });
});

describe("weekly briefing banners", () => {
  const b = (id: string, extra: Partial<NewsletterBanner>): NewsletterBanner => ({
    id, name: id, slot_id: "homepage-top", image_url: `https://x/${id}.png`, click_url: null, is_active: true, starts_at: null, ends_at: null, ...extra,
  });
  it("only uses banners that are switched on and within their dates", () => {
    const now = new Date("2026-11-20T10:00:00Z");
    const ids = liveBanners([
      b("live", {}),
      b("off", { is_active: false }),
      b("future", { starts_at: "2026-12-01T00:00:00Z" }),
      b("expired", { ends_at: "2026-11-19T00:00:00Z" }),
    ], now).map((x) => x.id);
    expect(ids).toEqual(["live"]);
  });
});
