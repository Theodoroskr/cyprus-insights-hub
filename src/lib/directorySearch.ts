export const DIRECTORY_PAGE_SIZE = 25;

/**
 * Turns what a visitor types into a bare registration number, if it looks like one.
 * Cyprus numbers are stored as digits only, but people type "HE 6771", "ΗΕ6771" or "C-12345".
 */
export function parseRegistrationNumber(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/^(HE|ΗΕ|ΗE|HΕ|C|Ε|E|OE|ΟΕ|AE|ΑΕ)[\s.\-/]*/u, "");
  const digits = cleaned.replace(/[\s.\-/]/g, "");
  return /^\d{1,7}$/.test(digits) ? digits.replace(/^0+(?=\d)/, "") : null;
}

/** Removes characters that would break a PostgREST `or(...)` filter. */
export function safeSearchTerm(input: string): string {
  return input.trim().replace(/[,()*%\\"]/g, " ").replace(/\s+/g, " ").trim();
}

export function pageCount(total: number, pageSize = DIRECTORY_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function pageRange(page: number, pageSize = DIRECTORY_PAGE_SIZE): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

/** Page numbers to show around the current page, with null for gaps ("…"). */
export function visiblePages(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export type CompanyBadge = { key: string; label: string; tone: "regulated" | "former" | "status" | "member" };

const INACTIVE_PREFIXES = ["dissolved", "struck", "liquidat", "voluntary liquidation", "court-ordered", "under receivership"];

/** Badges for a directory search card, most important first. */
export function companyCardBadges(c: {
  organisation_status?: string | null;
  cysec_licensed?: boolean | null;
  cysec_status?: string | null;
  cbc_supervised?: boolean | null;
  cbc_status?: string | null;
  icpac_registered?: boolean | null;
  bar_member?: boolean | null;
  cifa_member?: boolean | null;
}): CompanyBadge[] {
  const out: CompanyBadge[] = [];
  if (c.cbc_supervised) out.push({ key: "cbc", label: "CBC Supervised", tone: "regulated" });
  else if (c.cbc_status) out.push({ key: "cbc", label: "Former CBC", tone: "former" });
  if (c.cysec_licensed) out.push({ key: "cysec", label: "CySEC Licensed", tone: "regulated" });
  else if (c.cysec_status) out.push({ key: "cysec", label: "Former CySEC", tone: "former" });
  if (c.icpac_registered) out.push({ key: "icpac", label: "ICPAC", tone: "member" });
  if (c.bar_member) out.push({ key: "bar", label: "Bar Association", tone: "member" });
  if (c.cifa_member) out.push({ key: "cifa", label: "CIFA", tone: "member" });
  const status = (c.organisation_status || "").trim();
  if (status) {
    const lower = status.toLowerCase();
    if (lower === "active") out.push({ key: "status", label: "Active", tone: "status" });
    else if (INACTIVE_PREFIXES.some((p) => lower.startsWith(p))) out.push({ key: "status", label: status, tone: "former" });
  }
  return out;
}
