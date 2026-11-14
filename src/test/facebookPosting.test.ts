import { describe, it, expect } from "vitest";
import { postsThisRun, pickArticles, countPostedToday, articleLink, postImageFor, libraryImageFor, SOCIAL_IMAGE_LIBRARY, buildPhotoCaption, type CandidateArticle } from "../../supabase/functions/_shared/facebookPosting";

const art = (id: string, published_at: string, vertical = "general", source_id = "s1"): CandidateArticle => ({
  id, title: `Story ${id}`, summary: "x", what_happened: null, vertical, source_id, published_at,
});

describe("daily limit of 20 posts", () => {
  // 08:00 Cyprus time (UTC+2 in November)
  const morning = new Date("2026-11-09T06:00:00Z");
  it("never posts once 20 are already out today", () => expect(postsThisRun(20, 20, morning)).toBe(0));
  it("never goes over the remaining allowance", () => expect(postsThisRun(20, 19, new Date("2026-11-09T19:30:00Z"))).toBe(1));
  it("spreads posts over the day instead of all at once", () => expect(postsThisRun(20, 0, morning)).toBeLessThan(5));
  it("never posts more than 3 in one hour, even late in the day", () => expect(postsThisRun(20, 0, new Date("2026-11-09T19:45:00Z"))).toBe(3));
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
  it("treats stories from one publisher as the same source (oecd:a and oecd:b)", () => {
    const picked = pickArticles([
      art("1", "2026-11-14T10:00:00Z", "sme", "oecd:unemployment"),
      art("2", "2026-11-14T09:59:00Z", "energy", "oecd:inflation"),
      art("3", "2026-11-14T09:00:00Z", "fintech", "cbc:rates"),
    ], new Set(), 2);
    expect(picked.map((p) => p.id)).toEqual(["1", "3"]);
  });
  it("prefers a section not already posted today", () => {
    const today = [art("t", "2026-11-14T08:00:00Z", "general", "philenews:x")];
    const picked = pickArticles([
      art("1", "2026-11-14T10:00:00Z", "general", "cyprus-mail:a"),
      art("2", "2026-11-14T09:00:00Z", "compliance", "cysec:b"),
    ], new Set(), 1, [], today);
    expect(picked.map((p) => p.id)).toEqual(["2"]);
  });
  it("never posts a picture already used today", () => {
    const img = "https://www.oecd.org/fallback.png";
    const today = [{ ...art("t", "2026-11-14T08:00:00Z", "sme", "oecd:x"), image_url: img }];
    const picked = pickArticles([{ ...art("1", "2026-11-14T10:00:00Z", "energy", "eu:y"), image_url: img }], new Set(), 1, [], today);
    expect(picked).toHaveLength(0);
  });
  it("links to the article on businesshub.cy", () => expect(articleLink("abc")).toBe("https://businesshub.cy/article/abc"));
});

describe("post picture", () => {
  it("uses the story's own photo when it has one", () =>
    expect(postImageFor({ ...art("p", "2026-11-09T05:00:00Z"), image_url: "https://example.com/a.jpg" })).toBe("https://example.com/a.jpg"));
  it("uses a compliance library picture when a compliance story has no photo", () =>
    expect(SOCIAL_IMAGE_LIBRARY.compliance).toContain(postImageFor({ ...art("p", "2026-11-09T05:00:00Z", "compliance"), image_url: null })));
  it("does not repeat a library picture until the section's others have been used", () => {
    const pool = SOCIAL_IMAGE_LIBRARY.fintech;
    const used: string[] = [];
    for (let i = 0; i < pool.length; i++) used.unshift(libraryImageFor("fintech", used));
    expect(new Set(used).size).toBe(pool.length);
  });
  it("after the whole library is used, picks the picture used longest ago", () => {
    const pool = SOCIAL_IMAGE_LIBRARY.sme;
    const newestFirst = [pool[1], pool[3], pool[0], pool[2]];
    expect(libraryImageFor("sme", newestFirst)).toBe(pool[2]);
  });
  it("each section has at least 4 pictures", () => {
    for (const s of ["general", "fintech", "compliance", "regtech", "sme"]) expect(SOCIAL_IMAGE_LIBRARY[s].length).toBeGreaterThanOrEqual(4);
  });
  it("caption ends with a link to the article", () =>
    expect(buildPhotoCaption(art("xyz", "2026-11-09T05:00:00Z"))).toMatch(/Read more: https:\/\/businesshub\.cy\/article\/xyz$/));
});

import { isSameHeadline } from "../../supabase/functions/_shared/facebookPosting";
describe("same story from two sources", () => {
  it("treats the Moldova release from two EU sites as one story", () => {
    expect(isSameHeadline(
      "High-Level Platform meets in Moldova to strengthen digital connectivity between the EU and Central Asia",
      "High-Level Platform meets in Moldova to strengthen digital connectivity between the EU, the Black Sea region, South-Caucasus and Central Asia",
    )).toBe(true);
  });
  it("keeps different days and different countries apart", () => {
    expect(isSameHeadline("Daily news - Nov 12, 2026", "Daily news - Nov 11, 2026")).toBe(false);
    expect(isSameHeadline("Commission greenlights Luxembourg's final payment request for €80 million", "Commission greenlights Estonia's final payment request for €80 million")).toBe(false);
  });
  it("skips a candidate whose headline was already posted", () => {
    const a = { id: "x", title: "Monetary policy decisions", summary: null, what_happened: null, vertical: "general", source_id: "ecb", published_at: "2026-11-14T08:00:00Z" };
    expect(pickArticles([a], new Set(), 3, ["Monetary policy decisions"])).toHaveLength(0);
  });
});
