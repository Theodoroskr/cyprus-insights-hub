import { describe, expect, it } from "vitest";
import { buildSitemapIndex, buildUrlset, chunk, STATIC_ENTRIES } from "./sitemap";

describe("sitemap", () => {
  it("points every sitemap file at businesshub.cy", () => {
    const xml = buildSitemapIndex(["/sitemaps/static.xml", "/sitemaps/companies-1.xml"]);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([
      "https://businesshub.cy/sitemaps/static.xml",
      "https://businesshub.cy/sitemaps/companies-1.xml",
    ]);
  });

  it("points every page URL at businesshub.cy", () => {
    const xml = buildUrlset(STATIC_ENTRIES);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBe(STATIC_ENTRIES.length);
    expect(locs.every((l) => l.startsWith("https://businesshub.cy/"))).toBe(true);
  });

  it("keeps Who's Who out of the sitemap", () => {
    expect(STATIC_ENTRIES.some((e) => e.path.startsWith("/whoiswho") || e.path.startsWith("/people"))).toBe(false);
  });

  it("splits companies into files of at most 20,000", () => {
    const sizes = chunk(Array.from({ length: 54790 }, (_, i) => i), 20000).map((c) => c.length);
    expect(sizes).toEqual([20000, 20000, 14790]);
  });
});
