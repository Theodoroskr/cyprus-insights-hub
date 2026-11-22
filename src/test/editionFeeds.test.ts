import { describe, expect, it } from "vitest";
import { inEditionFeed } from "@/lib/rss";
const row = (title: string, edition = ["cy"]) => ({ id: "1", title, summary: null, what_happened: null, image_url: null, vertical: null, published_at: "2026-11-01", tags: [], edition });
describe("edition RSS feeds", () => {
  it("puts a Cyprus story only in the Cyprus feed", () => {
    const r = row("Limassol port expands");
    expect(inEditionFeed(r, "cyprus")).toBe(true);
    expect(inEditionFeed(r, "international")).toBe(false);
  });
  it("puts an international story only in the International feed", () => {
    const r = row("ECB holds rates in Frankfurt");
    expect(inEditionFeed(r, "international")).toBe(true);
    expect(inEditionFeed(r, "cyprus")).toBe(false);
  });
  it("keeps Greece stories out of the International feed", () => {
    expect(inEditionFeed(row("Athens bourse rallies"), "international")).toBe(false);
    expect(inEditionFeed(row("Bank merger", ["cy", "gr"]), "international")).toBe(false);
  });
});

import { EDITION_MIX, mixFeed } from "@/lib/rss";
const items = (tag: string, n: number) => Array.from({ length: n }, (_, i) => ({ title: tag, path: `/${tag}/${i}`, description: "", publishedAt: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString() }));
const count = (feed: { path: string }[], tag: string) => feed.filter((i) => i.path.startsWith(`/${tag}/`)).length;
describe("edition mix in a 50-story feed", () => {
  it("International carries 15% Greece and 10% Cyprus", () => {
    const f = mixFeed(items("intl", 80), [{ items: items("gr", 80), share: EDITION_MIX.international.greece }, { items: items("cy", 80), share: EDITION_MIX.international.cyprus }]);
    expect([f.length, count(f, "gr"), count(f, "cy"), count(f, "intl")]).toEqual([50, 8, 5, 37]);
  });
  it("Greece carries 25% International and 10% Cyprus", () => {
    const f = mixFeed(items("gr", 80), [{ items: items("intl", 80), share: EDITION_MIX.greece.international }, { items: items("cy", 80), share: EDITION_MIX.greece.cyprus }]);
    expect([count(f, "intl"), count(f, "cy"), count(f, "gr")]).toEqual([13, 5, 32]);
  });
  it("Cyprus carries 20% Greece and 20% International", () => {
    const f = mixFeed(items("cy", 80), [{ items: items("gr", 80), share: EDITION_MIX.cyprus.greece }, { items: items("intl", 80), share: EDITION_MIX.cyprus.international }]);
    expect([count(f, "gr"), count(f, "intl"), count(f, "cy")]).toEqual([10, 10, 30]);
  });
  it("tops up from the edition's own stories when another edition is short", () => {
    const f = mixFeed(items("cy", 80), [{ items: items("gr", 3), share: 0.2 }]);
    expect([f.length, count(f, "gr")]).toEqual([50, 3]);
  });
});
