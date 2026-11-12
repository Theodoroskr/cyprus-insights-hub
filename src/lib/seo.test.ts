import { describe, expect, it } from "vitest";
import { canonicalUrl, metaDescription, readStaticPreview, routeMeta, SITE_DESCRIPTION, SITE_TITLE } from "./seo";

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

describe("routeMeta", () => {
  const publicPaths = ["/compliance", "/sme", "/trade", "/resources", "/news", "/cookies", "/privacy", "/terms"];

  it("gives each public page without its own head tags a distinct title and description", () => {
    const metas = publicPaths.map((p) => routeMeta(p));
    metas.forEach((m) => expect(m).not.toBeNull());
    expect(new Set(metas.map((m) => m!.title)).size).toBe(publicPaths.length);
    expect(new Set(metas.map((m) => m!.description)).size).toBe(publicPaths.length);
    metas.forEach((m) => expect(m!.description).not.toBe(SITE_DESCRIPTION));
  });

  it("matches with a trailing slash or query string", () => {
    expect(routeMeta("/compliance/?utm_source=fb")?.vertical).toBe("compliance");
  });

  it("keeps the account dashboard out of search results but not public pages", () => {
    expect(routeMeta("/dashboard")?.noindex).toBe(true);
    expect(routeMeta("/news")?.noindex).toBeFalsy();
  });

  it("returns null for pages that set their own tags", () => {
    expect(routeMeta("/article/abc")).toBeNull();
  });
});

describe("metaDescription", () => {
  it("strips Markdown and cuts long text near 155 characters at a word", () => {
    const text = "## Heading\n\n**Bold** words and a [link](https://x.y) " + "lorem ipsum dolor ".repeat(20);
    const d = metaDescription(text, "fallback");
    expect(d.startsWith("Heading Bold words and a link")).toBe(true);
    expect(d.length).toBeLessThanOrEqual(156);
    expect(d.endsWith("…")).toBe(true);
  });

  it("uses the fallback when there is no text", () => {
    expect(metaDescription("  ", "fallback")).toBe("fallback");
    expect(metaDescription(null, "fallback")).toBe("fallback");
  });
});
