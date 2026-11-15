/**
 * Editor highlights: a published story whose `featured_until` is still in the
 * future is kept at the top of the homepage (and its hub) until that time.
 */

/** Highlight lengths offered to editors, in hours. */
export const HIGHLIGHT_HOURS = [1, 2, 4, 8] as const;

export interface Highlightable {
  id: string;
  published_at: string;
  featured_until?: string | null;
}

export function isHighlighted(story: Pick<Highlightable, "featured_until">, now: Date = new Date()): boolean {
  const until = story.featured_until ? Date.parse(story.featured_until) : NaN;
  return Number.isFinite(until) && until > now.getTime();
}

/** The end time for a highlight of `hours` starting now. */
export function highlightUntil(hours: number, now: Date = new Date()): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

/**
 * Puts currently highlighted stories first (newest first), then the blended
 * pool without them. `extra` holds highlighted stories that may be older than
 * the pool, so they are found even when they no longer appear among the newest.
 */
export function pinHighlighted<T extends Highlightable>(pool: T[], extra: T[] = [], now: Date = new Date()): T[] {
  const pinned = new Map<string, T>();
  for (const s of [...extra, ...pool]) if (isHighlighted(s, now) && !pinned.has(s.id)) pinned.set(s.id, s);
  const top = [...pinned.values()].sort((a, b) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id));
  return [...top, ...pool.filter((s) => !pinned.has(s.id))];
}
