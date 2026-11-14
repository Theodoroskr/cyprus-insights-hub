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
  return url && url.trim() ? url : fallbackFor(vertical, seed);
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
      if (/rounded-full|object-contain/.test(img.className)) return;
      if (ALL.has(img.getAttribute("src") || "")) return;
      img.srcset = "";
      img.src = fallbackFor(img.dataset.vertical, img.dataset.seed || img.alt || img.src);
    },
    true,
  );
}

/** Story photo: its own main photo, else first photo in its text, else our hub photo. */
export function storyImage(url?: string | null, vertical?: string | null, seed?: string | null, body?: string | null): string {
  const m = (body || "").match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/);
  return articleImage(url || (m ? m[1] : null), vertical, seed);
}

/** Swap any picture that matches the one right before it for a different hub photo, so neighbouring cards never look the same. */
export function distinctNeighbours(images: string[], verticals: (string | null | undefined)[] = []): string[] {
  const out: string[] = [];
  images.forEach((img, i) => {
    const prev = out[i - 1];
    if (i === 0 || img !== prev) { out.push(img); return; }
    const list = BY_VERTICAL[ALIAS[(verticals[i] || "").toLowerCase()] || "business"];
    const start = Math.max(0, list.indexOf(img)) + 1;
    let pick = img;
    for (let k = 0; k < list.length; k++) {
      const c = list[(start + k) % list.length];
      if (c !== prev) { pick = c; break; }
    }
    out.push(pick);
  });
  return out;
}
