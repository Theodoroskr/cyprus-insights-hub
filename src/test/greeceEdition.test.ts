import { describe, expect, it } from "vitest";
import { grBankingTags, grEditionFields } from "../../supabase/functions/_shared/greeceEdition";

describe("Greece edition filing", () => {
  it("Cyprus sources stay out of the Greece edition", () =>
    expect(grEditionFields({ slug: "cysec", country: "CY", target_section: "banking" }, "x")).toBeNull());
  it("Greek sources file into the Greece edition only, in their own section", () => {
    const f = grEditionFields({ slug: "gr-athex-announcements", country: "GR", target_section: "announcements" }, "Share buyback");
    expect(f?.edition).toEqual(["gr"]);
    expect(f?.gr_section).toBe("announcements");
  });
  it("bank releases link to that bank's page", () =>
    expect(grEditionFields({ slug: "gr-eurobank-press", country: "GR", target_section: "banking" }, "x")?.organisation_slug).toBe("eurobank"));
  it("quarterly results get the Financial Results filter", () =>
    expect(grBankingTags("Third Quarter 2026 Financial Results")).toContain("Financial Results"));
  it("own-share purchases get the Corporate Announcements filter", () =>
    expect(grBankingTags("ANNOUNCEMENT - PURCHASE OF OWN SHARES")).toEqual(["Corporate Announcements"]));
});

import { sectionFill } from "@/lib/greeceBlend";
describe("Greece section fill", () => {
  const cy = (id: string, title: string, extra: Record<string, unknown> = {}) => ({ id, title, summary: null, tags: null, greece_related: false, vertical: "general", ...extra });
  it("puts Greek stories first, then Greece-related, then International, then a few Cyprus", () => {
    const out = sectionFill("banking", [{ id: "g1" }], [
      cy("c1", "Cyprus banks report deposits rise"),
      cy("i1", "ECB holds interest rates"),
      cy("r1", "Greek banks lead euro bond rally", { greece_related: true }),
      cy("x1", "Tourism arrivals up"),
    ]);
    expect(out.map((s) => s.id)).toEqual(["g1", "r1", "i1", "c1"]);
  });
  it("Greece–Cyprus takes only Greece-related stories", () => {
    const out = sectionFill("greece-cyprus", [], [cy("a", "ECB holds rates"), cy("b", "Athens and Nicosia sign deal", { greece_related: true })]);
    expect(out.map((s) => s.id)).toEqual(["b"]);
  });
  it("caps Cyprus stories", () => {
    const many = Array.from({ length: 10 }, (_, i) => cy(`c${i}`, `Cyprus bank loans ${i}`));
    expect(sectionFill("banking", [], many, { cyprusMax: 2 }).length).toBe(2);
  });
});

import { isGreekText, readableIn } from "@/lib/greeceBlend";
import { PLACEHOLDER_SLOTS as GR_SLOTS } from "@/components/banners/AdSlot";
describe("Greece pages language and banners", () => {
  it("in Greek keeps only stories whose Greek headline is really Greek", () => {
    const rows = [{ id: "a", title_el: "Τράπεζες" }, { id: "b", title_el: "Publication: Bulletin" }, { id: "c", title_el: null }];
    expect(readableIn("el", rows).map((r) => r.id)).toEqual(["a"]);
    expect(readableIn("en", rows).length).toBe(3);
    expect(isGreekText("Publication: Bulletin")).toBe(false);
  });
  it("shows Advertise here placeholders in the three Greece banner places", () => {
    for (const s of ["greece-top", "greece-mid", "greece-footer"]) expect(GR_SLOTS.has(s)).toBe(true);
  });
});
