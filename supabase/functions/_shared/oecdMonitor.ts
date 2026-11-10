// Pure helpers for monitoring OECD Cyprus financial-literacy publications via Crossref metadata (no PDF parsing).
export type Pub = { doi: string; title: string; issued: string | null; deposited: string | null };

const dateOf = (p: { "date-parts"?: (number | null)[][] } | undefined) => {
  const d = p?.["date-parts"]?.[0];
  return d && d[0] ? [d[0], d[1] ?? 1, d[2] ?? 1].map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-") : null;
};

// deno-lint-ignore no-explicit-any
export function relevantPubs(items: any[]): Pub[] {
  return (items ?? [])
    .map((it) => ({ doi: String(it.DOI ?? "").toLowerCase(), title: String(it.title?.[0] ?? ""), issued: dateOf(it.issued), deposited: it.deposited?.["date-time"] ?? null }))
    .filter((p) => p.doi.startsWith("10.1787/") && !/^10\.1787\/888\d+$/.test(p.doi) && /cyprus/i.test(p.title) && /financ/i.test(p.title));
}

/** New DOIs, and known DOIs whose metadata was re-deposited (possible revision). */
export function comparePubs(found: Pub[], known: Pub[]) {
  const byDoi = new Map(known.map((k) => [k.doi, k]));
  return {
    added: found.filter((f) => !byDoi.has(f.doi)),
    changed: found.filter((f) => { const k = byDoi.get(f.doi); return k && k.deposited && f.deposited && k.deposited !== f.deposited; }),
  };
}
