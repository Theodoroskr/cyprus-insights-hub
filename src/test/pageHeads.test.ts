import { describe, expect, it } from "vitest";
import { buildPageHtml, companyHead, sectionHead } from "@/lib/pageHeads";
import { STATIC_ENTRIES } from "@/lib/sitemap";

const TPL = `<html><head><title>BusinessHub.cy — Cyprus Business Intelligence Platform</title><meta data-rh="true" name="description" content="site" /></head><body></body></html>`;

describe("publish-time page heads", () => {
  it("gives every sitemap section page (except the homepage) its own head", () => {
    const missing = STATIC_ENTRIES.filter((e) => e.path !== "/" && !e.path.startsWith("/resources/") && !sectionHead(e.path)).map((e) => e.path);
    expect(missing).toEqual([]);
  });
  it("points each page's canonical at itself, not the homepage", () => {
    const html = buildPageHtml(TPL, sectionHead("/funding")!);
    expect(html).toContain('rel="canonical" href="https://businesshub.cy/funding"');
    expect(html).not.toContain("Cyprus Business Intelligence Platform");
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });
  it("names the company in its page title", () => {
    expect(companyHead({ slug: "acme-nicosia", company_name: "ACME LTD", city: "Nicosia" }).title).toBe("ACME LTD — Cyprus Company Profile");
  });
});
