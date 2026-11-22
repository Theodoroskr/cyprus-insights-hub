import { describe, expect, it } from "vitest";
import { HUB_MID_SLOTS, HUB_TOP_SLOTS } from "@/components/hub/HubMasthead";
import { PLACEHOLDER_SLOTS, AD_DIMENSIONS } from "@/components/banners/AdSlot";

describe("hub top banners", () => {
  it("gives each hub front page its own top banner place", () => {
    expect(HUB_TOP_SLOTS).toEqual({ fintechhub: "fintech-top", compliancehub: "compliance-top", regtechhub: "regtech-top", tourismhub: "tourism-top", energyhub: "energy-top" });
    const slots = Object.values(HUB_TOP_SLOTS);
    expect(new Set(slots).size).toBe(slots.length);
  });
  it("shows the Advertise here placeholder while unsold", () => {
    for (const s of Object.values(HUB_TOP_SLOTS)) expect(PLACEHOLDER_SLOTS.has(s!)).toBe(true);
  });
  it("gives each hub its own mid-page banner, different from its top one", () => {
    expect(HUB_MID_SLOTS).toEqual({ fintechhub: "fintech-mid", compliancehub: "compliance-mid", regtechhub: "regtech-mid", tourismhub: "tourism-mid", energyhub: "energy-mid" });
    for (const s of Object.values(HUB_MID_SLOTS)) expect(PLACEHOLDER_SLOTS.has(s!)).toBe(true);
    expect(PLACEHOLDER_SLOTS.has("homepage-lead")).toBe(true);
  });
  it("sizes the hub top banner full width and half the homepage billboard's height", () => {
    expect(AD_DIMENSIONS["wide-banner"]).toBe("970×125");
    expect(AD_DIMENSIONS.billboard).toBe("970×250");
  });
});

import { HUB_FEED_SLOTS, HUB_FOOTER_SLOTS } from "@/components/hub/HubMasthead";
import { brands as hubBrands } from "@/config/brands";
describe("hub front pages share the homepage banner frame", () => {
  it("each hub has four distinct bookable slots", () => {
    for (const b of ["fintechhub", "compliancehub", "regtechhub", "tourismhub", "energyhub"] as const) {
      const s = [HUB_TOP_SLOTS[b], HUB_FEED_SLOTS[b], HUB_MID_SLOTS[b], HUB_FOOTER_SLOTS[b]];
      expect(new Set(s).size).toBe(4);
      for (const x of s) expect(PLACEHOLDER_SLOTS.has(x!)).toBe(true);
    }
    expect(HUB_FEED_SLOTS.fintechhub).toBe("fintech-feed-top");
    expect(HUB_FOOTER_SLOTS.energyhub).toBe("energy-footer");
  });
  it("every hub menu links back to BusinessHub.cy", () => {
    for (const b of ["fintechhub", "compliancehub", "regtechhub", "tourismhub", "energyhub"] as const)
      expect(hubBrands[b].navItems.some((i) => i.href === "/")).toBe(true);
  });
});
