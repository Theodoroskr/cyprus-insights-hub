/** Picks the "Read next" stories shown right after a story's text. */
export interface ReadNextCandidate {
  id: string;
  title: string | null;
  tags?: string[] | null;
  source_id?: string | null;
  published_at?: string | null;
}

/**
 * Ranks candidates: stories sharing more topic tags first, then newest; drops the
 * current story and duplicate headlines, and lets one publisher fill at most half the list.
 */
export function pickReadNext<T extends ReadNextCandidate>(current: ReadNextCandidate, candidates: T[], limit = 4): T[] {
  const tags = new Set((current.tags ?? []).map((t) => t.toLowerCase()));
  const seenTitles = new Set<string>([(current.title ?? "").trim().toLowerCase()]);
  const scored = candidates
    .filter((c) => c.id !== current.id)
    .map((c) => ({ c, shared: (c.tags ?? []).filter((t) => tags.has(t.toLowerCase())).length }))
    .sort((a, b) => b.shared - a.shared || (b.c.published_at ?? "").localeCompare(a.c.published_at ?? ""));
  const perSource = new Map<string, number>();
  const cap = Math.max(1, Math.ceil(limit / 2));
  const out: T[] = [];
  const overflow: T[] = [];
  for (const { c } of scored) {
    const key = (c.title ?? "").trim().toLowerCase();
    if (!key || seenTitles.has(key)) continue;
    seenTitles.add(key);
    const src = c.source_id ?? "";
    const n = perSource.get(src) ?? 0;
    if (src && n >= cap) { overflow.push(c); continue; }
    perSource.set(src, n + 1);
    out.push(c);
    if (out.length === limit) return out;
  }
  return out.concat(overflow).slice(0, limit);
}
