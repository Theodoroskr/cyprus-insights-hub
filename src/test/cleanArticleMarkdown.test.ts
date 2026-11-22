import { describe, it, expect } from "vitest";
import { cleanArticleMarkdown } from "@/lib/cleanArticleMarkdown";

const sample = `[![European Commission](https://ec.europa.eu/logo.svg)](https://ec.europa.eu/info/index_en)[EN](https://ec.europa.eu/#)[Search](https://ec.europa.eu/#) Search

1. ...
[Home](https://ec.europa.eu/commission/index_en)[Press corner](https://ec.europa.eu/presscorner) Commission preliminarily finds TikTok

Available languages:  български ( машинен превод )čeština ( Strojový překlad )

Press release  Nov 5, 2026  Brussels  4 min read

# Commission preliminarily finds TikTok's feed in breach of Digital Services Act

Today, the European Commission has preliminarily found TikTok in breach of the Digital Services Act (DSA) for the so-called rabbit hole effect of its recommender system, which shows users a continuous stream.

### Risk assessment

The Commission preliminarily found that TikTok did not adequately assess risks.

## About Us

- [Directorate-General for Communication](https://commission.europa.eu/a)
- [Accessibility](https://commission.europa.eu/b)

## Related sites

- [European Union](https://european-union.europa.eu/index_en)`;

describe("cleanArticleMarkdown", () => {
  const out = cleanArticleMarkdown(sample);

  it("starts at the first real paragraph, dropping logo, menu and language picker", () => {
    expect(out.startsWith("Today, the European Commission")).toBe(true);
    expect(out).not.toContain("Available languages");
    expect(out).not.toContain("logo.svg");
  });

  it("keeps sub-headings inside the story", () => {
    expect(out).toContain("### Risk assessment");
    expect(out).toContain("did not adequately assess risks");
  });

  it("cuts the site footer", () => {
    expect(out).not.toContain("About Us");
    expect(out).not.toContain("Related sites");
  });

  it("returns empty when there is no real paragraph", () => {
    expect(cleanArticleMarkdown("[Home](x) [Search](y)\n\n- [A](a)")).toBe("");
  });
});

describe("site feedback banners", () => {
  it("drops the 'welcome to the new website' banner, even when scraped twice", () => {
    const story =
      "CPMI and IOSCO are seeking input from stakeholders on a cyber resilience toolkit for financial market infrastructures and on risks from third-party service providers.";
    const banner =
      'Welcome to the new BIS website. Please share your [feedback](https://forms.office.com/e/pnfWztYpyA "(opens in a new window)") to help us improve.';
    const raw = `${story}\n\n${banner}\n\n${banner}`;
    const out = cleanArticleMarkdown(raw);
    expect(out).toBe(story);
    expect(out).not.toContain("Welcome to the new");
    expect(out).not.toContain("forms.office.com");
  });

  it("keeps a story that only mentions feedback in its own words", () => {
    const story =
      "The consultation invites banks to share their feedback on the draft standard before the deadline of 01 December 2026, which the secretariat will publish alongside responses.";
    expect(cleanArticleMarkdown(story)).toBe(story);
  });
});

describe("source listings", () => {
  it("cuts Related Press & News and Latest Publications", () => {
    const story = "ESMA published its annual work programme today, setting out priorities for supervision, data and simplification of reporting across the EU markets.";
    const raw = `${story}\n\nRelated Press & News\n\n23/09/2026\n\nThe European Supervisory Authorities have identified external dependencies as key vu\n\nLATEST PUBLICATIONS\n\nDownload All FilesDownload Selected Files\n\n| Date | Reference | Title | | |`;
    const out = cleanArticleMarkdown(raw);
    expect(out).toBe(story);
  });
});

describe("cleanArticleMarkdown – website code and promo boxes", () => {
  const story = "Inter Miami CF today announced a partnership with Mastercard, naming the global technology company as the Exclusive Payment Services Partner of the Club and Nu Stadium.";
  const scraped = [
    `<div class="algolia-analytics" data-promoted="\${hit?.\\_rankingInfo?.promoted}"><a class="hit-card" href="\${hit.path}" > \${hit.title} </a></div> <p class='no-results-header'>No Results Found.</p><p class='no-results-body'>Please try again with a different search query.</p>`,
    "What are you looking for?",
    "Featured Content",
    "[**Turn everyday transactions into lasting loyalty** \\\\",
    "Traditional account management is no longer enough. Learn what consumers are looking for in their post-purchase experience in our new research with Datos Insights.](https://www.mastercard.com/x.html) May 15, 2026 \\| Miami, FL",
    "## Inter Miami CF names Mastercard as Exclusive Payment Services Partner",
    story,
    "Fans can expect exclusive activations, as reported in [the club's own announcementopens in a new tab](https://example.com/a), and more rewards for cardholders at the stadium.",
  ].join("\n\n");

  it("drops search-widget code and starts at the real story", () => {
    const out = cleanArticleMarkdown(scraped);
    expect(out.startsWith(story)).toBe(true);
    expect(out).not.toMatch(/algolia|\$\{|No Results Found|Datos Insights/);
  });

  it("removes the 'opens in a new tab' words glued onto links", () => {
    expect(cleanArticleMarkdown(scraped)).toContain("[the club's own announcement](https://example.com/a)");
  });

  it("keeps the words inside simple formatting tags", () => {
    const html = "<p>The Central Bank said lending to households rose by <b>4.2%</b> in October, the fastest pace since 2019, according to its monthly statistics.</p>";
    expect(cleanArticleMarkdown(html)).toBe("The Central Bank said lending to households rose by **4.2%** in October, the fastest pace since 2019, according to its monthly statistics.");
  });
});
