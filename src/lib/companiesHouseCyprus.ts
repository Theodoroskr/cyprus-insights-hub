// Links to official certificates/reports on Companies House Cyprus.
export const CHC_BASE = "https://companieshousecyprus.com";

export const CHC_PRODUCTS = [
  { id: "certificate-of-good-standing", label: "Certificate of Good Standing" },
  { id: "cyprus-company-profile", label: "Cyprus Company Profile" },
  { id: "cyprus-credit-report", label: "Cyprus Credit Report" },
] as const;

export type ChcProduct = (typeof CHC_PRODUCTS)[number]["id"];

export interface ChcCompany {
  company_name: string;
  registration_no?: string | null;
  organisation_type?: string | null;
  organisation_sub_type?: string | null;
}

/** HE / AE / B prefix, or null when the firm must be looked up by name (partnerships). */
export function chcPrefix(c: ChcCompany): "HE" | "AE" | "B" | null {
  const t = `${c.organisation_type ?? ""} ${c.organisation_sub_type ?? ""}`.toLowerCase();
  if (/partnership|συνεταιρισμ/.test(t)) return null;
  if (/overseas|foreign|αλλοδαπ/.test(t)) return "AE";
  if (/business name|εμπορικ/.test(t)) return "B";
  return "HE";
}

export function chcSearchUrl(name: string): string {
  return `${CHC_BASE}/search?q=${encodeURIComponent(name.trim())}`;
}

export function chcCompanyUrl(c: ChcCompany, product?: ChcProduct): string {
  const reg = (c.registration_no ?? "").trim().replace(/\s+/g, "");
  const prefix = chcPrefix(c);
  if (!reg || !prefix) return chcSearchUrl(c.company_name);
  const id = /^(HE|AE|B)\d+$/i.test(reg) ? reg.toUpperCase() : `${prefix}${reg}`;
  const url = `${CHC_BASE}/company/${id}`;
  return product ? `${url}?product=${product}` : url;
}
