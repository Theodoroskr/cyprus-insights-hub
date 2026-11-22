// Validation for Transparency International CPI country-ranking workbooks
// ("Country Rankings" sheet: Country / Territory, ISO3, TI Region, CPI <year> Score, Global Rank).
// Shared by the editor upload preview (site) and the ingest-integrity "stage-cpi" action.

export type CpiRow = { country_iso3: string; country_name: string; region: string; score: number; rank: number; rank_tied: boolean };
export type CpiParse = { ok: true; year: number; rows: CpiRow[] } | { ok: false; errors: string[] };

export const CPI_SHEET = "Country Rankings";
export const CPI_REGIONS: Record<string, string> = {
  "WE/EU": "Western Europe & EU",
  ECA: "Eastern Europe & Central Asia",
  AME: "Americas",
  AP: "Asia Pacific",
  MENA: "Middle East & North Africa",
  SSA: "Sub-Saharan Africa",
};

const norm = (v: unknown) => String(v ?? "").trim();

/** Validates sheet rows (first row = headers). Every row must pass; nothing partial is returned. */
export function parseCpiSheet(table: unknown[][], expectedCount?: number): CpiParse {
  const errors: string[] = [];
  const head = (table[0] ?? []).map((h) => norm(h).toLowerCase());
  const col = (re: RegExp) => head.findIndex((h) => re.test(h));
  const ci = { name: col(/^country/), iso: col(/^iso3$/), region: col(/region/), score: col(/^cpi \d{4} score$/), rank: col(/rank/) };
  const missing = Object.entries(ci).filter(([, i]) => i < 0).map(([k]) => k);
  if (missing.length) return { ok: false, errors: [`Missing columns: ${missing.join(", ")}. Expected Country / Territory, ISO3, TI Region, CPI <year> Score, Global Rank.`] };
  const year = Number(/(\d{4})/.exec(head[ci.score])![1]);

  const rows: CpiRow[] = [];
  const seen = new Set<string>();
  table.slice(1).forEach((r, i) => {
    const line = i + 2;
    if (!r || r.every((c) => norm(c) === "")) return;
    const name = norm(r[ci.name]), iso = norm(r[ci.iso]).toUpperCase(), region = norm(r[ci.region]);
    const score = Number(r[ci.score]), rank = Number(r[ci.rank]);
    if (!name) errors.push(`Row ${line}: country name is empty`);
    if (!/^[A-Z]{3}$/.test(iso)) errors.push(`Row ${line}: "${iso}" is not a 3-letter country code`);
    else if (seen.has(iso)) errors.push(`Row ${line}: ${iso} appears twice`);
    if (!(region in CPI_REGIONS)) errors.push(`Row ${line}: unknown TI region "${region}"`);
    if (norm(r[ci.score]) === "" || !Number.isFinite(score) || score < 0 || score > 100) errors.push(`Row ${line}: score must be 0–100`);
    if (!Number.isInteger(rank) || rank < 1) errors.push(`Row ${line}: rank must be a whole number from 1`);
    seen.add(iso);
    rows.push({ country_iso3: iso, country_name: name, region, score, rank, rank_tied: false });
  });
  const n = rows.length;
  if (expectedCount != null && n !== expectedCount) errors.push(`Expected ${expectedCount} countries, found ${n}`);
  rows.forEach((r, i) => { if (r.rank > n) errors.push(`${r.country_iso3}: rank ${r.rank} is above ${n}`); void i; });
  // Ranks must follow scores: a higher score never ranks below a lower one, equal scores share a rank.
  const byRank = [...rows].sort((a, b) => a.rank - b.rank);
  for (let i = 1; i < byRank.length; i++) {
    const a = byRank[i - 1], b = byRank[i];
    if (b.score > a.score) errors.push(`${b.country_iso3} (${b.score}) ranks below ${a.country_iso3} (${a.score})`);
    if (b.score === a.score && b.rank !== a.rank) errors.push(`${a.country_iso3} and ${b.country_iso3} share a score but not a rank`);
  }
  if (errors.length) return { ok: false, errors: errors.slice(0, 20) };
  const counts = new Map<number, number>();
  rows.forEach((r) => counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1));
  rows.forEach((r) => (r.rank_tied = (counts.get(r.rank) ?? 0) > 1));
  return { ok: true, year, rows };
}

export type CpiChange = { iso: string; name: string; before: { score: number | null; rank: number | null } | null; after: { score: number; rank: number } | null };

/** Differences between the published rows of an edition and a staged/uploaded set. */
export function diffCpi(published: { country_iso3: string; country_name: string; score: number | null; rank: number | null }[], next: CpiRow[]) {
  const pub = new Map(published.map((p) => [p.country_iso3, p]));
  const nxt = new Map(next.map((r) => [r.country_iso3, r]));
  const added: CpiChange[] = [], changed: CpiChange[] = [], removed: CpiChange[] = [];
  for (const r of next) {
    const p = pub.get(r.country_iso3);
    const after = { score: r.score, rank: r.rank };
    if (!p) added.push({ iso: r.country_iso3, name: r.country_name, before: null, after });
    else if (Number(p.score) !== r.score || p.rank !== r.rank) changed.push({ iso: r.country_iso3, name: r.country_name, before: { score: p.score, rank: p.rank }, after });
  }
  for (const p of published) if (!nxt.has(p.country_iso3)) removed.push({ iso: p.country_iso3, name: p.country_name, before: { score: p.score, rank: p.rank }, after: null });
  return { added, changed, removed, unchanged: next.length - added.length - changed.length };
}
