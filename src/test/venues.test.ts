import { describe, expect, it } from "vitest";
import { currentPlanCode, isUnconfirmedVenue, emailOnVenueDomain, matchImportRow, mergeImport, missingForPublish, uploadProblem, visiblePhotos, type VenuePlan } from "@/lib/venues";
import { venueFits, type VenueRoom } from "@/lib/explore";

const room = (o: Partial<VenueRoom>): VenueRoom => ({ id: "r", listing_id: "l", name: "R", name_el: null, area_sqm: null, sort_order: 0, theatre: null, classroom: null, banquet: null, cocktail: null, boardroom: null, u_shape: null, ...o });

describe("capacity + layout filter", () => {
  it("needs one room that fits that many in that layout", () => {
    const rooms = [room({ theatre: 300, classroom: 80 }), room({ classroom: 120 })];
    expect(venueFits(rooms, 100, "classroom")).toBe(true);
    expect(venueFits(rooms, 150, "classroom")).toBe(false);
    expect(venueFits(rooms, 150, "theatre")).toBe(true);
    expect(venueFits(rooms, 10, "banquet")).toBe(false);
  });
});

describe("import matching", () => {
  const listings = [
    { id: "a", name_en: "Hilton Nicosia", locality: "Nicosia", district: "Nicosia", official_url: "https://www.hilton.com/nicosia" },
    { id: "b", name_en: "Amathus Beach Hotel", locality: "Limassol", district: "Limassol", official_url: "https://amathushotel.com" },
  ];
  it("matches same name and locality", () => expect(matchImportRow({ name: "Hilton Nicosia Hotel", locality: "Nicosia" }, listings)).toMatchObject({ status: "match", listingId: "a" }));
  it("flags a renamed property that shares the website", () => expect(matchImportRow({ name: "Amathus Limassol", website: "www.amathushotel.com" }, listings).status).toBe("possible_rename"));
  it("sends same name in another town to review", () => expect(matchImportRow({ name: "Hilton Nicosia", locality: "Paphos" }, listings).status).toBe("possible_duplicate"));
  it("unknown venue is new", () => expect(matchImportRow({ name: "Filoxenia Conference Centre", locality: "Nicosia" }, listings).status).toBe("new"));
});

describe("verified values survive later imports", () => {
  it("skips verified fields and blanks", () => {
    expect(mergeImport({ name_en: "Owner Name", official_url: null as string | null, phone: "1" }, { name_en: "PDF Name", official_url: "https://x.cy", phone: "" }, ["name_en"]))
      .toEqual({ official_url: "https://x.cy" });
  });
  it("publishing needs name, status, website, contact and capacities confirmed", () =>
    expect(missingForPublish(["name", "official_url"])).toEqual(["operating_status", "business_contact", "room_capacities"]));
});

describe("plans", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  it("paid plan only during its term", () => {
    expect(currentPlanCode({ plan_code: "featured", plan_expires_at: "2027-01-01T00:00:00Z" }, now)).toBe("featured");
    expect(currentPlanCode({ plan_code: "featured", plan_expires_at: "2026-11-01T00:00:00Z" }, now)).toBe("free");
    expect(currentPlanCode({ plan_code: "featured", plan_expires_at: null }, now)).toBe("free");
  });
  it("free plan shows no gallery photos; expired extras are kept, not shown", () => {
    const media = [1, 2, 3].map((i) => ({ kind: "photo", status: "approved", sort_order: i }));
    const free = { photo_limit: 0 } as VenuePlan, enh = { photo_limit: 2 } as VenuePlan;
    expect(visiblePhotos(media, free)).toHaveLength(0);
    expect(visiblePhotos(media, enh)).toHaveLength(2);
    expect(visiblePhotos([{ kind: "photo", status: "pending", sort_order: 0 }], enh)).toHaveLength(0);
  });
});

describe("uploads and owner email", () => {
  it("rejects wrong types and files over 5 MB", () => {
    expect(uploadProblem("photo", { type: "image/jpeg", size: 1000 })).toBeNull();
    expect(uploadProblem("photo", { type: "application/pdf", size: 1000 })).not.toBeNull();
    expect(uploadProblem("logo", { type: "image/png", size: 6 * 1024 * 1024 })).not.toBeNull();
  });
  it("business email must sit on the venue's own domain", () => {
    expect(emailOnVenueDomain("events@amathushotel.com", "https://www.amathushotel.com")).toBe(true);
    expect(emailOnVenueDomain("me@gmail.com", "https://www.amathushotel.com")).toBe(false);
  });
});

describe("unconfirmed venues are flagged", () => {
  it("flags a venue until all five details are confirmed", () => {
    expect(isUnconfirmedVenue({ category: "conference-venues", verified_fields: [] })).toBe(true);
    expect(isUnconfirmedVenue({ category: "conference-venues", verified_fields: ["name", "operating_status", "official_url", "business_contact"] })).toBe(true);
    expect(isUnconfirmedVenue({ category: "conference-venues", verified_fields: ["name", "operating_status", "official_url", "business_contact", "room_capacities"] })).toBe(false);
  });
  it("never flags non-venue places", () => expect(isUnconfirmedVenue({ category: "museums-heritage", verified_fields: [] })).toBe(false));
});
