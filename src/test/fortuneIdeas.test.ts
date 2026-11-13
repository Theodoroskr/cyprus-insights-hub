import { describe, expect, it } from "vitest";
import { partitionHomepage, pickStoryPackage, isPackageTopic, PACKAGE_MIN, type HomeStory } from "@/lib/homepageStories";
import { rankShares, yearOnYear, inNewsHref, yearsSince } from "@/lib/rankings";
import { PRIMARY_NAV, visibleMenuSections } from "@/config/siteSections";

const story = (id: string, hoursAgo: number, tags: string[] = []): HomeStory => ({
  id, title: `Story ${id}`, vertical: "general", tags, source_id: `pub${Number(id.slice(1)) % 3}:${id}`,
  published_at: new Date(Date.UTC(2026, 10, 13, 12) - hoursAgo * 3600_000).toISOString(),
});

describe("homepage blocks", () => {
  const pool = Array.from({ length: 30 }, (_, i) => story(`s${String(i).padStart(2, "0")}`, i));

  it("never shows the same story twice across lead, Latest, package and feed", () => {
    const withTopic = pool.map((s, i) => (i >= 10 && i < 14 ? { ...s, tags: ["Sanctions"] } : s));
    const { hub, latest, pkg, feed } = partitionHomepage(withTopic);
    const all = [...hub, ...latest, ...(pkg?.stories ?? []), ...feed].map((s) => s.id);
    expect(new Set(all).size).toBe(all.length);
    expect(hub).toHaveLength(4);
    expect(latest).toHaveLength(6);
    expect(pkg?.label).toBe("Sanctions");
  });

  it("lists the Latest column newest first", () => {
    const shuffled = [pool[0], pool[1], pool[2], pool[3], pool[9], pool[5], pool[7], pool[4], pool[8], pool[6]];
    const { latest } = partitionHomepage(shuffled);
    const times = latest.map((s) => new Date(s.published_at).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("needs at least three unseen stories to make a package", () => {
    const two = pool.map((s, i) => (i >= 10 && i < 12 ? { ...s, tags: ["Sanctions"] } : s));
    expect(PACKAGE_MIN).toBe(3);
    expect(partitionHomepage(two).pkg).toBeNull();
  });

  it("prefers a company over a topic with the same number of stories", () => {
    const ids = ["s10", "s11", "s12"];
    const tagged = pool.map((s) => (ids.includes(s.id) ? { ...s, tags: ["ESG"] } : s));
    const links = ids.map((id) => ({ article_id: id, entity_id: "cysec", entity_label: "CySEC", href: "/directory/company/cysec" }));
    const pkg = pickStoryPackage(tagged, links, new Set());
    expect(pkg?.kind).toBe("company");
    expect(pkg?.href).toBe("/directory/company/cysec");
  });

  it("does not make a topic package from one publisher's stories", () => {
    const one = pool.map((s, i) => (i >= 10 && i < 14 ? { ...s, tags: ["ICPAC"], source_id: `icpac:${s.id}` } : s));
    expect(partitionHomepage(one).pkg).toBeNull();
  });

  it("ignores stories older than 72 hours before the newest story", () => {
    const old = pool.map((s, i) => (i < 3 ? s : { ...story(s.id, 80 + i), tags: ["Sanctions"] }));
    expect(pickStoryPackage(old, [], new Set())).toBeNull();
  });

  it("does not treat publisher labels or broad tags as topics", () => {
    expect(isPackageTopic("pio-gov-cy")).toBe(false);
    expect(isPackageTopic("Cyprus")).toBe(false);
    expect(isPackageTopic("Compliance")).toBe(false);
    expect(isPackageTopic("EU Funding")).toBe(true);
  });
});

describe("rankings", () => {
  it("ranks shares by today's change, biggest rise first, skipping unpriced shares", () => {
    const ranked = rankShares([
      { symbol: "BOCH", name: "Bank of Cyprus", value: 10.88, change_pct: -0.37, updated_at: "" },
      { symbol: "DEM", name: "Demetra", value: 1.32, change_pct: 0.38, updated_at: "" },
      { symbol: "X", name: "Unpriced", value: 0, change_pct: 5, updated_at: "" },
    ]);
    expect(ranked.map((s) => s.symbol)).toEqual(["DEM", "BOCH"]);
  });

  it("shows a year-on-year change only when both years have all 12 months", () => {
    expect(yearOnYear({ last12: 6267, prev12: 5497, months12: 12, months_prev: 12 })).toBe(14);
    expect(yearOnYear({ last12: 6267, prev12: 5497, months12: 11, months_prev: 12 })).toBeNull();
  });

  it("links a company to its registry profile first", () => {
    expect(inNewsHref({ directory_slug: "central-bank-of-cyprus", company_slug: "cbc" })).toBe("/directory/company/central-bank-of-cyprus");
    expect(inNewsHref({ directory_slug: null, company_slug: "cbc" })).toBe("/companies/cbc");
  });

  it("counts whole years since registration", () => {
    expect(yearsSince("1927-04-29", new Date("2026-11-13"))).toBe(99);
    expect(yearsSince("1927-12-01", new Date("2026-11-13"))).toBe(98);
  });
});

describe("top menu", () => {
  it("shows nine main links, including Rankings", () => {
    expect(PRIMARY_NAV).toHaveLength(10);
    expect(PRIMARY_NAV.map((i) => i.href)).toContain("/rankings");
  });

  it("lists every main link behind the Menu button too", () => {
    const menu = visibleMenuSections(false).flatMap((s) => s.links.map((l) => l.href));
    for (const item of PRIMARY_NAV) expect(menu).toContain(item.href);
  });

  it("keeps Who's Who out of the menu until it launches", () => {
    const menu = visibleMenuSections(false).flatMap((s) => s.links.map((l) => l.href));
    expect(menu).not.toContain("/whoiswho");
  });
});
