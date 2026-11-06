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
