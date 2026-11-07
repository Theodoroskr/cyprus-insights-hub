/**
 * Branded social-share (og:image / twitter:image) fallbacks per hub.
 * Used when a page or article has no image of its own, so shares on
 * social media always show the correct hub branding.
 *
 * Files live in public/images/ so they resolve to absolute URLs on the
 * published domain (crawlers require absolute https URLs).
 */

const BASE_URL = "https://businesshub.cy";

const OG_IMAGES: Record<string, string> = {
  general: `${BASE_URL}/images/og-businesshub.png`,
  business: `${BASE_URL}/images/og-businesshub.png`,
  sme: `${BASE_URL}/images/og-businesshub.png`,
  fintech: `${BASE_URL}/images/og-fintechhub.png`,
  compliance: `${BASE_URL}/images/og-compliancehub.png`,
  regtech: `${BASE_URL}/images/og-regtechhub.png`,
};

export const DEFAULT_OG_IMAGE = OG_IMAGES.general;

/** Branded share image for a hub vertical (falls back to BusinessHub). */
export function ogImageFor(vertical?: string | null): string {
  return OG_IMAGES[vertical ?? ""] ?? DEFAULT_OG_IMAGE;
}
