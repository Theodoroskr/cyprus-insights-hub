/**
 * Pictures a publisher puts on every page (its logo, crest or default "share" image) rather than a photo of the story.
 * Such a picture is treated as "no picture", so the story gets one of our own photos instead of the same logo as its neighbours.
 */
const OUR_SOURCE_PICTURES = /\/storage\/v1\/object\/public\/banner-images\/sources/i;

const GENERIC = [
  /logo/i, /meta[-_]?default/i, /default[-_]?meta/i, /social[-_]?default/i, /socialmedia/i, /og[-_]?(image|logo)/i,
  /twitter[-_]?seal/i, /\/samples?\//i, /fallback/i, /placeholder/i, /favicon/i, /\.svg(\?|$)/i, /[-_]share\.(png|jpe?g)/i,
  /diglosso/i, /emblem/i, /cystat_en/i, /slider_home/i, /banners\/icon/i, /background-govcy/i,
];

export function isGenericImage(raw: string | null | undefined): boolean {
  const url = (raw ?? "").trim();
  if (!url) return true;
  if (OUR_SOURCE_PICTURES.test(url)) return false;
  let path = "";
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return true;
    path = u.pathname + u.search;
  } catch {
    return true; // relative or broken address
  }
  if (path === "/" || path === "") return true;
  return GENERIC.some((re) => re.test(path));
}

/** The story's own picture, or null when it has none or only a publisher logo. */
export function ownStoryImage(raw: string | null | undefined): string | null {
  return isGenericImage(raw) ? null : raw!.trim();
}
