import { describe, it, expect } from "vitest";
import { BLOCK_RULES, buildIntlHome, storyMarket, type IntlStory } from "@/lib/internationalHome";

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

describe("International homepage topic rules", () => {
  it("fintech ignores a plain dividend or EU-fund payment", () => {
    expect(BLOCK_RULES.fintech(story({ title: "Distribution of non-mandatory reserves", summary: "Interim dividend scheduled for payment in late November.", vertical: "fintech" }))).toBe(false);
    expect(BLOCK_RULES.fintech(story({ title: "Daily news", summary: "Commission approves Cyprus recovery payment." }))).toBe(false);
  });

  it("fintech takes stablecoin and instant-payment stories", () => {
    expect(BLOCK_RULES.fintech(story({ title: "MoonPay applies for bank charter to expand stablecoin services" }))).toBe(true);
    expect(BLOCK_RULES.fintech(story({ title: "Banks roll out instant payments" }))).toBe(true);
  });

  it("compliance needs a compliance subject, not just a regulator's name", () => {
    expect(BLOCK_RULES.compliance(story({ title: "Resignation (Engineer)", summary: "Resigned from the Cyprus Energy Regulatory Authority." }))).toBe(false);
    expect(BLOCK_RULES.compliance(story({ title: "Regulator publishes annual calendar", summary: "Supervisory dates for 2027." }))).toBe(false);
    expect(BLOCK_RULES.compliance(story({ title: "NCA urges security updates for Java vulnerability" }))).toBe(true);
  });

  it("routine voting-rights notices stay out of compliance", () => {
    expect(BLOCK_RULES.compliance(story({ title: "Notification of important changes concerning voting rights", summary: "Filed in compliance with L.3556/2007." }))).toBe(false);
  });

  it("the Greece–Cyprus brief leaves out political briefings and EU payment approvals", () => {
    expect(BLOCK_RULES.brief(story({ title: "Government Spokesman – Meeting with journalists", summary: "Cyprus spokesman briefed journalists in Thessaloniki on business ties.", greece_related: true }))).toBe(false);
    expect(BLOCK_RULES.brief(story({ title: "Commission greenlights Greece's final payment requests", summary: "Cyprus and Greece investment milestones.", greece_related: true }))).toBe(false);
  });

  it("the Greece–Cyprus brief needs both countries named, not only the Greece-related label", () => {
    expect(BLOCK_RULES.brief(story({ title: "Avenia raises $25 million for stablecoin infrastructure", summary: "Global fintech funding.", greece_related: true }))).toBe(false);
    expect(BLOCK_RULES.brief(story({ title: "Greek and Cypriot firms sign energy trade deal", summary: "Athens and Nicosia companies agree." }))).toBe(true);
  });

  it("a crypto expansion story goes to Fintech, not Companies & Investment", () => {
    const filler = Array.from({ length: 12 }, (_, i) => story({ title: `Cyprus filler ${i}` }));
    const moon = story({ title: "Cyprus-licensed MoonPay applies for bank charter to expand stablecoin services", published_at: "2026-01-01T00:00:00Z" });
    const h = buildIntlHome([...filler, moon]);
    expect(h.fintech.map((s) => s.id)).toContain(moon.id);
    expect(h.companies.map((s) => s.id)).not.toContain(moon.id);
  });

  it("staff appointments stay out of Companies & Investment", () => {
    expect(BLOCK_RULES.companies(story({ title: "Economist appointed EIB Group Chief Economist", summary: "Joins the investment bank." }))).toBe(false);
  });
});
