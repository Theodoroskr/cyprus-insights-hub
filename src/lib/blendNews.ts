export interface BlendableNews {
  id: string;
  title: string;
  published_at: string;
  source_id?: string | null;
  source_url?: string | null;
  vertical: string;
}

export function newsSource(article: BlendableNews): string {
  if (article.source_id) return article.source_id;
  try {
    return new URL(article.source_url ?? "").hostname.replace(/^www\./, "");
  } catch {
    return `unknown:${article.id}`;
  }
}

/** Keep dates newest-first, but alternate sources and topics within each UTC day. */
export function blendNews<T extends BlendableNews>(articles: T[]): T[] {
  const sorted = [...articles].sort((a, b) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id));
  const days = new Map<string, T[]>();
  const seen = new Set<string>();
  for (const article of sorted) {
    const day = article.published_at.slice(0, 10);
    const title = article.title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const key = title ? `${day}|${newsSource(article)}|${title}` : article.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const group = days.get(day) ?? [];
    group.push(article);
    days.set(day, group);
  }
  const result: T[] = [];
  for (const group of days.values()) {
    const remaining = [...group];
    while (remaining.length) {
      const previous = result[result.length - 1];
      let index = previous ? remaining.findIndex(a => newsSource(a) !== newsSource(previous) && a.vertical !== previous.vertical) : 0;
      if (index < 0 && previous) index = remaining.findIndex(a => newsSource(a) !== newsSource(previous));
      if (index < 0) index = 0;
      const [next] = remaining.splice(index, 1);
      if (next) result.push(next);
    }
  }
  return result;
}