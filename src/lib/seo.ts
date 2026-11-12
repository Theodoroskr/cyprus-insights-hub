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

export interface RouteMeta {
  title: string;
  description: string;
  /** Hub vertical, picks the branded share image. */
  vertical?: string;
  /** Private or utility pages that should stay out of search results. */
  noindex?: boolean;
}

/**
 * Own search/share text for pages that don't render <SEOHead> themselves, so no two
 * public pages fall back to the same site-wide title and description.
 */
const ROUTE_META: Record<string, RouteMeta> = {
  "/compliance": {
    title: "ComplianceHub — Cyprus AML, Sanctions & Regulatory Compliance",
    description: "Cyprus compliance news, AML and sanctions alerts, a regulatory calendar, document templates and practical guidance for compliance officers.",
    vertical: "compliance",
  },
  "/sme": {
    title: "SMEHub — News, Funding & Tools for Cyprus Small Businesses",
    description: "Business news, grants and funding schemes, tax deadlines and practical tools for small and medium-sized enterprises in Cyprus.",
    vertical: "sme",
  },
  "/trade": {
    title: "Cyprus Trade & Import Analytics — CYSTAT Trade Data",
    description: "Cyprus import and export trends, top trading partners and product categories from official CYSTAT trade statistics, updated monthly.",
  },
  "/resources": {
    title: "Resource Hub — Cyprus Business Guides, Glossaries & Reports",
    description: "Guides, glossaries, compliance tools and intelligence reports for doing business in Cyprus and the EU, reviewed and kept up to date.",
  },
  "/news": {
    title: "Cyprus Business News & Insights",
    description: "The latest Cyprus business, finance, compliance, fintech and regtech news from official and trusted sources, in English.",
  },
  "/cookies": {
    title: "Cookie Policy",
    description: "Which cookies BusinessHub.cy uses, what they do, and how to change your cookie and analytics preferences.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How BusinessHub.cy collects, uses and protects your personal data, and the rights you have under the GDPR.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms that apply when you use BusinessHub.cy, its company directory, news, data dashboards and tools.",
  },
  "/dashboard": { title: "My Dashboard", description: "Your saved stories, watched companies and account settings on BusinessHub.cy.", noindex: true },
  "/reset-password": { title: "Reset Your Password", description: "Choose a new password for your BusinessHub.cy account.", noindex: true },
  "/editorial": { title: "Editorial Dashboard", description: "BusinessHub.cy editorial tools.", noindex: true },
  "/admin/sources": { title: "Content Sources", description: "BusinessHub.cy news source settings.", noindex: true },
  "/admin/users": { title: "User Management", description: "BusinessHub.cy user administration.", noindex: true },
  "/directory/admin": { title: "Directory Admin", description: "BusinessHub.cy company directory administration.", noindex: true },
  "/kyb/success": { title: "Report Order Confirmed", description: "Your BusinessHub.cy company report order was received.", noindex: true },
  "/kyb/cancelled": { title: "Report Order Cancelled", description: "Your BusinessHub.cy company report order was cancelled.", noindex: true },
};

/** Page-specific search text for a route, or null when the page sets its own. */
export function routeMeta(pathname: string): RouteMeta | null {
  const path = canonicalUrl(pathname).slice(SITE_URL.length) || "/";
  return ROUTE_META[path] ?? null;
}

/**
 * A search-listing description from page text: Markdown and extra spaces removed,
 * cut at a word boundary to about 155 characters. Falls back when the text is empty.
 */
export function metaDescription(text: string | null | undefined, fallback: string, max = 155): string {
  const plain = (text ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return fallback;
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\-–—\s]+$/, "")}…`;
}
