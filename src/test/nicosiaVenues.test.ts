import { describe, expect, it } from "vitest";
import { currentEdition, pastEditions, maxCapacity, needsCoords, nicosiaListings, venueFits, ROOM_LAYOUTS, type EventEdition, type Listing, type VenueRoom } from "@/lib/explore";
import { canAttemptDelivery, looksLikeBot, overLimit, QUOTE_LAYOUTS, validateQuote } from "../../supabase/functions/_shared/venueQuote";
import { VENUE_QUOTE_EMAIL_READY } from "@/lib/featureFlags";
import { QUOTE_EMAIL_READY } from "../../supabase/functions/_shared/venueQuote";

const ed = (o: Partial<EventEdition>): EventEdition => ({ id: Math.random().toString(), listing_id: "x", label: "e", label_el: null, start_date: null, end_date: null, opening_hours: null, opening_hours_el: null, programme: null, programme_el: null, visitor_info: null, visitor_info_el: null, source_url: "https://x", last_verified_at: "2026-11-13", status: "published", ...o });
const room = (o: Partial<VenueRoom>): VenueRoom => ({ id: "r", listing_id: "v", name: "R", name_el: null, area_sqm: null, sort_order: 0, theatre: null, classroom: null, banquet: null, cocktail: null, boardroom: null, u_shape: null, ...o });
const errs = (r: ReturnType<typeof validateQuote>): Record<string, string> => ("errors" in r ? r.errors : {});
const valid = { venue_id: "0f8fad5b-d9cb-469f-a165-70867728950e", request_key: "7c9e6679-7425-40de-944b-e07fc1f90ae7", full_name: "Maria P", organisation: "Acme Ltd", email: "maria@acme.cy", event_type: "Conference", preferred_dates: "March 2027", delegate_count: 120, room_layout: "theatre" };

describe("event editions", () => {
  const xmas = ed({ start_date: "2026-11-21", end_date: "2027-01-06" });
  it("shows the 2026–27 Christmas Village edition while it is upcoming or running", () => {
    expect(currentEdition([xmas], "2026-11-13")?.id).toBe(xmas.id);
    expect(currentEdition([xmas], "2027-01-06")?.id).toBe(xmas.id);
  });
  it("archives an edition the day after it ends", () => {
    expect(currentEdition([xmas], "2027-01-07")).toBeNull();
    expect(pastEditions([xmas], "2027-01-07").map((e) => e.id)).toEqual([xmas.id]);
  });
  it("never features a draft or undated edition", () => {
    expect(currentEdition([ed({ start_date: "2026-12-01", status: "draft" }), ed({})], "2026-11-13")).toBeNull();
  });
});

describe("Nicosia City & Countryside", () => {
  const base = { coords_verified: true, lat: 35, lng: 33 } as Listing;
  it("includes only Nicosia villages, heritage, stays, events and routes", () => {
    const ls = [{ ...base, id: "1", district: "Nicosia", category: "villages" }, { ...base, id: "2", district: "Nicosia", category: "beaches" }, { ...base, id: "3", district: "Pafos", category: "villages" }, { ...base, id: "4", district: "Nicosia", category: "conference-venues" }] as Listing[];
    expect(nicosiaListings(ls).map((l) => l.id)).toEqual(["1"]);
  });
  it("flags listings without verified coordinates", () => {
    expect(needsCoords({ coords_verified: false, lat: 35, lng: 33 })).toBe(true);
    expect(needsCoords({ coords_verified: true, lat: null, lng: null })).toBe(true);
    expect(needsCoords({ coords_verified: true, lat: 35, lng: 33 })).toBe(false);
  });
});

describe("conference venue filters", () => {
  const rooms = [room({ theatre: 330, classroom: 130 }), room({ theatre: 100, boardroom: null })];
  it("uses the largest published room for the chosen layout", () => {
    expect(maxCapacity(rooms, "theatre")).toBe(330);
    expect(maxCapacity(rooms, "classroom")).toBe(130);
    expect(maxCapacity(rooms, "boardroom")).toBeNull();
  });
  it("hides venues that do not publish a fitting room", () => {
    expect(venueFits(rooms, 200, "theatre")).toBe(true);
    expect(venueFits(rooms, 200, "classroom")).toBe(false);
    expect(venueFits([], 10, "")).toBe(false);
    expect(venueFits([], null, "")).toBe(true);
  });
  it("app and server agree on room layouts", () => {
    expect(ROOM_LAYOUTS.map((x) => x.id)).toEqual([...QUOTE_LAYOUTS]);
  });
});

describe("quote request rules", () => {
  it("accepts a complete request", () => { expect(validateQuote(valid).ok).toBe(true); });
  it("rejects any attempt to set the recipient", () => {
    const r = validateQuote({ ...valid, recipient_email: "attacker@evil.com" });
    expect(r.ok).toBe(false);
    expect(errs(r).recipient_email).toBe("Not allowed");
  });
  it("requires name, organisation, email, event type, dates, delegates and layout", () => {
    const r = validateQuote({ venue_id: valid.venue_id, request_key: valid.request_key });
    expect(r.ok).toBe(false);
    for (const k of ["full_name", "organisation", "email", "event_type", "preferred_dates", "delegate_count", "room_layout"]) expect(errs(r)[k]).toBeTruthy();
  });
  it("rejects bad email, delegate count and layout", () => {
    const r = validateQuote({ ...valid, email: "nope", delegate_count: 0, room_layout: "stadium" });
    expect(r.ok).toBe(false);
    expect(Object.keys(errs(r)).sort()).toEqual(["delegate_count", "email", "room_layout"]);
  });
  it("limits to 3 per visitor per hour and 5 per email per day", () => {
    expect(overLimit(2, 4)).toBe(false);
    expect(overLimit(3, 0)).toBe(true);
    expect(overLimit(0, 5)).toBe(true);
  });
  it("treats a filled honeypot or a sub-3-second form as a bot", () => {
    expect(looksLikeBot({ website: "x" })).toBe(true);
    expect(looksLikeBot({ started_at: 1000 }, 2000)).toBe(true);
    expect(looksLikeBot({ started_at: 1000 }, 10_000)).toBe(false);
  });
  it("never resends a delivered or in-flight email", () => {
    expect(canAttemptDelivery("sent")).toBe(false);
    expect(canAttemptDelivery("sending")).toBe(false);
    expect(canAttemptDelivery("failed")).toBe(true);
  });
  it("quote button and server stay switched off together until email is set up", () => {
    expect(VENUE_QUOTE_EMAIL_READY).toBe(QUOTE_EMAIL_READY);
  });
});
