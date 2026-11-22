import { isGenericImage, ownStoryImage } from "../../supabase/functions/_shared/genericImage";
export { isGenericImage };

const files = import.meta.glob("@/assets/fallback/branded/*.jpg", { eager: true, import: "default" }) as Record<string, string>;

const BY_VERTICAL: Record<string, string[]> = {};
for (const [path, url] of Object.entries(files)) {
  const hub = path.split("/").pop()!.replace(/(-\d+)?\.jpg$/, "");
  (BY_VERTICAL[hub] ||= []).push(url);
}
const ALL = new Set(Object.values(files));
const ALIAS: Record<string, string> = { general: "business", sme: "business", business: "business", fintech: "fintech", compliance: "compliance", regtech: "regtech" };
export const FALLBACK_IMAGE = BY_VERTICAL.business[0];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Pick one of our own photos for this hub; the same seed always gives the same photo. */
export function fallbackFor(vertical?: string | null, seed?: string | null): string {
  const list = BY_VERTICAL[ALIAS[(vertical || "").toLowerCase()] || "business"];
  return list[hash(seed || "") % list.length];
}

/** Use the article image when present, otherwise one of our own images for that hub. */
export function articleImage(url?: string | null, vertical?: string | null, seed?: string | null): string {
  return ownStoryImage(url) ?? fallbackFor(vertical, seed);
}

/** Swap any broken article/story photo for our own image (skips logos, avatars, banners). */
export function installImageFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target as HTMLImageElement;
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.noFallback !== undefined) return;
      if (img.closest("[data-banner-slot]")) return;
      // Whole class names only: "[&.img-contain]:object-contain" on story photos must not count as a logo
      if (/(^|\s)(rounded-full|object-contain)(\s|$)/.test(img.className)) return;
      if (ALL.has(img.getAttribute("src") || "")) return;
      img.srcset = "";
      img.src = fallbackFor(img.dataset.vertical, img.dataset.seed || img.alt || img.src);
    },
    true,
  );
}

/** Story photo: its own main photo, else first photo in its text, else our hub photo. */
export function storyImage(url?: string | null, vertical?: string | null, seed?: string | null, body?: string | null): string {
  const inText = [...(body || "").matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/g)].map((m) => m[1]).find((u) => !isGenericImage(u));
  return articleImage(ownStoryImage(url) ?? inText ?? null, vertical, seed);
}

/** Swap a picture that repeats one shown just before it (within the last few cards) for a different hub photo, so nearby cards never look the same. */
export function distinctNeighbours(images: string[], verticals: (string | null | undefined)[] = []): string[] {
  const out: string[] = [];
  images.forEach((img, i) => {
    const list = BY_VERTICAL[ALIAS[(verticals[i] || "").toLowerCase()] || "business"];
    const recent = out.slice(Math.max(0, i - (list.length - 1)));
    if (!recent.includes(img)) { out.push(img); return; }
    const start = Math.max(0, list.indexOf(img)) + 1;
    let pick = list.map((_, k) => list[(start + k) % list.length]).find((c) => !recent.includes(c));
    if (!pick) pick = list.map((_, k) => list[(start + k) % list.length]).find((c) => c !== out[i - 1]) ?? img;
    out.push(pick);
  });
  return out;
}

type StoryRow = { id?: string | null; image_url?: string | null; vertical?: string | null; body_markdown?: string | null };
const listCache = new WeakMap<readonly StoryRow[], string[]>();
/** Picture for row `i` of a story list, chosen so nearby rows never show the same picture. */
export function listImage(rows: readonly StoryRow[], i: number): string {
  let imgs = listCache.get(rows);
  if (!imgs) {
    imgs = distinctNeighbours(rows.map((a) => storyImage(a.image_url, a.vertical, a.id, a.body_markdown)), rows.map((a) => a.vertical));
    listCache.set(rows, imgs);
  }
  return imgs[i];
}
