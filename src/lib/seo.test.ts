import { describe, expect, it } from "vitest";
import { canonicalUrl, readStaticPreview, SITE_TITLE } from "./seo";

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

function fakeDoc(tags: Record<string, string>) {
  return {
    querySelector: (sel: string) =>
      sel in tags ? ({ getAttribute: () => tags[sel] } as unknown as Element) : null,
  };
}

describe("readStaticPreview", () => {
  it("keeps a story's own title and photo from the served page", () => {
    const p = readStaticPreview(fakeDoc({
      'meta[property="og:title"]': "EU and Moldova platform | BusinessHub.cy",
      'meta[property="og:image"]': "https://example.eu/photo.jpg",
      'meta[property="og:type"]': "article",
    }));
    expect(p?.title).toBe("EU and Moldova platform | BusinessHub.cy");
    expect(p?.image).toBe("https://example.eu/photo.jpg");
    expect(p?.type).toBe("article");
  });

  it("ignores the generic site-wide fallback tags", () => {
    expect(readStaticPreview(fakeDoc({ 'meta[property="og:title"]': SITE_TITLE }))).toBeNull();
  });
});
