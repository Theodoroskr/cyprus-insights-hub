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
