/** Helpers for the CySEC-licensed firms list (rows come from `regulated_entities`, source = 'cysec'). */

export interface LicenceRow {
  id: string;
  entity_name: string;
  license_type: string | null;
  license_number: string | null;
  status: string | null;
  license_date: string | null;
  last_seen_at: string | null;
  matched_company_id: string | null;
}

/** Only a licence the register lists as "Active" counts as current. Pending renunciations, suspensions,
 * withdrawals and former licences are shown only when the visitor asks for them. */
export function isCurrentLicence(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "active";
}

/** Merge spelling variants of the same licence type ("Investment Firm (CIF)" → "Cyprus Investment Firm (CIF)"). */
export function licenceTypeLabel(type: string | null | undefined): string {
  const t = (type ?? "").trim();
  if (!t) return "Other";
  if (/^investment firm \(cif\)$/i.test(t)) return "Cyprus Investment Firm (CIF)";
  if (/^small aifm$/i.test(t)) return "Alternative Investment Fund Manager (AIFM)";
  return t;
}

export interface LicenceGroup {
  type: string;
  rows: LicenceRow[];
}

/** Group rows by licence type, largest group first; firms sorted by name inside each group. */
export function groupByLicenceType(rows: LicenceRow[]): LicenceGroup[] {
  const map = new Map<string, LicenceRow[]>();
  for (const r of rows) {
    const key = licenceTypeLabel(r.license_type);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()]
    .map(([type, list]) => ({ type, rows: [...list].sort((a, b) => a.entity_name.localeCompare(b.entity_name)) }))
    .sort((a, b) => b.rows.length - a.rows.length || a.type.localeCompare(b.type));
}

export function filterLicences(rows: LicenceRow[], opts: { includeInactive: boolean; query: string; type: string | null }): LicenceRow[] {
  const q = opts.query.trim().toLowerCase();
  return rows.filter((r) =>
    (opts.includeInactive || isCurrentLicence(r.status)) &&
    (!opts.type || licenceTypeLabel(r.license_type) === opts.type) &&
    (!q || r.entity_name.toLowerCase().includes(q) || (r.license_number ?? "").toLowerCase().includes(q)),
  );
}
