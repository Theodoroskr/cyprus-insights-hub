import { describe, it, expect } from "vitest";
import { filterListings, mappable, uniqueListings, expandQuery, type Listing } from "@/lib/explore";

const base: Listing = { id: "1", slug: "a", name_en: "Pafos Archaeological Park", name_el: "Αρχαιολογικό Πάρκο Πάφου", aliases: [], summary_en: null, summary_el: null, category: "museums-heritage", district: "Pafos", locality: "Kato Pafos", address: null, lat: 34.75, lng: 32.4, coords_verified: true, opening_hours: null, admission: null, booking_url: null, accessibility: null, parking: null, official_url: "x", source_url: "x", last_verified_at: "2026-11-13", status: "published", destination_ids: ["pafos"] };
const napa: Listing = { ...base, id: "2", slug: "b", name_en: "Ayia Napa Monastery", name_el: null, category: "museums-heritage", district: "Famagusta", locality: "Ayia Napa", coords_verified: false, destination_ids: ["napa", "famagusta"] };
const beach: Listing = { ...base, id: "3", slug: "c", name_en: "Fig Tree Bay", name_el: null, category: "beaches", district: "Famagusta", locality: "Protaras", destination_ids: ["protaras"] };
const all = [base, napa, beach];

describe("explore search", () => {
  it("Paphos finds Pafos listings", () => expect(filterListings(all, { q: "Paphos" }).map((l) => l.id)).toEqual(["1"]));
  it("Agia Napa finds Ayia Napa listings", () => expect(filterListings(all, { q: "Agia Napa" }).map((l) => l.id)).toEqual(["2"]));
  it("Greek name with accents matches", () => expect(filterListings(all, { q: "πάφου" }).map((l) => l.id)).toEqual(["1"]));
  it("expands variants", () => expect(expandQuery("paphos")).toContain("pafos"));
});
describe("explore filters", () => {
  it("district + category combine", () => expect(filterListings(all, { district: "Famagusta", category: "beaches" }).map((l) => l.id)).toEqual(["3"]));
  it("locality filter", () => expect(filterListings(all, { locality: "protaras" }).map((l) => l.id)).toEqual(["3"]));
  it("one listing appears under two destinations", () => {
    expect(filterListings(all, { destinationId: "napa" }).map((l) => l.id)).toEqual(["2"]);
    expect(filterListings(all, { destinationId: "famagusta" }).map((l) => l.id)).toEqual(["2"]);
  });
  it("map shows only verified coordinates", () => expect(mappable(all).map((l) => l.id)).toEqual(["1", "3"]));
  it("no duplicate pages for multi-destination listing", () => expect(uniqueListings([napa, napa, base]).length).toBe(2));
});
