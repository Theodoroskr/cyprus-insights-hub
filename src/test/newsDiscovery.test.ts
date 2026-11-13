import { describe, expect, it } from "vitest";
import { buildNewsSitemap, recentNews } from "@/lib/sitemap";
import { releaseDraft, releaseProblem } from "@/lib/ministryRelease";

const now = Date.parse("2026-11-13T12:00:00Z");
const base = { url: "https://www.gov.cy/tourism/en/news/x/", sourceHeadline: "Grant scheme", sourceDate: "2026-11-10", topic: "Grants & deadlines", language: "en" as const, headline: "H", summary: "S", whatChanged: "", whoAffected: "", action: "" };

describe("news sitemap", () => {
  it("keeps only stories from the last 48 hours", () => {
    const rows = [{ published_at: "2026-11-12T00:00:00Z" }, { published_at: "2026-11-10T00:00:00Z" }, { published_at: null }];
    expect(recentNews(rows, now)).toHaveLength(1);
  });
  it("names the publication BusinessHub.cy", () => {
    expect(buildNewsSitemap([{ path: "/article/1", title: "A & B", publishedAt: "2026-11-12T00:00:00Z", language: "en" }])).toContain("<news:name>BusinessHub.cy</news:name>");
  });
});

describe("Ministry release intake", () => {
  it("saves as an unpublished draft", () => {
    const d = releaseDraft(base, null);
    expect(d.status).toBe("draft");
    expect(d.published_at).toBeNull();
  });
  it("keeps the Ministry date separate from our publish date", () => {
    expect(releaseDraft(base, null).body_markdown).toContain("2026-11-10");
  });
  it("rejects links that are not the Ministry's site", () => {
    expect(releaseProblem({ ...base, url: "https://example.com/x" })).not.toBeNull();
  });
});
