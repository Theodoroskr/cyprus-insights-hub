import { describe, it, expect } from "vitest";
import { dedupeKey, planMerge, euEligibleForCyprus, callState, PREVIEW_LIMIT, TOURISM_FUNDING_HREF, readFilters, formatDeadline, type ExistingCall } from "@/lib/funding";
import { PRIMARY_NAV } from "@/config/siteSections";
import { brands } from "@/config/brands";

const rif = { issuer: "Research and Innovation Foundation", call_reference: "CONCEPT-HYDRO/1026", round: null, title_en: "Proof of Concept (CONCEPT-HYDRO/1026)", official_url: "https://www.research.org.cy/en/new-call" };

describe("funding: one record per call", () => {
  it("portal listing and Greek release of the same call share one key", () => {
    const greek = { ...rif, issuer: "Ίδρυμα Έρευνας και Καινοτομίας (ΙδΕΚ)", title_en: "Proof of Concept", call_reference: "CONCEPT-HYDRO-1026" };
    expect(dedupeKey(greek)).toBe(dedupeKey(rif));
  });
  it("separate rounds stay separate", () => {
    expect(dedupeKey({ ...rif, round: "1" })).not.toBe(dedupeKey({ ...rif, round: "2" }));
  });
  it("a revised deadline on a verified round goes to the editor for that round", () => {
    const existing: ExistingCall = { ...rif, id: "a", status: "verified", deadline_date: "2027-01-15", round: "2" };
    const plan = planMerge(existing, { ...rif, round: "2", deadline_date: "2027-02-15" });
    expect(plan.changes).toEqual([{ field: "deadline_date", old_value: "2027-01-15", new_value: "2027-02-15", change_kind: "deadline_extension" }]);
    expect(plan.patch.deadline_date).toBeUndefined();
  });
  it("a call still in review takes the new deadline straight away", () => {
    const plan = planMerge({ ...rif, id: "a", status: "review", deadline_date: "2027-01-15" }, { ...rif, deadline_date: "2027-02-15" });
    expect(plan.patch.deadline_date).toBe("2027-02-15");
  });
  it("editor-locked fields are never overwritten", () => {
    const plan = planMerge({ ...rif, id: "a", status: "review", eligibility_summary: "Editor text", editor_locked_fields: ["eligibility_summary"] }, { ...rif, eligibility_summary: "Imported" });
    expect(plan.action).toBe("none");
  });
});

describe("funding: EU eligibility", () => {
  it("a cascade call limited to Hungary stays out", () => {
    expect(euEligibleForCyprus("cascade", "Enhancing the Cybersecurity Capabilities of the Domestic SME Sector in Hungary", "NCC-HU").eligible).toBe(false);
  });
  it("Commission topics are open to Cyprus", () => {
    expect(euEligibleForCyprus("topic", "Resource assessment for deep reservoirs").eligible).toBe(true);
  });
});

describe("funding: listing rules", () => {
  it("previews are exactly three", () => expect(PREVIEW_LIMIT).toBe(3));
  it("open is the default view", () => expect(readFilters(new URLSearchParams("")).view).toBe("open"));
  it("states follow dates", () => {
    expect(callState({ opening_date: "2026-12-01", deadline_date: "2027-01-01" }, "2026-11-13")).toBe("upcoming");
    expect(callState({ deadline_date: "2026-11-01" }, "2026-11-13")).toBe("closed");
    expect(callState({ deadline_date: null }, "2026-11-13")).toBe("ongoing");
  });
  it("a date without a time is shown as published", () => expect(formatDeadline("2027-01-15", null, "en")).toBe("15 January 2027"));
  it("Funding is in the main menu and TourismHub opens it filtered to Tourism", () => {
    expect(PRIMARY_NAV.map((i) => i.href)).toContain("/funding");
    const tourism = Object.values(brands).flatMap((b) => b.navItems).map((n) => n.href);
    expect(tourism).toContain(TOURISM_FUNDING_HREF);
  });
});
