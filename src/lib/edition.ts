import { useLocation } from "react-router-dom";

/** Flip to true once businesshub.gr is connected and live. */
export const GR_DOMAIN_LIVE = false;
export const GR_HOST = "https://businesshub.gr";
export const GR_PREFIX = "/greece";

export type Edition = "cy" | "gr";

export function editionFromLocation(hostname: string, pathname: string): Edition {
  if (/(^|\.)businesshub\.gr$/i.test(hostname)) return "gr";
  return pathname === GR_PREFIX || pathname.startsWith(`${GR_PREFIX}/`) ? "gr" : "cy";
}

/** Canonical URL of a Greece-edition path (/greece/...) — .gr host once live. */
export function greeceCanonical(path: string, cySite: string): string | null {
  if (!(path === GR_PREFIX || path.startsWith(`${GR_PREFIX}/`))) return null;
  if (!GR_DOMAIN_LIVE) return null;
  const rest = path.slice(GR_PREFIX.length) || "/";
  return `${GR_HOST}${rest}`;
}

export function useEdition(): Edition {
  const { pathname } = useLocation();
  return editionFromLocation(typeof window !== "undefined" ? window.location.hostname : "", pathname);
}

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
