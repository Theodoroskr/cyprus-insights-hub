import { useLocation } from "react-router-dom";

/** Flip to true once businesshub.gr is connected, live, and businesshub.cy is no longer the primary domain: Greece pages on .cy then move to .gr. */
export const GR_DOMAIN_LIVE = false;
export const GR_HOST = "https://businesshub.gr";
export const GR_PREFIX = "/greece";

export type Edition = "cy" | "gr";

export const CY_HOST = "https://businesshub.cy";

/**
 * Flip to true once businesshub.cy is the primary domain (so it no longer forwards to bhubnetwork.com):
 * bhubnetwork.com then opens on the International edition and sends Cyprus-only pages to businesshub.cy.
 * Until then bhubnetwork.com still carries the whole Cyprus site, and the International edition lives at /intl.
 */
export const INTL_DOMAIN_LIVE = false;
export const INTL_HOST = "https://bhubnetwork.com";
/** The International edition's own address on every host (the home of bhubnetwork.com once live). */
export const INTL_PATH = "/intl";

/** bhubnetwork.com or www.bhubnetwork.com. */
export function isIntlHostname(hostname: string): boolean {
  return /(^|\.)bhubnetwork\.com$/i.test(hostname);
}

/** True in the browser when the page was opened on bhubnetwork.com and that address carries the International edition. */
export function onIntlHost(live: boolean = INTL_DOMAIN_LIVE): boolean {
  return live && typeof window !== "undefined" && isIntlHostname(window.location.hostname);
}

/** Paths bhubnetwork.com shows itself once live: the International home, story pages and the Greece–Cyprus comparison. */
export function servedOnIntlHost(path: string): boolean {
  return path === "/" || path === INTL_PATH || path === "/article" || path.startsWith("/article/") || path === COMPARE_PATH;
}

/** businesshub.gr or www.businesshub.gr. */
export function isGrHostname(hostname: string): boolean {
  return /(^|\.)businesshub\.gr$/i.test(hostname);
}

/** True in the browser when the page was opened on businesshub.gr. */
export function onGrHost(): boolean {
  return typeof window !== "undefined" && isGrHostname(window.location.hostname);
}

export function isGreecePath(path: string): boolean {
  return path === GR_PREFIX || path.startsWith(`${GR_PREFIX}/`);
}

/** A businesshub.gr address ("/", "/banking", "/org/eurobank") → the app's own /greece path. Other paths are unchanged. */
export function grHostToAppPath(path: string): string {
  const p = (path || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (p === "/") return GR_PREFIX;
  if (/^\/org\/[^/]+$/.test(p)) return `${GR_PREFIX}${p}`;
  const one = /^\/([^/]+)$/.exec(p);
  if (one && (GR_SECTIONS.some((s) => s.slug === one[1]) || GR_PAGES.some((s) => s.slug === one[1]))) return `${GR_PREFIX}${p}`;
  return p;
}

/** An app /greece path as it is written on the current host: "/greece/banking" → "/banking" on businesshub.gr. */
export function grHref(appPath: string, gr: boolean = onGrHost()): string {
  if (!gr || !isGreecePath(appPath)) return appPath;
  return appPath.slice(GR_PREFIX.length) || "/";
}

/** Paths businesshub.gr shows itself: the Greece edition and story pages (incl. the Cyprus/International blend). */
export function servedOnGrHost(path: string): boolean {
  return isGreecePath(grHostToAppPath(path)) || path === "/article" || path.startsWith("/article/") || path === COMPARE_PATH;
}

const CY_HOSTS = ["businesshub.cy", "www.businesshub.cy", "cyprus-biz-connect.lovable.app"];

/**
 * Where a visitor must be sent before the app starts, or null to stay.
 * - businesshub.gr: /greece/... addresses lose the prefix; Cyprus-only sections open on businesshub.cy.
 * - businesshub.cy: once the .gr domain is live, Greece edition pages move to businesshub.gr.
 * - bhubnetwork.com (once INTL_DOMAIN_LIVE): opens on the International edition; Cyprus-only pages open on businesshub.cy, and /intl elsewhere moves there.
 * - www.businesshub.cy and the old Lovable address keep sending visitors to businesshub.cy (also when it is not the primary domain).
 */
export function hostRedirect(hostname: string, pathname: string, search = "", live: boolean = GR_DOMAIN_LIVE, intlLive: boolean = INTL_DOMAIN_LIVE): string | null {
  const h = hostname.toLowerCase();
  if (isIntlHostname(h)) {
    if (!intlLive) return null; // bhubnetwork.com still carries the whole site until businesshub.cy is primary
    if (pathname === INTL_PATH) return `${INTL_HOST}/${search}`;
    if (!servedOnIntlHost(pathname)) return `${CY_HOST}${pathname}${search}`;
    return h === "bhubnetwork.com" ? null : `${INTL_HOST}${pathname}${search}`;
  }
  if (isGrHostname(h)) {
    if (isGreecePath(pathname)) return `${GR_HOST}${grHref(pathname, true)}${search}`;
    if (!servedOnGrHost(pathname)) return `${CY_HOST}${pathname}${search}`;
    return h === "businesshub.gr" ? null : `${GR_HOST}${pathname}${search}`;
  }
  if (!CY_HOSTS.includes(h)) return null; // previews and local development stay put
  if (intlLive && pathname === INTL_PATH) return `${INTL_HOST}/${search}`;
  if (live && isGreecePath(pathname)) return `${GR_HOST}${grHref(pathname, true)}${search}`;
  return h === "businesshub.cy" ? null : `${CY_HOST}${pathname}${search}`;
}

/** Public address of a Greece edition page or a Greece-only story: businesshub.gr once live, else businesshub.cy. */
export function greeceUrl(appPath: string, live: boolean = GR_DOMAIN_LIVE): string {
  return live ? `${GR_HOST}${grHref(appPath, true)}` : `${CY_HOST}${appPath}`;
}

export function editionFromLocation(hostname: string, pathname: string): Edition {
  if (isGrHostname(hostname)) return "gr";
  return pathname === GR_PREFIX || pathname.startsWith(`${GR_PREFIX}/`) ? "gr" : "cy";
}

/** Canonical URL of a Greece-edition path (/greece/...) — .gr host once live. */
export function greeceCanonical(path: string, cySite: string, live: boolean = GR_DOMAIN_LIVE || onGrHost()): string | null {
  void cySite;
  if (!isGreecePath(path)) return null;
  if (!live) return null;
  const rest = path.slice(GR_PREFIX.length) || "/";
  return `${GR_HOST}${rest}`;
}

export function useEdition(): Edition {
  const { pathname } = useLocation();
  return editionFromLocation(typeof window !== "undefined" ? window.location.hostname : "", pathname);
}

/** Greece–Cyprus comparison: same address on both domains. */
export const COMPARE_PATH = "/compare/greece-cyprus";

/** Data pages of the Greece edition (not story sections). */
export const GR_PAGES = [
  { slug: "business-pulse", el: "Οικονομικοί Δείκτες Ελλάδας", en: "Greece Business Pulse" },
  { slug: "opportunities", el: "Δημόσιοι Διαγωνισμοί", en: "Opportunities" },
] as const;

export const GR_SECTIONS = [
  { slug: "business", el: "Επιχειρήσεις", en: "Business" },
  { slug: "banking", el: "Τράπεζες & Χρηματοοικονομικά", en: "Banking & Finance" },
  { slug: "announcements", el: "Εταιρικές Ανακοινώσεις", en: "Company Announcements" },
  { slug: "funding", el: "Χρηματοδοτήσεις & Διαγωνισμοί", en: "Funding & Tenders" },
  { slug: "indicators", el: "Οικονομικοί Δείκτες", en: "Economic Indicators" },
  { slug: "fintech", el: "FinTech & Συμμόρφωση", en: "FinTech & Compliance" },
  { slug: "greece-cyprus", el: "Ελλάδα–Κύπρος", en: "Greece–Cyprus" },
] as const;

export const BANKING_FILTERS = [
  { tag: "Financial Results", el: "Οικονομικά αποτελέσματα" },
  { tag: "Corporate Announcements", el: "Εταιρικές ανακοινώσεις" },
  { tag: "SME Finance", el: "Χρηματοδότηση ΜμΕ" },
  { tag: "Payments & FinTech", el: "Πληρωμές & FinTech" },
] as const;

export const ANALYSIS_LABELS = {
  el: ["Τι συνέβη", "Γιατί έχει σημασία", "Τι να κάνετε"],
  en: ["What happened", "Why it matters", "What to do"],
} as const;
