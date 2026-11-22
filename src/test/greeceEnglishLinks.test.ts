import { describe, it, expect } from "vitest";
import { editionLinks, greeceHome } from "@/lib/networkEditions";
import { greeceNav, intlNav } from "@/config/siteSections";
import { grLangHref } from "@/lib/edition";

describe("Greece pages in English from International", () => {
  it("International menu opens the Greece edition in English", () => {
    const markets = intlNav("cy")[0];
    expect(markets.children?.find((c) => c.label === "Greece edition")?.href).toBe("/greece?lang=en");
  });
  it("switcher on the International edition opens Greece in English", () => {
    expect(editionLinks("en", "cy", false, "intl").find((l) => l.key === "gr")?.href).toBe("/greece?lang=en");
    expect(editionLinks("en", "cy", false, "cy").find((l) => l.key === "gr")?.href).toBe("/greece");
  });
  it("Greece menu keeps the reading language", () => {
    expect(greeceNav("en").every((n) => n.href.includes("lang=en"))).toBe(true);
    expect(greeceNav("el").some((n) => n.href.includes("lang="))).toBe(false);
    expect(greeceNav("en")[1].href).toBe("/greece/announcements?tab=deals&lang=en");
  });
  it("grLangHref adds lang only for English", () => {
    expect(grLangHref("/greece/banking", "en", false)).toBe("/greece/banking?lang=en");
    expect(grLangHref("/greece/banking", "el", false)).toBe("/greece/banking");
    expect(greeceHome("cy", true).href).toBe("/greece?lang=en");
  });
});
