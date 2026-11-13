/** Conference & meeting venues: import matching, verified-field protection, plans and uploads. Pure functions (tested). */
import { normalise } from "@/lib/explore";

export const VENUE_TYPES = [
  { id: "hotel", en: "Hotel with meeting rooms", el: "Ξενοδοχείο με αίθουσες" },
  { id: "conference-centre", en: "Conference centre", el: "Συνεδριακό κέντρο" },
  { id: "event-venue", en: "Event venue", el: "Χώρος εκδηλώσεων" },
] as const;
export type VenueType = (typeof VENUE_TYPES)[number]["id"];

/** Fields that must be confirmed against a current source before a venue is published. */
export const PUBLISH_REQUIRED = ["name", "operating_status", "official_url", "business_contact", "room_capacities"] as const;
export const FIELD_LABELS: Record<string, string> = {
  name: "Current venue name", operating_status: "Operating status", official_url: "Website",
  business_contact: "Business contact", room_capacities: "Room capacities",
};
export function missingForPublish(verified: string[]): string[] {
  return PUBLISH_REQUIRED.filter((f) => !verified.includes(f));
}

/* ---------- Import matching ---------- */
const STOP = new Set(["hotel", "hotels", "resort", "resorts", "spa", "the", "and", "&", "beach", "conference", "centre", "center", "suites", "village", "ξενοδοχειο"]);
export function venueKey(name: string): string {
  return normalise(name).replace(/[^a-z0-9α-ω ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).join(" ");
}
export function hostOf(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(/^https?:/.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
}

export interface ImportRow { name: string; locality?: string | null; district?: string | null; website?: string | null; address?: string | null }
export interface MatchCandidate { id: string; name_en: string; aliases?: string[] | null; locality?: string | null; district?: string | null; official_url?: string | null; address?: string | null }
export type MatchStatus = "new" | "match" | "possible_duplicate" | "possible_rename";
export interface MatchResult { status: MatchStatus; listingId: string | null; note: string }

/** A website match is decisive; a same-name venue in the same locality is a match; anything weaker goes to manual review. */
export function matchImportRow(row: ImportRow, listings: MatchCandidate[]): MatchResult {
  const host = hostOf(row.website);
  if (host) {
    const byHost = listings.filter((l) => hostOf(l.official_url) === host);
    if (byHost.length === 1) {
      const same = venueKey(byHost[0].name_en) === venueKey(row.name);
      return same ? { status: "match", listingId: byHost[0].id, note: "Same website" }
        : { status: "possible_rename", listingId: byHost[0].id, note: `Same website, listed as "${byHost[0].name_en}"` };
    }
  }
  const key = venueKey(row.name);
  const loc = normalise(row.locality ?? row.district ?? "");
  const named = listings.filter((l) => [l.name_en, ...(l.aliases ?? [])].some((n) => venueKey(n) === key));
  const sameLoc = named.filter((l) => !loc || normalise(l.locality ?? l.district ?? "") === loc || normalise(l.district ?? "") === loc);
  if (sameLoc.length === 1) return { status: "match", listingId: sameLoc[0].id, note: "Same name and locality" };
  if (named.length) return { status: "possible_duplicate", listingId: named[0].id, note: sameLoc.length > 1 ? "Several venues share this name" : "Same name, different locality" };
  const partial = listings.filter((l) => key.length > 3 && (venueKey(l.name_en).includes(key) || key.includes(venueKey(l.name_en))) && venueKey(l.name_en).length > 3);
  if (partial.length) return { status: "possible_duplicate", listingId: partial[0].id, note: `Similar name: "${partial[0].name_en}"` };
  return { status: "new", listingId: null, note: "No existing profile" };
}

/** Apply imported values without touching fields that staff or a verified owner have confirmed, and never write blanks. */
export function mergeImport<T extends Record<string, unknown>>(current: T, incoming: Partial<T>, verifiedFields: string[]): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (v == null || v === "") continue;
    if (verifiedFields.includes(k)) continue;
    if (current[k] === v) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/* ---------- Plans ---------- */
export interface VenuePlan { code: string; name_en: string; name_el: string | null; benefits_en: string[]; benefits_el: string[]; price_eur: number | null; billing_interval: string | null; photo_limit: number; allows_cover: boolean; allows_brochure: boolean; featured: boolean; active: boolean; sort_order: number }
/** The plan a listing displays now: a paid plan only while its term runs, otherwise the free listing. */
export function currentPlanCode(l: { plan_code?: string | null; plan_expires_at?: string | null }, now = new Date()): string {
  if (!l.plan_code || l.plan_code === "free") return "free";
  if (!l.plan_expires_at || new Date(l.plan_expires_at) <= now) return "free";
  return l.plan_code;
}
export function planFor(code: string, plans: VenuePlan[]): VenuePlan | undefined { return plans.find((p) => p.code === code); }
/** Approved photos shown publicly: capped by the current plan, extras kept but hidden. */
export function visiblePhotos<T extends { kind: string; status: string; sort_order: number }>(media: T[], plan?: VenuePlan): T[] {
  const limit = plan?.photo_limit ?? 0;
  return media.filter((m) => m.kind === "photo" && m.status === "approved").sort((a, b) => a.sort_order - b.sort_order).slice(0, limit);
}

export const UPGRADE_STATUSES = ["received", "under_review", "awaiting_payment", "active", "declined", "expired"] as const;
export const UPGRADE_LABEL: Record<string, { en: string; el: string }> = {
  received: { en: "Received", el: "Παραλήφθηκε" }, under_review: { en: "Under review", el: "Υπό εξέταση" },
  awaiting_payment: { en: "Awaiting payment", el: "Αναμονή πληρωμής" }, active: { en: "Active", el: "Ενεργό" },
  declined: { en: "Declined", el: "Απορρίφθηκε" }, expired: { en: "Expired", el: "Έληξε" },
};

/* ---------- Uploads ---------- */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string[]> = {
  logo: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  photo: ["image/png", "image/jpeg", "image/webp"],
  cover: ["image/png", "image/jpeg", "image/webp"],
  brochure: ["application/pdf"],
  attachment: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
};
export function uploadProblem(kind: string, file: { type: string; size: number }): string | null {
  if (!(ALLOWED[kind] ?? []).includes(file.type)) return kind === "brochure" ? "Brochures must be PDF files." : "Use a JPG, PNG or WebP image" + (kind === "logo" ? " (or SVG)." : ".");
  if (file.size > MAX_UPLOAD_BYTES) return "Files must be 5 MB or smaller.";
  return null;
}

/** True when the business email is on the venue's own website domain (or a subdomain of it). */
export function emailOnVenueDomain(email: string, website?: string | null): boolean {
  const host = hostOf(website); const dom = email.split("@")[1]?.toLowerCase();
  return !!host && !!dom && (dom === host || dom.endsWith(`.${host}`) || host.endsWith(`.${dom}`));
}
