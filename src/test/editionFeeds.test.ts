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
