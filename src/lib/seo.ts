export const SITE_NAME = "BusinessHub.cy";
export const SITE_URL = "https://businesshub.cy";
export const SITE_TITLE = "BusinessHub.cy — Cyprus Business Intelligence Platform";
export const SITE_DESCRIPTION =
  "Cyprus business intelligence — company directory, compliance updates, fintech regulation, trade data, and SME tools for professionals.";
export const SITE_IMAGE = `${SITE_URL}/images/og-businesshub.png`;

/**
 * The page's own public address, used for <link rel="canonical"> and og:url.
 * Drops query strings, hashes and trailing slashes so one page has one address.
 */
export function canonicalUrl(pathname: string): string {
  let path = (pathname || "/").split(/[?#]/)[0];
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export interface StaticPreview {
  title: string;
  description: string;
  image: string;
  type: string;
}

/**
 * Reads the page-specific preview tags baked into the served HTML (e.g. the per-story
 * files written at publish time). Returns null when only the site-wide fallbacks are present.
 * The app keeps these until the page's own data loads, so link-preview robots that snapshot
 * the page early never see the generic site title instead of the story's.
 */
export function readStaticPreview(doc: Pick<Document, "querySelector">): StaticPreview | null {
  const meta = (sel: string) => doc.querySelector(sel)?.getAttribute("content")?.trim() ?? "";
  const title = meta('meta[property="og:title"]');
  if (!title || title === SITE_TITLE) return null;
  return {
    title,
    description: meta('meta[property="og:description"]') || meta('meta[name="description"]') || SITE_DESCRIPTION,
    image: meta('meta[property="og:image"]') || SITE_IMAGE,
    type: meta('meta[property="og:type"]') || "website",
  };
}
