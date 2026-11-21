import { describe, it, expect } from "vitest";
import { buildIntlHome, storyMarket, type IntlStory } from "@/lib/internationalHome";

let n = 0;
const story = (p: Partial<IntlStory>): IntlStory => ({
  id: `s${++n}`, title: `Story ${n}`, summary: null, published_at: new Date(Date.UTC(2026, 10, 20, 12, 0) - n * 60_000).toISOString(),
  image_url: "https://example.com/p.jpg", vertical: "general", tags: [], edition: ["cy"], greece_related: false, gr_section: null, cross_border_note: null, ...p,
});

describe("International homepage selection", () => {
  it("files each story by its own edition", () => {
    expect(storyMarket(story({ edition: ["gr"], title: "Eurobank results" }))).toBe("gr");
    expect(storyMarket(story({ title: "Cyprus inflation eases" }))).toBe("cy");
    expect(storyMarket(story({ title: "ECB holds rates" }))).toBe("intl");
  });

  it("shows every story once across the page", () => {
    const rows = Array.from({ length: 60 }, (_, i) => story({ title: `Bank payments regulation deal ${i} in Cyprus and Greece` }));
    const h = buildIntlHome(rows);
    const ids = [h.lead!, ...h.latest, ...h.more, ...h.brief, ...h.companies, ...h.fintech, ...h.compliance].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("leaves out stories with only a Greek headline", () => {
    const greek = story({ title: "Αποτελέσματα της Eurobank", edition: ["gr"] });
    const h = buildIntlHome([greek, story({ title: "ECB holds rates" })]);
    expect([h.lead, ...h.latest].map((s) => s?.id)).not.toContain(greek.id);
  });

  it("mixes markets in the top stories instead of one edition filling them", () => {
    const cy = Array.from({ length: 8 }, (_, i) => story({ title: `Cyprus story ${i}` }));
    const gr = story({ title: "Piraeus Bank results", edition: ["gr"] });
    const intl = story({ title: "ECB holds rates" });
    const h = buildIntlHome([...cy, gr, intl]);
    const top = [h.lead!, ...h.latest].map((s) => s.id);
    expect(top).toContain(gr.id);
    expect(top).toContain(intl.id);
  });

  it("puts an editor highlight in the lead", () => {
    const now = new Date(Date.UTC(2026, 10, 21, 8));
    const pinned = story({ title: "Highlighted story", featured_until: new Date(now.getTime() + 3600_000).toISOString(), image_url: null });
    const h = buildIntlHome([story({ title: "ECB holds rates" }), pinned], { now });
    expect(h.lead?.id).toBe(pinned.id);
  });

  it("the Greece–Cyprus brief takes Cyprus stories marked Greece-related", () => {
    const filler = Array.from({ length: 12 }, (_, i) => story({ title: `Cyprus filler ${i}` }));
    const related = story({ title: "Bank of Cyprus opens Athens desk", greece_related: true, published_at: "2026-01-01T00:00:00Z" });
    const h = buildIntlHome([...filler, related]);
    expect(h.brief.map((s) => s.id)).toContain(related.id);
  });
});
