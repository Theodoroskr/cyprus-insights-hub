import { describe, it, expect } from "vitest";
import { storyImage, fallbackFor } from "@/lib/fallbackImage";
import { cleanArticleMarkdown } from "@/lib/cleanArticleMarkdown";

describe("story photos", () => {
  it("same story gives the same photo on preview and page", () => {
    expect(storyImage(null, "compliance", "abc")).toBe(storyImage(null, "compliance", "abc"));
  });
  it("compliance stories never get a BusinessHub photo", () => {
    for (let i = 0; i < 30; i++) expect(fallbackFor("compliance", "s" + i)).toMatch(/compliance-\d/);
  });
  it("uses the first photo in the text when there is no main photo", () => {
    expect(storyImage(null, "compliance", "x", "Hi\n\n![a](https://x.eu/p.png?i=1)")).toBe("https://x.eu/p.png?i=1");
  });
  it("unwraps website photo cards", () => {
    const raw = "ESMA monitors market developments and new financial activities in its remit to assess risks to investors, markets and financial stability overall.\n\n[![Risk](https://x.eu/r.png)\\\\\n\\\\\n**Risk Monitoring**](https://x.eu/rm)\n";
    const out = cleanArticleMarkdown(raw);
    expect(out).toContain("![Risk](https://x.eu/r.png)");
    expect(out).not.toContain("\\");
  });
});
