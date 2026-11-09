import { describe, expect, it } from "vitest";
import { canonicalUrl } from "./seo";

describe("canonicalUrl", () => {
  it("points a story page at its own address, not the homepage", () => {
    expect(canonicalUrl("/article/a7c5494b-b65f-460e-99ad-3f8e288b18f2")).toBe(
      "https://businesshub.cy/article/a7c5494b-b65f-460e-99ad-3f8e288b18f2",
    );
  });

  it("points a company page at its own address", () => {
    expect(canonicalUrl("/directory/company/bank-of-cyprus")).toBe(
      "https://businesshub.cy/directory/company/bank-of-cyprus",
    );
  });

  it("gives one address per page regardless of trailing slash or query string", () => {
    expect(canonicalUrl("/news/some-story/?utm_source=facebook")).toBe(
      "https://businesshub.cy/news/some-story",
    );
  });

  it("keeps the homepage as the bare domain with a slash", () => {
    expect(canonicalUrl("/")).toBe("https://businesshub.cy/");
  });
});
