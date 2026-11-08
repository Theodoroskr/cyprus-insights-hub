import { describe, expect, it } from "vitest";
import { canonicalArticleUrl, listingPageProblem, prepareListingMarkdown } from "../../supabase/functions/scrape-sources/listingPage";

const realListing = "# News\n\n" + Array.from({ length: 10 }, (_, i) => `- [Announcement number ${i} about tax](https://example.cy/news/${i})`).join("\n");

describe("listingPageProblem", () => {
  it("flags a 404 status from the scraper", () => {
    expect(listingPageProblem(realListing, 404)).toMatch(/not found/i);
  });

  it("flags moved pages that come back as a short 'page not found' screen", () => {
    expect(listingPageProblem("# 404\n\nLooks like the page you were looking for is no longer here.\n\n[GO BACK HOME](https://www.dsa.cy/)")).toMatch(/not found/i);
    expect(listingPageProblem("# Server Error\n\n## 404 - File or directory not found.\n\n### The resource you are looking for might have been removed, had its name changed.")).toMatch(/not found/i);
    expect(listingPageProblem("Page not found | European Insurance Authority [Skip to main content](x)\n" + "nav ".repeat(2000))).toMatch(/not found/i);
  });

  it("accepts a real news listing", () => {
    expect(listingPageProblem(realListing, 200)).toBeNull();
  });

  it("flags empty pages", () => {
    expect(listingPageProblem("", 200)).toBe("No meaningful content scraped");
  });
});

describe("canonicalArticleUrl", () => {
  it("keeps document ids in the query so different notices are not treated as duplicates", () => {
    const a = canonicalArticleUrl("https://www.cysec.gov.cy/CMSPages/GetFile.aspx?guid=070aa7f0");
    const b = canonicalArticleUrl("https://www.cysec.gov.cy/CMSPages/GetFile.aspx?guid=ec8b8e71");
    expect(a).not.toBe(b);
    expect(canonicalArticleUrl("https://www.cystat.gov.cy/PressRelease?id=73407")).not.toBe(
      canonicalArticleUrl("https://www.cystat.gov.cy/PressRelease?id=73417"),
    );
  });

  it("treats tracking parameters, fragments and trailing slashes as the same article", () => {
    expect(canonicalArticleUrl("https://x.cy/news/1/?utm_source=x#top")).toBe(canonicalArticleUrl("https://x.cy/news/1"));
  });

  it("ignores relative or missing links", () => {
    expect(canonicalArticleUrl("/news/1")).toBeNull();
    expect(canonicalArticleUrl(null)).toBeNull();
  });
});

describe("prepareListingMarkdown", () => {
  it("drops language pickers and cookie lines but keeps article links", () => {
    const md = [
      "This site uses cookies. Visit our cookies policy page",
      "- [bgбългарски](https://x.eu/news_bg)",
      "- [elελληνικά](https://x.eu/news_el)",
      "- [AMLA publishes draft standards](https://x.eu/news/1)",
    ].join("\n");
    const out = prepareListingMarkdown(md);
    expect(out).not.toContain("български");
    expect(out).not.toContain("cookies");
    expect(out).toContain("[AMLA publishes draft standards](https://x.eu/news/1)");
  });

  it("drops runs of short menu links but keeps article titles", () => {
    const md = [
      "- [Starting a Company](https://x.cy/start)",
      "  - [Closing a Company](https://x.cy/close)",
      "",
      "| [Board Decisions](https://x.cy/decisions) |",
      "Latest",
      "- [Press release by the Tax Department regarding the 10-year bond yield](https://x.cy/n/1)",
      "- [VAT deadline extended](https://x.cy/n/2)",
    ].join("\n");
    const out = prepareListingMarkdown(md);
    expect(out).not.toContain("Starting a Company");
    expect(out).not.toContain("Closing a Company");
    expect(out).not.toContain("Board Decisions");
    expect(out).toContain("Press release by the Tax Department");
    expect(out).toContain("VAT deadline extended");
  });

  it("starts from the page title when the menus would push the list past the limit", () => {
    const md = "intro words ".repeat(3000) + "\n# Announcements\n\n" + "[Suspension of CIF authorisation of Example Ltd](https://x.cy/a/1)\n".repeat(40);
    const out = prepareListingMarkdown(md, 20000);
    expect(out.startsWith("# Announcements")).toBe(true);
  });

  it("caps the text sent for extraction", () => {
    expect(prepareListingMarkdown("a".repeat(50000), 20000).length).toBe(20000);
  });
});
