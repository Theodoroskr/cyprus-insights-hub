// Twice-daily ComplianceHub social posts: one published regulatory update per slot, on every account with posting on.
import { cyprusClock, libraryImageFor, SITE_URL } from "./facebookPosting.ts";

/** Cyprus-time hours of the two daily posts (the daily data post has 11:00). */
export const SLOT_HOURS = [10, 16];
/** Only updates whose official publication date is this recent are posted. */
export const MAX_AGE_DAYS = 21;

export interface PostItem {
  id: string; slug: string | null; authority: string; title_en: string | null; official_title: string;
  summary_en: string | null; publication_date: string | null; deadline_date: string | null; topics: string[];
  is_test?: boolean | null; status?: string;
}
export interface PostRow { item_id: string; slot: string; platform: string; status: string; image_url?: string | null; created_at: string }

/** Slot key for a time (e.g. "2026-11-23T10"), or null outside the posting hours. */
export function slotAt(now: Date): string | null {
  const c = cyprusClock(now);
  return SLOT_HOURS.includes(c.hour) ? `${c.date}T${String(c.hour).padStart(2, "0")}` : null;
}

const ageDays = (d: string | null, now: Date) => d ? (now.getTime() - Date.parse(`${d}T12:00:00Z`)) / 86400_000 : Infinity;

/**
 * Next update to post: published, recent, with an English title and summary, never posted before.
 * Newest first, but an authority other than the last post's goes ahead when one is available.
 */
export function pickItem(items: PostItem[], history: PostRow[], now: Date): PostItem | null {
  const posted = new Set(history.filter((h) => h.status === "posted").map((h) => h.item_id));
  const fresh = items
    .filter((i) => (i.status ?? "published") === "published" && !i.is_test && i.title_en?.trim() && i.summary_en?.trim())
    .filter((i) => !posted.has(i.id) && ageDays(i.publication_date, now) <= MAX_AGE_DAYS)
    .sort((a, b) => (b.publication_date ?? "").localeCompare(a.publication_date ?? ""));
  if (!fresh.length) return null;
  const lastPosted = [...history].filter((h) => h.status === "posted").sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const lastAuthority = lastPosted ? items.find((i) => i.id === lastPosted.item_id)?.authority : undefined;
  return fresh.find((i) => i.authority !== lastAuthority) ?? fresh[0];
}

export function itemLink(i: PostItem, platform: string): string {
  return `${SITE_URL}/compliance/regulatory-updates/${encodeURIComponent(i.slug ?? i.id)}?utm_source=${platform}&utm_medium=social&utm_campaign=compliancehub`;
}

function trim(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

const TAGS: Record<string, string> = { aml_cft: "#AML", sanctions: "#Sanctions", mica: "#MiCA", dora: "#DORA", payments: "#Payments", licensing: "#Licensing" };
const AUTH_TAGS: Record<string, string> = { CySEC: "#CySEC", "Central Bank of Cyprus": "#CentralBankCyprus", AMLA: "#AMLA", NSIU: "#Sanctions", FATF: "#FATF" };
export function hashtags(i: PostItem): string[] {
  return [...new Set(["#ComplianceHub", "#Cyprus", AUTH_TAGS[i.authority], ...i.topics.map((t) => TAGS[t])].filter(Boolean) as string[])].slice(0, 5);
}

const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Facebook / LinkedIn text: authority line, headline, summary, deadline, link to the ComplianceHub page. */
export function longMessage(i: PostItem, platform: "facebook" | "linkedin"): string {
  const head = `${i.authority} · Regulatory update${i.publication_date ? ` · ${fmtDate(i.publication_date)}` : ""}`;
  const lines = [head, "", (i.title_en ?? i.official_title).trim(), "", trim(i.summary_en ?? "", 600)];
  if (i.deadline_date) lines.push("", `Deadline stated by the source: ${fmtDate(i.deadline_date)}`);
  lines.push("", `Official document and details: ${itemLink(i, platform)}`, "", hashtags(i).join(" "));
  return lines.join("\n");
}

/** X post within 280 characters (links count as 23). */
export function shortMessage(i: PostItem): string {
  const link = itemLink(i, "x");
  const tags = hashtags(i).slice(0, 2).join(" ");
  const room = 280 - 23 - 2 - tags.length - 2;
  const title = trim(`${i.authority}: ${(i.title_en ?? i.official_title).trim()}`, room);
  return `${title}\n\n${tags}\n${link}`;
}

/** Picture for the post: a ComplianceHub library picture not used recently. */
export function postImage(history: PostRow[]): string {
  const recent = [...history].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).map((h) => h.image_url).filter(Boolean) as string[];
  return libraryImageFor("compliance", recent);
}
