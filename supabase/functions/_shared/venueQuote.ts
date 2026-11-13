/** Pure rules for venue quote requests (no imports, so the app's tests can load it). */

/** Flip to true only once an email sender domain is verified and the venue email send is wired. */
export const QUOTE_EMAIL_READY = false;

export const QUOTE_LAYOUTS = ["theatre", "classroom", "banquet", "cocktail", "boardroom", "u_shape"] as const;
export const QUOTE_LIMITS = { perClientPerHour: 3, perEmailPerDay: 5 } as const;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED = new Set(["venue_id", "request_key", "full_name", "organisation", "email", "event_type", "preferred_dates", "delegate_count",
  "room_layout", "catering", "av_requirements", "details", "language", "website", "started_at"]);

export interface QuoteInput {
  venue_id: string; request_key: string; full_name: string; organisation: string; email: string; event_type: string;
  preferred_dates: string; delegate_count: number; room_layout: string; catering: string | null; av_requirements: string | null;
  details: string | null; language: "en" | "el"; website?: string; started_at?: number;
}

/** Validates a submission. Unknown fields (e.g. a recipient address) are rejected, so a visitor can never choose where it is sent. */
export function validateQuote(raw: unknown): { ok: true; data: QuoteInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: { _: "Invalid request" } };
  const r = raw as Record<string, unknown>;
  for (const k of Object.keys(r)) if (!ALLOWED.has(k)) errors[k] = "Not allowed";
  const str = (k: string, min: number, max: number, required = true): string | null => {
    const v = r[k];
    if (v == null || v === "") { if (required) errors[k] = "Required"; return null; }
    if (typeof v !== "string") { errors[k] = "Invalid"; return null; }
    const t = v.trim();
    if (required && t.length < min) errors[k] = "Too short";
    else if (t.length > max) errors[k] = `Max ${max} characters`;
    return t || null;
  };
  const venue_id = str("venue_id", 36, 36); if (venue_id && !UUID.test(venue_id)) errors.venue_id = "Invalid";
  const request_key = str("request_key", 36, 36); if (request_key && !UUID.test(request_key)) errors.request_key = "Invalid";
  const full_name = str("full_name", 2, 120), organisation = str("organisation", 2, 160);
  const email = str("email", 5, 200); if (email && !EMAIL.test(email)) errors.email = "Invalid email";
  const event_type = str("event_type", 2, 120), preferred_dates = str("preferred_dates", 2, 200);
  const dc = r.delegate_count;
  const delegate_count = typeof dc === "number" ? dc : typeof dc === "string" && /^\d+$/.test(dc) ? Number(dc) : NaN;
  if (!Number.isInteger(delegate_count) || delegate_count < 1 || delegate_count > 10000) errors.delegate_count = "Enter a number between 1 and 10000";
  const room_layout = str("room_layout", 2, 20); if (room_layout && !(QUOTE_LAYOUTS as readonly string[]).includes(room_layout)) errors.room_layout = "Invalid";
  const catering = str("catering", 0, 1000, false), av_requirements = str("av_requirements", 0, 1000, false), details = str("details", 0, 3000, false);
  const language = r.language === "el" ? "el" : "en";
  const website = typeof r.website === "string" ? r.website : undefined;
  const started_at = typeof r.started_at === "number" ? r.started_at : undefined;
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { venue_id: venue_id!, request_key: request_key!, full_name: full_name!, organisation: organisation!, email: email!, event_type: event_type!,
    preferred_dates: preferred_dates!, delegate_count, room_layout: room_layout!, catering, av_requirements, details, language, website, started_at } };
}

/** Filled honeypot or a form sent faster than a person could fill it. */
export const looksLikeBot = (d: Pick<QuoteInput, "website" | "started_at">, now = Date.now()) => !!d.website || (d.started_at != null && now - d.started_at < 3000);

export const overLimit = (byClientLastHour: number, byEmailLastDay: number) =>
  byClientLastHour >= QUOTE_LIMITS.perClientPerHour || byEmailLastDay >= QUOTE_LIMITS.perEmailPerDay;

/** A delivery may be (re)tried only when it has not been sent and is not mid-send. */
export const canAttemptDelivery = (status: string | null | undefined) => status == null || status === "pending" || status === "failed" || status === "not_configured";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
/** Plain email body for the venue. */
export function quoteEmail(venueName: string, q: QuoteInput) {
  const rows: [string, string | number | null][] = [["Name", q.full_name], ["Organisation", q.organisation], ["Email", q.email], ["Event type", q.event_type],
    ["Preferred dates", q.preferred_dates], ["Delegates", q.delegate_count], ["Room layout", q.room_layout.replace("_", "-")], ["Catering", q.catering],
    ["AV requirements", q.av_requirements], ["Additional details", q.details]];
  const text = [`New quote request for ${venueName} via BusinessHub.cy`, "", ...rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k}: ${v}`), "", `Reply directly to ${q.email}.`].join("\n");
  const html = `<p>New quote request for <strong>${esc(venueName)}</strong> via BusinessHub.cy</p><table>${rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => `<tr><td><strong>${esc(k)}</strong></td><td>${esc(String(v))}</td></tr>`).join("")}</table><p>Reply directly to ${esc(q.email)}.</p>`;
  return { subject: `Quote request: ${q.event_type} · ${q.delegate_count} delegates`, text, html };
}
