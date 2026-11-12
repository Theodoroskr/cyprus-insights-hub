export interface BlendableNews {
  id: string;
  title: string;
  published_at: string;
  source_id?: string | null;
  source_url?: string | null;
  vertical: string;
}

/** How far an older story may move ahead of a newer one to break up a batch. */
export const BLEND_WINDOW_HOURS = 24;
/** How many recent slots are checked when avoiding a repeated source. */
const RECENT_SLOTS = 4;

/**
 * The publisher behind a story. Scraped stories carry `source_id` as
 * "<source-slug>:<title-key>", so only the slug identifies the publisher.
 */
export function newsSource(article: BlendableNews): string {
  if (article.source_id) return article.source_id.split(":")[0] || article.source_id;
  try {
    return new URL(article.source_url ?? "").hostname.replace(/^www\./, "");
  } catch {
    return `unknown:${article.id}`;
  }
}

const time = (a: BlendableNews) => Date.parse(a.published_at) || 0;

/**
 * Newest story stays first; after that, stories published within
 * BLEND_WINDOW_HOURS of the newest remaining one are mixed so a single
 * publisher's batch (e.g. ten ICPAC circulars at once) is spread out.
 * Publication dates are never changed.
 */
export function blendNews<T extends BlendableNews>(articles: T[]): T[] {
  const sorted = [...articles].sort((a, b) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const remaining: T[] = [];
  for (const article of sorted) {
    const day = article.published_at.slice(0, 10);
    const title = article.title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const key = title ? `${day}|${newsSource(article)}|${title}` : article.id;
    if (seen.has(key)) continue;
    seen.add(key);
    remaining.push(article);
  }

  const windowMs = BLEND_WINDOW_HOURS * 3_600_000;
  const result: T[] = [];
  while (remaining.length) {
    const previous = result[result.length - 1];
    const recent = result.slice(-RECENT_SLOTS).map(newsSource);
    const earliest = time(remaining[0]) - windowMs;
    let best = 0;
    let bestScore = Infinity;
    for (let i = 0; i < remaining.length && time(remaining[i]) >= earliest; i++) {
      const a = remaining[i];
      const source = newsSource(a);
      // Fewest appearances in the last few slots wins, then a different topic, then recency.
      const score = recent.filter(s => s === source).length * 4
        + (previous && source === newsSource(previous) ? 2 : 0)
        + (previous && a.vertical === previous.vertical ? 1 : 0);
      if (score < bestScore) { bestScore = score; best = i; if (score === 0) break; }
    }
    result.push(remaining.splice(best, 1)[0]);
  }
  return result;
}
