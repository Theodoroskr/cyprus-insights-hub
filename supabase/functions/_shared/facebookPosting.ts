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

/** Publisher of a story: the part of `source_id` before ":" (e.g. "oecd:some-release" -> "oecd"). */
export function sourceKey(a: Pick<CandidateArticle, "source_id">): string {
  return (a.source_id ?? "").split(":")[0];
}

/** The story's own picture address, or null when it has none (the post then uses a section picture). */
function ownPicture(a: CandidateArticle): string | null {
  return hasOwnPhoto(a) ? a.image_url!.trim() : null;
}

/**
 * Pick up to `n` not-yet-posted stories, newest first, mixing sections and publishers:
 * first stories whose section and publisher were not posted today nor in this run, then ones new to this run, then any.
 * A story whose picture was already used today (or in this run) is never picked, so posts don't repeat a photo.
 * `postedToday` = stories already posted today on this account.
 */
export function pickArticles(
  candidates: CandidateArticle[], alreadyPosted: Set<string>, n: number,
  postedTitles: string[] = [], postedToday: CandidateArticle[] = [],
): CandidateArticle[] {
  if (n <= 0) return [];
  const seen = [...postedTitles];
  const fresh = candidates
    .filter((a) => a.title?.trim() && a.published_at && !alreadyPosted.has(a.id) && !postedTitles.some((t) => isSameHeadline(a.title, t)))
    .sort((a, b) => (b.published_at! < a.published_at! ? -1 : b.published_at! > a.published_at! ? 1 : 0));
  const picked: CandidateArticle[] = [];
  const pictures = new Set(postedToday.map(ownPicture).filter(Boolean) as string[]);
  const todaySections = new Set(postedToday.map((a) => a.vertical ?? "general"));
  const todaySources = new Set(postedToday.map(sourceKey));
  // Tier 0: new section + publisher for today; tier 1: new for this run; tier 2: fill.
  for (const tier of [0, 1, 2]) {
    for (const a of fresh) {
      if (picked.length >= n) break;
      if (picked.includes(a)) continue;
      const section = a.vertical ?? "general";
      const source = sourceKey(a);
      if (tier === 0 && (todaySections.has(section) || todaySources.has(source))) continue;
      if (tier <= 1 && picked.some((p) => (p.vertical ?? "general") === section || sourceKey(p) === source)) continue;
      const pic = ownPicture(a);
      if (pic && pictures.has(pic)) continue;
      if (seen.some((t) => isSameHeadline(a.title, t))) continue;
      picked.push(a);
      seen.push(a.title!);
      if (pic) pictures.add(pic);
    }
  }
  return picked;
}

const STOP = new Set(["the", "and", "for", "with", "from", "into", "that", "this", "its", "are", "was", "has", "have", "new", "between", "about"]);
function headlineWords(t: string): string[] {
  return (t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((w) => /\d/.test(w) || (w.length >= 3 && !STOP.has(w)));
}

/**
 * True when two headlines describe the same story (e.g. the same release picked up from two sources):
 * identical wording, or every key word of the shorter headline appears in the longer one with the same numbers.
 */
export function isSameHeadline(a: string | null | undefined, b: string | null | undefined): boolean {
  const wa = headlineWords(a ?? ""), wb = headlineWords(b ?? "");
  if (!wa.length || !wb.length) return false;
  if (wa.join(" ") === wb.join(" ")) return true;
  const nums = (w: string[]) => w.filter((x) => /\d/.test(x)).sort().join(",");
  if (nums(wa) !== nums(wb)) return false;
  const [short, long] = wa.length <= wb.length ? [wa, new Set(wb)] : [wb, new Set(wa)];
  return short.length >= 5 && short.every((w) => long.has(w));
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
