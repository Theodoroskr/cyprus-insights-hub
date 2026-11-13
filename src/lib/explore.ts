import type { Lang } from "@/lib/academy";

export const EXPLORE_CATEGORIES = [
  { id: "museums-heritage", en: "Museums & heritage", el: "Μουσεία & κληρονομιά" },
  { id: "beaches", en: "Beaches", el: "Παραλίες" },
  { id: "nature-trails", en: "Nature & trails", el: "Φύση & μονοπάτια" },
  { id: "wineries", en: "Wineries", el: "Οινοποιεία" },
  { id: "villages", en: "Traditional villages", el: "Παραδοσιακά χωριά" },
  { id: "family", en: "Family activities", el: "Οικογενειακές δραστηριότητες" },
  { id: "accommodation", en: "Accommodation", el: "Διαμονή" },
  { id: "events", en: "Events", el: "Εκδηλώσεις" },
  { id: "routes", en: "Routes", el: "Διαδρομές" },
  { id: "conference-venues", en: "Conference venues", el: "Χώροι συνεδρίων" },
] as const;
export type CategoryId = (typeof EXPLORE_CATEGORIES)[number]["id"];

export const DISTRICTS = ["Nicosia", "Limassol", "Larnaka", "Pafos", "Famagusta"] as const;
export const DISTRICT_EL: Record<string, string> = { Nicosia: "Λευκωσία", Limassol: "Λεμεσός", Larnaka: "Λάρνακα", Pafos: "Πάφος", Famagusta: "Αμμόχωστος" };
export const districtLabel = (d: string, lang: Lang) => (lang === "el" ? DISTRICT_EL[d] ?? d : d);

/** Spelling variants grouped; any member matches any other. */
export const PLACE_VARIANTS: string[][] = [
  ["pafos", "paphos", "πάφος"],
  ["ayia napa", "agia napa", "aya napa", "αγία νάπα"],
  ["larnaka", "larnaca", "λάρνακα"],
  ["nicosia", "lefkosia", "λευκωσία"],
  ["limassol", "lemesos", "λεμεσός"],
  ["famagusta", "ammochostos", "αμμόχωστος"],
  ["protaras", "πρωταράς"],
  ["troodos", "troödos", "τρόοδος"],
  ["kourion", "curium", "κούριον"],
  ["omodos", "ομοδος"],
];

const GREEK_MAP: Record<string, string> = { ά:"α", έ:"ε", ή:"η", ί:"ι", ϊ:"ι", ΐ:"ι", ό:"ο", ύ:"υ", ϋ:"υ", ΰ:"υ", ώ:"ω", ς:"σ" };

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[άέήίϊΐόύϋΰώς]/g, (c) => GREEK_MAP[c] ?? c)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Expand a query into all variant spellings it could mean. */
export function expandQuery(q: string): string[] {
  const n = normalise(q);
  if (!n) return [];
  const out = new Set([n]);
  for (const group of PLACE_VARIANTS) {
    const g = group.map(normalise);
    for (const v of g) {
      if (n.includes(v)) g.forEach((alt) => out.add(n.replace(v, alt)));
    }
  }
  return [...out];
}

export interface Destination {
  id: string; slug: string; parent_id: string | null; name_en: string; name_el: string | null;
  aliases: string[]; kind: string; districts: string[]; intro_en: string | null; intro_el: string | null;
  image_url: string | null; image_credit: string | null; image_rights: string | null; sort_order: number; status: string;
}
export interface Listing {
  id: string; slug: string; name_en: string; name_el: string | null; aliases: string[];
  summary_en: string | null; summary_el: string | null; category: string; district: string | null; locality: string | null; locality_el?: string | null;
  address: string | null; address_el?: string | null; opening_hours_el?: string | null; admission_el?: string | null; accessibility_el?: string | null; parking_el?: string | null; lat: number | null; lng: number | null; coords_verified: boolean;
  opening_hours: string | null; admission: string | null; booking_url: string | null; accessibility: string | null; parking: string | null;
  official_url: string | null; source_url: string | null; last_verified_at: string | null; status: string;
  facilities?: string | null; facilities_el?: string | null; catering?: string | null; catering_el?: string | null;
  quote_enabled?: boolean; directory_company_id?: string | null;
  destination_ids?: string[];
}
export interface ListingLink { from_listing_id: string; to_listing_id: string; relation: "heritage" | "stay" | "event" | "route" | "related"; sort_order: number }
export interface EventEdition {
  id: string; listing_id: string; label: string; label_el: string | null; start_date: string | null; end_date: string | null;
  opening_hours: string | null; opening_hours_el: string | null; programme: string | null; programme_el: string | null;
  visitor_info: string | null; visitor_info_el: string | null; source_url: string | null; last_verified_at: string | null; status: string;
}
export interface VenueRoom {
  id: string; listing_id: string; name: string; name_el: string | null; area_sqm: number | null; sort_order: number;
  theatre: number | null; classroom: number | null; banquet: number | null; cocktail: number | null; boardroom: number | null; u_shape: number | null;
}

export function haystack(l: Pick<Listing, "name_en" | "name_el" | "aliases" | "summary_en" | "summary_el" | "district" | "locality" | "category"> & { locality_el?: string | null }, destNames: string[] = []): string {
  const cat = EXPLORE_CATEGORIES.find((c) => c.id === l.category);
  return normalise([l.name_en, l.name_el, ...(l.aliases ?? []), l.summary_en, l.summary_el, l.district, l.district ? DISTRICT_EL[l.district] : null, l.locality, l.locality_el, cat?.en, cat?.el, ...destNames].filter(Boolean).join(" "));
}

export function matchesQuery(text: string, q: string): boolean {
  const variants = expandQuery(q);
  if (!variants.length) return true;
  const hay = normalise(text);
  return variants.some((v) => v.split(" ").every((w) => hay.includes(w)));
}

export interface ExploreFilters { q?: string; category?: string; district?: string; locality?: string; destinationId?: string }

export function filterListings(listings: Listing[], f: ExploreFilters, destNameById: Record<string, string[]> = {}): Listing[] {
  return listings.filter((l) => {
    if (f.category && l.category !== f.category) return false;
    if (f.district && l.district !== f.district) return false;
    if (f.locality && normalise(l.locality ?? "") !== normalise(f.locality)) return false;
    if (f.destinationId && !(l.destination_ids ?? []).includes(f.destinationId)) return false;
    if (f.q) {
      const names = (l.destination_ids ?? []).flatMap((id) => destNameById[id] ?? []);
      if (!matchesQuery(haystack(l, names), f.q)) return false;
    }
    return true;
  });
}

/** Listings that may be pinned on a map. */
export const mappable = (ls: Listing[]) => ls.filter((l) => l.coords_verified && l.lat != null && l.lng != null);

/** De-duplicate a listing set by id (a listing linked to several destinations is one place). */
export const uniqueListings = (ls: Listing[]) => [...new Map(ls.map((l) => [l.id, l])).values()];

export const pick = (lang: Lang, en: string | null | undefined, el: string | null | undefined) => (lang === "el" && el ? el : en ?? el ?? "");
export const catLabel = (id: string, lang: Lang) => { const c = EXPLORE_CATEGORIES.find((x) => x.id === id); return c ? c[lang] : id; };
export const directionsUrl = (l: Pick<Listing, "lat" | "lng" | "coords_verified" | "name_en" | "address">) =>
  l.coords_verified && l.lat != null && l.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([l.name_en, l.address, "Cyprus"].filter(Boolean).join(", "))}`;

export const EL = (lang: Lang, en: string, el: string) => (lang === "el" ? el : en);

/** "Locality, District" in the chosen language, without repeating a town that is also the district. */
export function placeLine(l: Pick<Listing, "locality" | "district"> & { locality_el?: string | null }, lang: Lang): string {
  const loc = l.locality ? (lang === "el" ? l.locality_el || l.locality : l.locality) : null;
  const dis = l.district ? districtLabel(l.district, lang) : null;
  return [loc, dis].filter((x, i, a) => x && a.indexOf(x) === i).join(", ");
}


/* ---------- Nicosia City & Countryside ---------- */

/** Filters on the Nicosia City & Countryside page, each mapped to one listing category. */
export const NICOSIA_FILTERS = [
  { id: "villages", en: "Villages", el: "Χωριά" },
  { id: "museums-heritage", en: "Heritage sites & museums", el: "Μνημεία & μουσεία" },
  { id: "accommodation", en: "Accommodation", el: "Διαμονή" },
  { id: "events", en: "Events", el: "Εκδηλώσεις" },
  { id: "routes", en: "Routes", el: "Διαδρομές" },
] as const;
const NICOSIA_CATS = new Set<string>(NICOSIA_FILTERS.map((f) => f.id));
/** Listings that belong on the Nicosia City & Countryside page. */
export const nicosiaListings = (ls: Listing[]) => ls.filter((l) => l.district === "Nicosia" && NICOSIA_CATS.has(l.category));
/** Listings that cannot be pinned yet — shown in the list and flagged for editors. */
export const needsCoords = (l: Pick<Listing, "coords_verified" | "lat" | "lng">) => !l.coords_verified || l.lat == null || l.lng == null;

/* ---------- Event editions ---------- */

const day = (d: string) => d.slice(0, 10);
/** The edition to feature: the earliest published edition that has not finished yet (end date, or start date if single-day). */
export function currentEdition(eds: EventEdition[], today = new Date().toISOString()): EventEdition | null {
  const t = day(today);
  const live = eds.filter((e) => e.status === "published" && e.start_date && day(e.end_date ?? e.start_date) >= t);
  return live.sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1))[0] ?? null;
}
/** Finished editions, newest first. */
export function pastEditions(eds: EventEdition[], today = new Date().toISOString()): EventEdition[] {
  const t = day(today);
  return eds.filter((e) => e.status === "published" && e.start_date && day(e.end_date ?? e.start_date) < t)
    .sort((a, b) => (a.start_date! < b.start_date! ? 1 : -1));
}
export function dateRange(e: Pick<EventEdition, "start_date" | "end_date">, lang: Lang): string {
  if (!e.start_date) return "";
  const f = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return e.end_date && e.end_date !== e.start_date ? `${f(e.start_date)} – ${f(e.end_date)}` : f(e.start_date);
}

/* ---------- Conference venues ---------- */

export const ROOM_LAYOUTS = [
  { id: "theatre", en: "Theatre", el: "Θέατρο" },
  { id: "classroom", en: "Classroom", el: "Τάξη" },
  { id: "banquet", en: "Banquet", el: "Δείπνο" },
  { id: "cocktail", en: "Cocktail / reception", el: "Δεξίωση" },
  { id: "boardroom", en: "Boardroom", el: "Σύσκεψη" },
  { id: "u_shape", en: "U-shape", el: "Σχήμα Π" },
] as const;
export type RoomLayout = (typeof ROOM_LAYOUTS)[number]["id"];

/** Largest capacity a venue publishes for a layout (or any layout when none given); null when unknown. */
export function maxCapacity(rooms: VenueRoom[], layout?: RoomLayout | ""): number | null {
  const vals = rooms.flatMap((r) => (layout ? [r[layout]] : ROOM_LAYOUTS.map((x) => r[x.id]))).filter((v): v is number => typeof v === "number" && v > 0);
  return vals.length ? Math.max(...vals) : null;
}
/** Venue filter: unknown capacities never pass a delegate-count filter, so visitors only see venues that publish a fitting room. */
export function venueFits(rooms: VenueRoom[], delegates: number | null, layout: RoomLayout | ""): boolean {
  if (!delegates && !layout) return true;
  const cap = maxCapacity(rooms, layout);
  if (cap == null) return false;
  return !delegates || cap >= delegates;
}
