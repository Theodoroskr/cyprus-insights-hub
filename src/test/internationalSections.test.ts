import { describe, it, expect } from "vitest";
import { briefStories, latestByMarket, marketCounts, sectionStories, SECTION_RULES, isIntlSection } from "@/lib/internationalSections";
import type { IntlStory } from "@/lib/internationalHome";

let n = 0;
const story = (p: Partial<IntlStory>): IntlStory => ({
  id: `s${++n}`, title: `Story ${n}`, summary: null, published_at: new Date(Date.UTC(2026, 10, 20, 12, 0) - n * 60_000).toISOString(),
  image_url: null, vertical: "general", tags: [], edition: ["cy"], greece_related: false, gr_section: null, cross_border_note: null, ...p,
});

describe("International section pages", () => {
  it("knows the six sections and nothing else", () => {
    for (const s of ["markets", "companies", "fintech", "compliance", "funding", "data"]) expect(isIntlSection(s)).toBe(true);
    expect(isIntlSection("energy")).toBe(false);
  });

  it("a section lists only its own stories, newest first", () => {
    const old = story({ title: "Cyprus EMI licence for stablecoin issuer", published_at: "2026-11-01T00:00:00Z" });
    const recent = story({ title: "Banks roll out instant payments", published_at: "2026-11-19T00:00:00Z" });
    const other = story({ title: "Hotel occupancy rises in Limassol" });
    expect(sectionStories([old, other, recent], "fintech").map((s) => s.id)).toEqual([recent.id, old.id]);
  });

  it("the market filter keeps one market and the counts add up", () => {
    const gr = story({ title: "Piraeus Bank launches instant payments app", edition: ["gr"] });
    const cy = story({ title: "Cyprus fintech gets e-money licence" });
    const intl = story({ title: "ECB pushes digital euro" });
    expect(sectionStories([gr, cy, intl], "fintech", "gr").map((s) => s.id)).toEqual([gr.id]);
    expect(marketCounts([gr, cy, intl], "fintech")).toEqual({ all: 3, intl: 1, gr: 1, cy: 1 });
  });

  it("a story filed twice under the same headline shows once", () => {
    const a = story({ title: "Sanctions update: EU adds 20 names" });
    const b = story({ title: "Sanctions update — EU adds 20 names" });
    expect(sectionStories([a, b], "compliance")).toHaveLength(1);
  });

  it("an editor highlight stays first in its section", () => {
    const now = new Date(Date.UTC(2026, 10, 21, 8));
    const newer = story({ title: "Cyber attack hits retailer", published_at: "2026-11-21T07:00:00Z" });
    const pinned = story({ title: "AML rules tighten for crypto firms", published_at: "2026-11-10T00:00:00Z", featured_until: "2026-11-22T00:00:00Z" });
    expect(sectionStories([newer, pinned], "compliance", "all", now)[0].id).toBe(pinned.id);
  });

  it("fintech leaves out balance-of-payments figures and EU democracy items tagged RegTech", () => {
    expect(SECTION_RULES.fintech(story({ title: "Balance of Payments: September 2026", summary: "The current account deficit widened.", tags: ["Payments & FinTech"] }))).toBe(false);
    expect(SECTION_RULES.fintech(story({ title: "European Citizens' Panel to deliver recommendations for strengthening EU democracy", tags: ["RegTech"] }))).toBe(false);
  });

  it("funding takes grants and calls, not a company raising money", () => {
    expect(SECTION_RULES.funding(story({ title: "New grant scheme for SME digitalisation opens" }))).toBe(true);
    expect(SECTION_RULES.funding(story({ title: "Research and Innovation Foundation opens call for proposals" }))).toBe(true);
    expect(SECTION_RULES.funding(story({ title: "Avenia raises $25 million in Series A funding" }))).toBe(false);
  });

  it("Markets shows each market's own newest stories", () => {
    const rows = [story({ title: "Eurobank results", edition: ["gr"] }), story({ title: "ECB holds rates" }), story({ title: "Cyprus inflation eases" }), story({ title: "Cyprus tourism record" })];
    const m = latestByMarket(rows, 1);
    expect(m.gr[0].title).toBe("Eurobank results");
    expect(m.intl[0].title).toBe("ECB holds rates");
    expect(m.cy[0].title).toBe("Cyprus inflation eases");
  });

  it("Markets columns skip EU payment-request paperwork and repeats of one headline series", () => {
    const rows = [
      story({ title: "Commission greenlights Poland's final payment request for €12.7 billion" }),
      story({ title: "Commission approves Ireland state aid scheme" }),
      story({ title: "Commission approves Malta state aid scheme" }),
      story({ title: "ECB holds rates" }),
    ];
    expect(latestByMarket(rows, 5).intl.map((s) => s.title)).toEqual(["Commission approves Ireland state aid scheme", "ECB holds rates"]);
  });

  it("the Markets brief needs both countries and a business subject", () => {
    const yes = story({ title: "Greek and Cypriot firms sign energy trade deal" });
    const no = story({ title: "Cyprus inflation eases", greece_related: true });
    expect(briefStories([yes, no], 5).map((s) => s.id)).toEqual([yes.id]);
  });
});
