import { isInternationalStory } from "@/lib/storyOrigin";

type BlendStory = { title: string; summary: string | null; what_happened?: string | null; tags: string[] | null; greece_related?: boolean | null };

/**
 * businesshub.gr is mainly Greece with a smaller Cyprus and International blend:
 * Cyprus Edition stories split into the two blocks, Greece-related ones first, newest order kept otherwise.
 */
export function blendBlocks<T extends BlendStory>(rows: T[], size = 4): { cyprus: T[]; international: T[] } {
  const greeceFirst = (a: T, b: T) => Number(!!b.greece_related) - Number(!!a.greece_related);
  const intl = rows.filter((r) => isInternationalStory(r));
  const cyprus = rows.filter((r) => !isInternationalStory(r));
  return { cyprus: [...cyprus].sort(greeceFirst).slice(0, size), international: [...intl].sort(greeceFirst).slice(0, size) };
}

type FillStory = BlendStory & { id: string; vertical?: string | null; summary_el?: string | null; title_el?: string | null };

/** Topic match for each Greece section, used to pick Cyprus Edition stories (International and Cyprus) that belong there. */
export const SECTION_TOPICS: Record<string, { verticals?: string[]; re?: RegExp }> = {
  business: { verticals: ["sme", "general", "tourism", "energy"] },
  banking: { re: /\b(banks?|banking|lender|loans?|credit|deposits?|ecb|eba|interest rates?|bonds?|insur\w*)\b|τράπεζ|δάνει/i },
  announcements: { re: /\b(announc\w*|results|own shares|buyback|dividend|general meeting|listed|stock exchange|ipo|merger|acquisition)\b|ανακοίνωσ/i },
  funding: { re: /\b(fund(s|ing)?|grants?|tenders?|subsid\w*|investments?|venture|eib|eif|recovery and resilience|rrf|programme)\b|χρηματοδότ|επιδότ|διαγωνισμ/i },
  indicators: { re: /\b(inflation|gdp|unemployment|employment|index|statistic\w*|eurostat|cystat|elstat|growth|deficit|surplus|debt|prices|quarter)\b|πληθωρισμ|ανεργ|ΑΕΠ/i },
  fintech: { verticals: ["fintech", "regtech", "compliance"] },
  "greece-cyprus": {},
};

/**
 * A Greece section page: its own Greece-edition stories first, then matching Cyprus Edition stories —
 * Greece-related ones, then International, then a few Cyprus ones (the section stays mainly Greece).
 * "greece-cyprus" takes only Greece-related Cyprus stories.
 */
export function sectionFill<G extends { id: string }, C extends FillStory>(slug: string, greece: G[], others: C[], opts: { size?: number; cyprusMax?: number } = {}): (G | C)[] {
  const size = opts.size ?? 20, cyprusMax = opts.cyprusMax ?? 4;
  const topic = SECTION_TOPICS[slug];
  if (!topic) return greece.slice(0, size);
  const fits = (s: C) => {
    if (slug === "greece-cyprus") return !!s.greece_related;
    const text = `${s.title} ${s.summary ?? ""}`;
    return (topic.verticals?.includes((s.vertical || "").toLowerCase()) ?? false) || (topic.re?.test(text) ?? false);
  };
  const matched = others.filter(fits);
  const related = matched.filter((s) => s.greece_related);
  const intl = matched.filter((s) => !s.greece_related && isInternationalStory(s));
  const cyprus = matched.filter((s) => !s.greece_related && !isInternationalStory(s)).slice(0, cyprusMax);
  const seen = new Set<string>();
  return [...greece, ...related, ...intl, ...cyprus].filter((s) => !seen.has(s.id) && !!seen.add(s.id)).slice(0, size);
}
