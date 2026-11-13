// Pure helpers for automatic Facebook Page posting (used by post-to-facebook and tests).

export const SITE_URL = "https://businesshub.cy";
/** Last Cyprus-time hour in which the hourly job posts. */
export const LAST_POST_HOUR = 21;
/** Hard cap per hourly run, so a late start never dumps the whole day's allowance at once. */
export const MAX_PER_RUN = 3;

export interface CandidateArticle {
  id: string;
  title: string | null;
  summary: string | null;
  what_happened: string | null;
  vertical: string | null;
  source_id: string | null;
  published_at: string | null;
  image_url?: string | null;
}

/** Branded section pictures on the site, used when a story has no photo of its own. */
const HUB_IMAGES: Record<string, string> = {
  fintech: `${SITE_URL}/images/og-fintechhub.png`,
  compliance: `${SITE_URL}/images/og-compliancehub.png`,
  regtech: `${SITE_URL}/images/og-regtechhub.png`,
};

export function hubImage(vertical: string | null | undefined): string {
  return HUB_IMAGES[vertical ?? ""] ?? `${SITE_URL}/images/og-businesshub.png`;
}

const LIBRARY_BASE = "https://oralbierakmfxcqncjnz.supabase.co/storage/v1/object/public/banner-images/social-library";
const lib = (section: string, n: number) => Array.from({ length: n }, (_, i) => `${LIBRARY_BASE}/${section}-${i + 1}-v2.jpg`);

/**
 * Picture library per section, used in rotation when a story has no photo of its own.
 * To add pictures: upload `<section>-<n>-v2.jpg` (no people; logo + section name band) to banner-images/social-library and raise the count.
 */
export const SOCIAL_IMAGE_LIBRARY: Record<string, string[]> = {
  general: lib("general", 4),
  fintech: lib("fintech", 4),
  compliance: lib("compliance", 4),
  regtech: lib("regtech", 4),
  sme: lib("sme", 4),
  tourism: lib("general", 4),
};

/**
 * Library picture for a section: one not used recently, else the one used longest ago.
 * `recentlyUsed` is newest first.
 */
export function libraryImageFor(vertical: string | null | undefined, recentlyUsed: string[] = []): string {
  const pool = SOCIAL_IMAGE_LIBRARY[vertical ?? ""] ?? SOCIAL_IMAGE_LIBRARY.general;
  const unused = pool.find((img) => !recentlyUsed.includes(img));
  if (unused) return unused;
  return [...pool].sort((x, y) => recentlyUsed.indexOf(y) - recentlyUsed.indexOf(x))[0];
}

export function hasOwnPhoto(a: CandidateArticle): boolean {
  return /^https:\/\//i.test((a.image_url ?? "").trim());
}

/** Picture for the Facebook post: the story's own photo, else a rotating picture from its section's library. */
export function postImageFor(a: CandidateArticle, recentlyUsed: string[] = []): string {
  return hasOwnPhoto(a) ? a.image_url!.trim() : libraryImageFor(a.vertical, recentlyUsed);
}

/** Calendar date (YYYY-MM-DD) and hour in Cyprus time. */
export function cyprusClock(at: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Nicosia", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/** How many posts were made on the same Cyprus calendar day as `now`. */
export function countPostedToday(postedAt: string[], now: Date): number {
  const today = cyprusClock(now).date;
  return postedAt.filter((t) => cyprusClock(new Date(t)).date === today).length;
}

/**
 * Posts allowed in this run: never more than what is left of the daily limit,
 * spread evenly over the remaining hourly runs of the day.
 */
export function postsThisRun(dailyLimit: number, postedToday: number, now: Date): number {
  const remaining = Math.max(0, dailyLimit - postedToday);
  if (remaining === 0) return 0;
  const { hour } = cyprusClock(now);
  const runsLeft = Math.max(1, LAST_POST_HOUR - hour + 1);
  return Math.min(remaining, MAX_PER_RUN, Math.ceil(remaining / runsLeft));
}

/**
 * Pick up to `n` not-yet-posted stories, newest first, alternating between
 * sections and sources so one scrape batch does not fill the page.
 */
export function pickArticles(candidates: CandidateArticle[], alreadyPosted: Set<string>, n: number): CandidateArticle[] {
  if (n <= 0) return [];
  const fresh = candidates
    .filter((a) => a.title?.trim() && a.published_at && !alreadyPosted.has(a.id))
    .sort((a, b) => (b.published_at! < a.published_at! ? -1 : b.published_at! > a.published_at! ? 1 : 0));
  const picked: CandidateArticle[] = [];
  const usedSections = new Set<string>();
  const usedSources = new Set<string>();
  // First pass: one per section+source; then relax to fill.
  for (const strict of [true, false]) {
    for (const a of fresh) {
      if (picked.length >= n) break;
      if (picked.includes(a)) continue;
      const section = a.vertical ?? "general";
      const source = a.source_id ?? "";
      if (strict && (usedSections.has(section) || usedSources.has(source))) continue;
      picked.push(a);
      usedSections.add(section);
      usedSources.add(source);
    }
    usedSections.clear();
    usedSources.clear();
  }
  return picked;
}

export function articleLink(id: string): string {
  return `${SITE_URL}/article/${id}`;
}

function plain(text: string | null | undefined, max: number): string {
  const s = (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

/** Facebook post text: headline, short summary. The link is attached separately. */
export function buildPostMessage(a: CandidateArticle): string {
  const title = (a.title ?? "").trim();
  const summary = plain(a.summary || a.what_happened, 280);
  return summary ? `${title}\n\n${summary}` : title;
}

/** Caption for a photo post: headline, summary and a clickable link to the article. */
export function buildPhotoCaption(a: CandidateArticle): string {
  return `${buildPostMessage(a)}\n\nRead more: ${articleLink(a.id)}`;
}
