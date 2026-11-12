import { describe, expect, it } from "vitest";
import { blendNews, newsSource, type BlendableNews } from "@/lib/blendNews";

const article = (id: string, source: string, hour: number, vertical = "compliance", day = "2026-11-07"): BlendableNews => ({
  id, title: `Story ${id}`, source_id: `${source}:${id}story`, vertical,
  published_at: `${day}T${String(hour).padStart(2, "0")}:00:00Z`,
});

describe("blendNews", () => {
  it("treats every story from one scraped source as the same publisher", () => {
    expect(newsSource(article("a", "icpac", 2))).toBe("icpac");
    expect(newsSource(article("b", "icpac", 3))).toBe(newsSource(article("c", "icpac", 4)));
  });
  it("breaks up a consecutive scraping batch while keeping the newest lead", () => {
    const result = blendNews([article("a", "esma", 12), article("b", "esma", 11), article("c", "esma", 10), article("d", "pio", 9, "general"), article("e", "rif", 8, "fintech")]);
    expect(result.map(a => a.id)).toEqual(["a", "d", "e", "b", "c"]);
  });
  it("mixes a batch of ten ICPAC circulars with the previous evening's stories", () => {
    const icpac = Array.from({ length: 10 }, (_, i) => article(`i${i}`, "icpac", 2, "compliance", "2026-11-12"));
    const others = [article("eu", "eu-commission", 22, "compliance", "2026-11-11"), article("cbc", "cbc", 21, "compliance", "2026-11-11"), article("ec", "ec-digital", 20, "regtech", "2026-11-11"), article("ecb", "ecb", 16, "fintech", "2026-11-11")];
    const top5 = blendNews([...icpac, ...others]).slice(0, 5).map(newsSource);
    expect(top5[0]).toBe("icpac");
    expect(top5.filter(s => s === "icpac").length).toBeLessThanOrEqual(2);
  });
  it("never moves a story more than 24 hours ahead of a newer one", () => {
    expect(blendNews([article("a", "esma", 12), article("b", "esma", 11), article("c", "pio", 10, "general", "2026-11-06")]).map(a => a.id)).toEqual(["a", "b", "c"]);
  });
  it("alternates sources even when all stories share the same topic", () => {
    expect(blendNews([article("a", "esma", 12), article("b", "esma", 11), article("c", "cysec", 10)]).map(a => a.id)).toEqual(["a", "c", "b"]);
  });
  it("deduplicates same-source titles before splitting hub and feed", () => {
    const input = Array.from({ length: 20 }, (_, i) => article(String(i), i % 2 ? "pio" : "esma", 23 - i));
    const result = blendNews([...input, { ...input[0], id: "duplicate" }]);
    expect(result).toHaveLength(20);
    const leadIds = new Set(result.slice(0, 5).map(a => a.id));
    expect(result.slice(5, 17).some(a => leadIds.has(a.id))).toBe(false);
  });
  it("keeps every story when only one source is available and is deterministic", () => {
    const input = [article("a", "esma", 12), article("b", "esma", 11)];
    expect(blendNews(input).map(a => a.id)).toEqual(["a", "b"]);
    expect(blendNews([...input].reverse())).toEqual(blendNews(input));
  });
});
