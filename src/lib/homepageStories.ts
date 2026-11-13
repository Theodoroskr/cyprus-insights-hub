/**
 * Splits the homepage's blended story pool into its blocks so no story appears twice:
 * lead + three stories, a strictly newest-first "Latest" column, an optional
 * "Full coverage" story package, then the continuing feed.
 */

import { newsSource } from "@/lib/blendNews";

export interface HomeStory {
  id: string;
  title: string;
  published_at: string;
  vertical: string;
  tags?: string[] | null;
  source_id?: string | null;
  source_url?: string | null;
  [key: string]: unknown;
}

/** An approved news↔company link (only approved links are readable by visitors). */
export interface PackageLink {
  article_id: string;
  entity_id: string;
  entity_label: string;
  href: string | null;
}

export interface StoryPackage {
  kind: "company" | "topic";
  label: string;
  href: string;
  stories: HomeStory[];
}

export const HUB_COUNT = 4;
export const LATEST_COUNT = 6;
export const FEED_COUNT = 12;
/** A package groups stories from the 72 hours before the newest story. */
export const PACKAGE_WINDOW_HOURS = 72;
/** A package needs at least this many stories not already shown higher up the page. */
export const PACKAGE_MIN = 3;
export const PACKAGE_MAX = 5;

/** Tags too broad to make a meaningful package. */
const BROAD_TOPICS = new Set([
  "cyprus", "eu", "europe", "compliance", "fintech", "regtech", "sme", "business", "news",
  "general", "eu policy", "cyprus government", "economy", "finance",
]);

export const topicKey = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Editors' topic tags are capitalised ("Sanctions", "EU Funding"); all-lowercase tags such as
 * "pio-gov-cy" or "eurostat" are publisher labels added by the scraper, not topics.
 */
export function isPackageTopic(tag: string | null | undefined): boolean {
  const t = (tag ?? "").trim();
  if (t.length < 3 || !/[A-Z]/.test(t)) return false;
  return !BROAD_TOPICS.has(topicKey(t));
}

const time = (s: HomeStory) => new Date(s.published_at).getTime();
const newestFirst = (a: HomeStory, b: HomeStory) => time(b) - time(a) || a.id.localeCompare(b.id);

export function pickStoryPackage(pool: HomeStory[], links: PackageLink[], shown: Set<string>): StoryPackage | null {
  if (pool.length === 0) return null;
  const newest = Math.max(...pool.map(time));
  const cutoff = newest - PACKAGE_WINDOW_HOURS * 3600_000;
  const candidates = new Map(pool.filter((s) => time(s) >= cutoff && !shown.has(s.id)).map((s) => [s.id, s]));

  type Group = { kind: StoryPackage["kind"]; label: string; href: string; ids: Set<string> };
  const groups = new Map<string, Group>();
  const add = (key: string, base: Omit<Group, "ids">, id: string) => {
    const g = groups.get(key) ?? { ...base, ids: new Set<string>() };
    g.ids.add(id);
    groups.set(key, g);
  };

  for (const l of links) {
    if (!candidates.has(l.article_id) || !l.href) continue;
    add(`c:${l.entity_id}`, { kind: "company", label: l.entity_label, href: l.href }, l.article_id);
  }
  for (const s of candidates.values()) {
    const seen = new Set<string>();
    for (const tag of s.tags ?? []) {
      if (!isPackageTopic(tag)) continue;
      const key = topicKey(tag);
      if (seen.has(key)) continue;
      seen.add(key);
      add(`t:${key}`, { kind: "topic", label: tag.trim(), href: `/search?q=${encodeURIComponent(tag.trim())}` }, s.id);
    }
  }

  // A topic package must draw on more than one publisher, so one source's batch is never a "package".
  const publishers = (g: Group) => new Set([...g.ids].map((id) => newsSource(candidates.get(id)!))).size;
  const ranked = [...groups.values()]
    .filter((g) => g.ids.size >= PACKAGE_MIN && (g.kind === "company" || publishers(g) >= 2))
    .map((g) => ({ g, stories: [...g.ids].map((id) => candidates.get(id)!).sort(newestFirst) }))
    .sort((a, b) =>
      b.stories.length - a.stories.length ||
      (a.g.kind === b.g.kind ? 0 : a.g.kind === "company" ? -1 : 1) ||
      time(b.stories[0]) - time(a.stories[0]) ||
      a.g.label.localeCompare(b.g.label));

  const best = ranked[0];
  if (!best) return null;
  return { kind: best.g.kind, label: best.g.label, href: best.g.href, stories: best.stories.slice(0, PACKAGE_MAX) };
}

export function partitionHomepage<T extends HomeStory>(pool: T[], links: PackageLink[] = []) {
  const hub = pool.slice(0, HUB_COUNT);
  const shown = new Set(hub.map((s) => s.id));
  const latest = pool.slice(HUB_COUNT).sort(newestFirst).slice(0, LATEST_COUNT);
  latest.forEach((s) => shown.add(s.id));
  const pkg = pickStoryPackage(pool, links, shown);
  pkg?.stories.forEach((s) => shown.add(s.id));
  const feed = pool.filter((s) => !shown.has(s.id)).slice(0, FEED_COUNT);
  return { hub, latest, pkg: pkg as (StoryPackage & { stories: T[] }) | null, feed };
}
