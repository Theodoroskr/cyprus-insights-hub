import { describe, expect, it } from "vitest";
import { HUB_TOP_SLOTS } from "@/components/hub/HubMasthead";
import { PLACEHOLDER_SLOTS, AD_DIMENSIONS } from "@/components/banners/AdSlot";

describe("hub top banners", () => {
  it("gives each hub front page its own top banner place", () => {
    expect(HUB_TOP_SLOTS).toEqual({ fintechhub: "fintech-top", compliancehub: "compliance-top", regtechhub: "regtech-top", tourismhub: "tourism-top" });
    const slots = Object.values(HUB_TOP_SLOTS);
    expect(new Set(slots).size).toBe(slots.length);
  });
  it("shows the Advertise here placeholder while unsold", () => {
    for (const s of Object.values(HUB_TOP_SLOTS)) expect(PLACEHOLDER_SLOTS.has(s!)).toBe(true);
  });
  it("sizes the hub top banner full width and half the homepage billboard's height", () => {
    expect(AD_DIMENSIONS["wide-banner"]).toBe("970×125");
    expect(AD_DIMENSIONS.billboard).toBe("970×250");
  });
});
