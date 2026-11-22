import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RSS_FEED_GROUPS, RSS_FEED_LINKS } from "@/lib/rss";

const PUBLIC_DIR = resolve(__dirname, "../../public");

describe("footer RSS directory", () => {
  it("advertises each feed exactly once", () => {
    const paths = RSS_FEED_LINKS.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("points only at feed files the site actually publishes", () => {
    for (const feed of RSS_FEED_LINKS) {
      expect(existsSync(resolve(PUBLIC_DIR, feed.path.replace(/^\//, ""))), feed.path).toBe(true);
    }
  });

  it("lists every feed file the site writes", () => {
    const advertised = new Set(RSS_FEED_LINKS.map((f) => f.path));
    const onDisk = [
      "/rss.xml",
      ...readdirSync(resolve(PUBLIC_DIR, "rss"))
        .filter((f) => f.endsWith(".xml"))
        .map((f) => `/rss/${f}`),
    ];
    expect(onDisk.filter((p) => !advertised.has(p))).toEqual([]);
  });

  it("offers all three editions and the whole site", () => {
    const paths = RSS_FEED_LINKS.map((f) => f.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/rss/cyprus.xml",
        "/rss/greece.xml",
        "/rss/international.xml",
        "/rss.xml",
      ]),
    );
  });

  it("gives every group a title, a one-line explanation and at least one feed", () => {
    for (const group of RSS_FEED_GROUPS) {
      expect(group.title.length).toBeGreaterThan(0);
      expect(group.blurb.length).toBeGreaterThan(0);
      expect(group.feeds.length).toBeGreaterThan(0);
    }
  });
});
