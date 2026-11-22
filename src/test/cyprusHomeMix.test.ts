import { describe, expect, it } from "vitest";
import { cyprusHomeMix } from "@/lib/editionMix";
import { isInternationalStory } from "@/lib/storyOrigin";

const rows = (prefix: string, title: string, n: number, edition: string[]) =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, title, summary: null, what_happened: null, tags: [], edition, published_at: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString() }));

describe("Cyprus homepage mix", () => {
  it("is 60% Cyprus, 25% International, 15% Greece", () => {
    const cy = [...rows("cy", "Limassol port expands", 200, ["cy"]), ...rows("in", "ECB holds rates in Frankfurt", 200, ["cy"])];
    const gr = rows("gr", "Athens bourse rallies", 100, ["gr"]);
    const out = cyprusHomeMix(cy, gr, 120);
    const n = (p: string) => out.filter((r) => r.id.startsWith(p)).length;
    expect(out.length).toBe(120);
    expect([n("cy"), n("in"), n("gr")]).toEqual([72, 30, 18]);
    const top = out.slice(0, 20);
    expect([top.filter((r) => r.id.startsWith("cy")).length, top.filter((r) => r.id.startsWith("in")).length, top.filter((r) => r.id.startsWith("gr")).length]).toEqual([12, 5, 3]);
    expect(out.filter((r) => r.id.startsWith("cy")).every((r) => !isInternationalStory(r))).toBe(true);
  });
});
