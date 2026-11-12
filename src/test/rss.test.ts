import { describe, it, expect } from "vitest";
import { buildRssFeed } from "@/lib/rss";

const meta = { title: "t", description: "d", selfPath: "/rss.xml" };
const item = { title: "A", path: "/article/1", description: "x", publishedAt: "2026-11-12T10:00:00Z" };

describe("rss images", () => {
  it("gives a story without a photo its hub picture", () => {
    const xml = buildRssFeed(meta, [{ ...item, category: "Compliance", imageUrl: null }], "https://businesshub.cy");
    expect(xml).toContain('media:content url="https://businesshub.cy/images/og-compliancehub.png"');
    expect(xml).toContain('<enclosure url="https://businesshub.cy/images/og-compliancehub.png"');
  });
  it("keeps a story's own photo", () => {
    const xml = buildRssFeed(meta, [{ ...item, imageUrl: "https://x.cy/p.jpg" }], "https://businesshub.cy");
    expect(xml).toContain('<enclosure url="https://x.cy/p.jpg" type="image/jpeg"');
  });
});
