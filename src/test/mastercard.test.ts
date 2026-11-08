import { describe, it, expect } from "vitest";
import { conversionRate, INTERESTS, COPY } from "@/lib/mastercard";
import { INTERESTS as SERVER_INTERESTS } from "../../supabase/functions/submit-enquiry/interests";

describe("Mastercard / Infocredit enquiries", () => {
  it("offers the seven areas of interest from the brief, identical in browser and backend", () => {
    expect(INTERESTS).toHaveLength(7);
    expect([...INTERESTS]).toEqual([...SERVER_INTERESTS]);
  });
  it("computes conversion as submissions per form open", () => {
    expect(conversionRate(40, 3)).toBe(7.5);
    expect(conversionRate(0, 0)).toBeNull();
  });
  it("never calls Infocredit an exclusive partner or reseller", () => {
    const text = JSON.stringify(COPY).toLowerCase();
    expect(text).not.toMatch(/exclusive|authori[sz]ed reseller|αποκλειστικ/);
    expect(COPY.en.partner).toBe("Local Mastercard partner in Cyprus");
  });
});
