import { describe, it, expect } from "vitest";
import { featuredStoryUrl, featuredShareHref, slugFromHref } from "@/lib/featuredShare";

describe("featured company share links", () => {
  it("tags the story link with platform, featured_company and the company", () => {
    const u = new URL(featuredStoryUrl("https://bhubnetwork.com/article/1/x", "linkedin", "acme-ltd"));
    expect(u.searchParams.get("utm_source")).toBe("linkedin");
    expect(u.searchParams.get("utm_medium")).toBe("featured_company");
    expect(u.searchParams.get("utm_campaign")).toBe("acme-ltd");
  });
  it("shares the tagged link, not the bare one", () => {
    const h = featuredShareHref("https://bhubnetwork.com/article/1", "facebook", "acme", "T");
    expect(decodeURIComponent(h)).toContain("utm_medium=featured_company");
  });
  it("reads the slug from a profile link", () => {
    expect(slugFromHref("/directory/company/acme-ltd")).toBe("acme-ltd");
    expect(slugFromHref(null)).toBe("");
  });
});
