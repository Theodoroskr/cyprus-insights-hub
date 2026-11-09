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
