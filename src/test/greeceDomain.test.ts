import { describe, expect, it } from "vitest";
import { grHostToAppPath, grHref, hostRedirect, greeceUrl, greeceCanonical } from "@/lib/edition";
import { greeceRss, greeceSitemap, greeceNewsSitemap, robotsWithSitemaps, type GreeceRow } from "@/lib/greeceFeeds";
import { blendBlocks } from "@/lib/greeceBlend";

const row = (over: Partial<GreeceRow> = {}): GreeceRow => ({
  id: "11111111-1111-1111-1111-111111111111", title: "Eurobank buyback", title_el: "Αγορά ιδίων μετοχών Eurobank",
  summary: "EN", summary_el: "Περίληψη", image_url: null, published_at: "2026-11-17T10:00:00Z", gr_section: "banking", ...over,
});

describe("businesshub.gr addresses", () => {
  it("maps .gr addresses to the Greece edition", () => {
    expect(grHostToAppPath("/")).toBe("/greece");
    expect(grHostToAppPath("/banking")).toBe("/greece/banking");
    expect(grHostToAppPath("/org/eurobank")).toBe("/greece/org/eurobank");
    expect(grHostToAppPath("/directory")).toBe("/directory");
  });
  it("writes Greece links without the /greece prefix on .gr", () => {
    expect(grHref("/greece/banking", true)).toBe("/banking");
    expect(grHref("/greece", true)).toBe("/");
    expect(grHref("/greece/banking", false)).toBe("/greece/banking");
  });
});

describe("domain redirects", () => {
  it("businesshub.gr keeps Greece pages and stories, sends Cyprus sections to businesshub.cy", () => {
    expect(hostRedirect("businesshub.gr", "/")).toBeNull();
    expect(hostRedirect("businesshub.gr", "/banking")).toBeNull();
    expect(hostRedirect("businesshub.gr", "/article/abc/slug")).toBeNull();
    expect(hostRedirect("businesshub.gr", "/directory", "?q=1")).toBe("https://businesshub.cy/directory?q=1");
    expect(hostRedirect("businesshub.gr", "/greece/banking")).toBe("https://businesshub.gr/banking");
    expect(hostRedirect("www.businesshub.gr", "/banking")).toBe("https://businesshub.gr/banking");
  });
  it("Greece pages on businesshub.cy move to businesshub.gr only once it is live", () => {
    expect(hostRedirect("businesshub.cy", "/greece/banking", "", false)).toBeNull();
    expect(hostRedirect("businesshub.cy", "/greece/banking", "", true)).toBe("https://businesshub.gr/banking");
    expect(hostRedirect("businesshub.cy", "/news", "", true)).toBeNull();
  });
  it("www and the old address still land on businesshub.cy; previews are left alone", () => {
    expect(hostRedirect("www.businesshub.cy", "/news", "", false)).toBe("https://businesshub.cy/news");
    expect(hostRedirect("cyprus-biz-connect.lovable.app", "/", "", false)).toBe("https://businesshub.cy/");
    expect(hostRedirect("id-preview--x.lovable.app", "/greece", "", true)).toBeNull();
    expect(hostRedirect("localhost", "/greece", "", true)).toBeNull();
  });
  it("Greece canonicals switch to businesshub.gr when live", () => {
    expect(greeceCanonical("/greece/banking", "", true)).toBe("https://businesshub.gr/banking");
    expect(greeceUrl("/article/x/y", true)).toBe("https://businesshub.gr/article/x/y");
    expect(greeceUrl("/greece", false)).toBe("https://businesshub.cy/greece");
  });
});

describe("Greece sitemap and feed", () => {
  it("sitemap lists the Greece home, sections, banks and stories on businesshub.gr when live", () => {
    const xml = greeceSitemap([row()], ["eurobank"], true);
    expect(xml).toContain("<loc>https://businesshub.gr/</loc>");
    expect(xml).toContain("<loc>https://businesshub.gr/banking</loc>");
    expect(xml).toContain("<loc>https://businesshub.gr/org/eurobank</loc>");
    expect(xml).toContain("<loc>https://businesshub.gr/article/11111111-1111-1111-1111-111111111111/eurobank-buyback</loc>");
    expect(xml).toContain("<lastmod>2026-11-17</lastmod>");
  });
  it("uses businesshub.cy/greece addresses until the domain is live", () => {
    expect(greeceSitemap([], [], false)).toContain("<loc>https://businesshub.cy/greece</loc>");
  });
  it("RSS feed is in Greek with Greek headlines", () => {
    const xml = greeceRss([row()], true, new Date("2026-11-17T12:00:00Z"));
    expect(xml).toContain("<language>el</language>");
    expect(xml).toContain("<title>Αγορά ιδίων μετοχών Eurobank</title>");
    expect(xml).toContain('href="https://businesshub.gr/rss/greece.xml"');
  });
  it("news sitemap carries only the last 48 hours, as BusinessHub.gr in Greek", () => {
    const xml = greeceNewsSitemap([row(), row({ id: "old", published_at: "2026-11-01T00:00:00Z" })], true, Date.parse("2026-11-17T12:00:00Z"));
    expect(xml).toContain("<news:name>BusinessHub.gr</news:name><news:language>el</news:language>");
    expect(xml).not.toContain("/article/old");
  });
  it("robots.txt keeps its rules and lists every sitemap once", () => {
    const out = robotsWithSitemaps("User-agent: *\nAllow: /\n\nSitemap: https://old/x.xml\n", ["https://a/1.xml", "https://b/2.xml"]);
    expect(out).toBe("User-agent: *\nAllow: /\n\nSitemap: https://a/1.xml\nSitemap: https://b/2.xml\n");
  });
});

describe("businesshub.gr home blend", () => {
  it("splits Cyprus Edition stories into Cyprus and International, Greece-related first", () => {
    const s = (title: string, greece_related = false) => ({ title, summary: null, tags: [], greece_related });
    const { cyprus, international } = blendBlocks([s("Limassol port expands"), s("Cyprus–Greece cable deal", true), s("ECB holds rates")]);
    expect(cyprus.map((x) => x.title)).toEqual(["Cyprus–Greece cable deal", "Limassol port expands"]);
    expect(international.map((x) => x.title)).toEqual(["ECB holds rates"]);
  });
});
