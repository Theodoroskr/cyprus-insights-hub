import { describe, expect, it } from "vitest";
import { buildRssFeed, newsToItem, plainSummary, selectItems, storyToItem, RSS_ITEM_LIMIT } from "./rss";

const news = (id: string, published_at: string | null, extra: Partial<Parameters<typeof newsToItem>[0]> = {}) => ({
  id,
  title: `Story ${id}`,
  summary: "Short summary",
  what_happened: null,
  image_url: null,
  vertical: "fintech",
  published_at,
  ...extra,
});

describe("rss", () => {
  it("links every story to businesshub.cy", () => {
    const xml = buildRssFeed(
      { title: "T", description: "D", selfPath: "/rss.xml" },
      selectItems([newsToItem(news("a1", "2026-11-09T10:00:00Z"))]),
    );
    const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
    expect(links).toContain("https://businesshub.cy/article/a1");
    expect(links.every((l) => l.startsWith("https://businesshub.cy/"))).toBe(true);
  });

  it("puts the newest story first and keeps at most 50", () => {
    const rows = Array.from({ length: 60 }, (_, i) => newsToItem(news(`n${i}`, new Date(Date.UTC(2026, 9, 1 + i)).toISOString())));
    const items = selectItems(rows);
    expect(RSS_ITEM_LIMIT).toBe(50);
    expect(items.length).toBe(50);
    expect(items[0].path).toBe("/article/n59");
  });

  it("leaves out stories with no publication date", () => {
    expect(newsToItem(news("x", null))).toBeNull();
  });

  it("sends interviews to /interviews and other stories to /news", () => {
    const base = { title: "T", excerpt: "E", cover_image: null, published_at: "2026-11-01T00:00:00Z" };
    expect(storyToItem({ ...base, slug: "a", article_type: "interview" })?.path).toBe("/interviews/a");
    expect(storyToItem({ ...base, slug: "b", article_type: "article" })?.path).toBe("/news/b");
  });

  it("escapes special characters so the feed stays valid", () => {
    const xml = buildRssFeed(
      { title: "T", description: "D", selfPath: "/rss.xml" },
      selectItems([newsToItem(news("e", "2026-11-09T10:00:00Z", { title: "Bank & <Co>" }))]),
    );
    expect(xml).toContain("<title>Bank &amp; &lt;Co&gt;</title>");
  });

  it("shortens summaries to 300 characters", () => {
    expect(plainSummary("word ".repeat(200)).length).toBeLessThanOrEqual(301);
  });
});
