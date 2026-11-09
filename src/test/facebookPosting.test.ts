import { describe, it, expect } from "vitest";
import { postsThisRun, pickArticles, countPostedToday, articleLink, type CandidateArticle } from "../../supabase/functions/_shared/facebookPosting";

const art = (id: string, published_at: string, vertical = "general", source_id = "s1"): CandidateArticle => ({
  id, title: `Story ${id}`, summary: "x", what_happened: null, vertical, source_id, published_at,
});

describe("daily limit of 20 posts", () => {
  // 08:00 Cyprus time (UTC+2 in November)
  const morning = new Date("2026-11-09T06:00:00Z");
  it("never posts once 20 are already out today", () => expect(postsThisRun(20, 20, morning)).toBe(0));
  it("never goes over the remaining allowance", () => expect(postsThisRun(20, 19, new Date("2026-11-09T19:30:00Z"))).toBe(1));
  it("spreads posts over the day instead of all at once", () => expect(postsThisRun(20, 0, morning)).toBeLessThan(5));
  it("the last run of the day can use what is left", () => expect(postsThisRun(20, 15, new Date("2026-11-09T19:45:00Z"))).toBe(5));
  it("counts today by Cyprus date, not UTC", () => {
    // 23:30 UTC on the 8th is already 01:30 on the 9th in Cyprus
    expect(countPostedToday(["2026-11-08T23:30:00Z", "2026-11-08T21:00:00Z"], morning)).toBe(1);
  });
});

describe("story selection", () => {
  it("never posts the same story twice", () => {
    const picked = pickArticles([art("a", "2026-11-09T05:00:00Z"), art("b", "2026-11-09T04:00:00Z")], new Set(["a"]), 5);
    expect(picked.map((p) => p.id)).toEqual(["b"]);
  });
  it("mixes sections before repeating one", () => {
    const picked = pickArticles([
      art("1", "2026-11-09T05:00:00Z", "general", "s1"),
      art("2", "2026-11-09T04:59:00Z", "general", "s1"),
      art("3", "2026-11-09T04:00:00Z", "fintech", "s2"),
    ], new Set(), 2);
    expect(picked.map((p) => p.id)).toEqual(["1", "3"]);
  });
  it("links to the article on businesshub.cy", () => expect(articleLink("abc")).toBe("https://businesshub.cy/article/abc"));
});
