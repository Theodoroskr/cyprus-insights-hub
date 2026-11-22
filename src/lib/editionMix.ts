/** Slots per other pool: round(limit × share), trimmed from the last pool so the edition's own share is never rounded away. */
export function mixSlots(shares: number[], limit: number): number[] {
  const slots = shares.map((s) => Math.round(limit * s));
  let over = slots.reduce((a, b) => a + b, 0) - Math.round(limit * shares.reduce((a, b) => a + b, 0));
  for (let i = slots.length - 1; i >= 0 && over > 0; i--) { const cut = Math.min(over, slots[i]); slots[i] -= cut; over -= cut; }
  return slots;
}

/**
 * Take each other pool's share of `limit` (newest first), fill the rest from the edition's own pool;
 * no item twice (by `key`), short pools topped up from the own pool, result newest first.
 */
export function mixByShare<T>(own: T[], others: { items: T[]; share: number }[], limit: number, key: (t: T) => string, time: (t: T) => number): T[] {
  const used = new Set<string>();
  const newest = (pool: T[]) => [...pool].sort((a, b) => time(b) - time(a));
  const take = (pool: T[], n: number) => {
    const out: T[] = [];
    for (const i of newest(pool)) {
      if (out.length >= n) break;
      const k = key(i);
      if (used.has(k)) continue;
      used.add(k); out.push(i);
    }
    return out;
  };
  const slots = mixSlots(others.map((o) => o.share), limit);
  const mixed = others.flatMap((o, idx) => take(o.items, slots[idx]));
  const rest = take(own, limit - mixed.length);
  return newest([...rest, ...mixed]);
}

import { inEditionFeed } from "./rss";

/** Cyprus edition (homepage and RSS): 60% Cyprus, 25% International, 15% Greece. */
export const CYPRUS_HOME_MIX = { international: 0.25, greece: 0.15 } as const;

type MixRow = { id: string; published_at: string | null; title?: string | null; summary?: string | null; what_happened?: string | null; tags?: string[] | null; edition?: string[] | null };

/**
 * Interleave ordered lists so every stretch of the result follows the shares: each slot goes to the list
 * furthest behind its share (ties to the first list); exhausted lists are skipped, no item twice.
 */
export function interleaveByShare<T>(lists: { items: T[]; share: number }[], limit: number, key: (t: T) => string): T[] {
  const used = new Set<string>();
  const pos = lists.map(() => 0);
  const taken = lists.map(() => 0);
  const out: T[] = [];
  const next = (l: number) => {
    const items = lists[l].items;
    while (pos[l] < items.length && used.has(key(items[pos[l]]))) pos[l]++;
    return pos[l] < items.length ? items[pos[l]] : undefined;
  };
  while (out.length < limit) {
    let best = -1, bestGap = -Infinity;
    lists.forEach((l, idx) => {
      if (next(idx) === undefined) return;
      const gap = l.share * (out.length + 1) - taken[idx];
      if (gap > bestGap + 1e-9) { best = idx; bestGap = gap; }
    });
    if (best < 0) break;
    const item = next(best)!;
    used.add(key(item)); pos[best]++; taken[best]++; out.push(item);
  }
  return out;
}

/**
 * Cyprus homepage pool: Cyprus-edition rows split into Cyprus/International with the RSS rules, plus Greece-edition rows,
 * each put in reading order by `order`, then interleaved by `CYPRUS_HOME_MIX` so the top of the page keeps the shares too.
 */
export function cyprusHomeMix<T extends MixRow>(cyPool: T[], greece: T[], limit: number, order: (rows: T[]) => T[] = (r) => r): T[] {
  const newest = (rows: T[]) => order([...rows].sort((a, b) => (Date.parse(b.published_at ?? "") || 0) - (Date.parse(a.published_at ?? "") || 0)));
  const own = newest(cyPool.filter((r) => inEditionFeed(r as any, "cyprus")));
  const intl = newest(cyPool.filter((r) => inEditionFeed(r as any, "international")));
  const { international, greece: gr } = CYPRUS_HOME_MIX;
  return interleaveByShare(
    [{ items: own, share: 1 - international - gr }, { items: intl, share: international }, { items: newest(greece), share: gr }],
    limit,
    (r) => r.id,
  );
}
