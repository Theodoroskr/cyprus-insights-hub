import { isInternationalStory } from "@/lib/storyOrigin";
import { isGreekText, SECTION_TOPICS } from "@/lib/greeceBlend";
import { isHighlighted, pinHighlighted } from "@/lib/highlight";

/** A published story as the International homepage reads it. */
export type IntlStory = {
  id: string; title: string; summary: string | null; what_happened?: string | null; published_at: string;
  image_url: string | null; vertical: string | null; tags: string[] | null; edition: string[] | null;
  greece_related: boolean | null; gr_section: string | null; cross_border_note: string | null; featured_until?: string | null;
};

/** Where a story comes from: its own edition, or EU & International when nothing ties it to Cyprus or Greece. */
export type Market = "intl" | "cy" | "gr";

export const MARKET_LABEL: Record<Market, string> = { intl: "EU & International", cy: "Cyprus", gr: "Greece" };
/** The edition that owns the story; the card links back to that original story page. */
export const MARKET_SOURCE: Record<Market, string> = { intl: "BHub Network", cy: "BusinessHub.cy", gr: "BusinessHub Ελλάδα" };

export function storyMarket(s: IntlStory): Market {
  if ((s.edition ?? []).includes("gr")) return "gr";
  return isInternationalStory(s) ? "intl" : "cy";
}

const text = (s: IntlStory) => `${s.title} ${s.summary ?? ""}`;
const hasTag = (s: IntlStory, tags: string[]) => (s.tags ?? []).some((t) => tags.includes(t));
const GREECE_RE = /\b(greece|greek|athens|piraeus|thessaloniki)\b/i;
const CYPRUS_RE = /\b(cyprus|cypriot|nicosia|limassol|larnaca)\b/i;

/** Topic rules for the homepage blocks, matched on headline, summary, tags or section. */
export const BLOCK_RULES = {
  /** Greece–Cyprus Business Brief: stories that link the two markets. */
  brief: (s: IntlStory) => s.gr_section === "greece-cyprus" || !!s.cross_border_note
    || (!!s.greece_related && (s.edition ?? []).includes("cy"))
    || (GREECE_RE.test(text(s)) && CYPRUS_RE.test(text(s))),
  /** Companies & Investment: deals, company announcements and expansion. */
  companies: (s: IntlStory) => hasTag(s, ["Funding & Investment Deals", "Listed Company Disclosures", "Corporate Announcements", "Financial Results"])
    || !!SECTION_TOPICS.deals.re?.test(text(s)) || !!SECTION_TOPICS.announcements.re?.test(text(s)) || /\b(expan\w+|opens?|launch\w*)\b/i.test(s.title),
  /** Fintech: payments, digital finance and crypto (the topic, not the collector's section, which is too broad). */
  fintech: (s: IntlStory) => hasTag(s, ["Payments & FinTech"])
    || /\b(payments?|fintech|crypto\w*|mica|digital euro|instant payments|e-money|stablecoins?|tokeni[sz]\w*|blockchain|neobank\w*)\b/i.test(text(s)),
  /** Compliance: regulation, risk and cybersecurity. */
  compliance: (s: IntlStory) => hasTag(s, ["Cybersecurity", "Sanctions"])
    || /\b(aml|anti-money|sanctions?|regulat\w+|supervis\w+|dora|nis2|cyber\w*|compliance|vulnerabilit\w+|fines?d?)\b/i.test(text(s)),
} as const;

/** Newest first, alternating between markets, so no single edition fills a block. */
export function mixMarkets<T extends IntlStory>(rows: T[]): T[] {
  const queues: Record<Market, T[]> = { intl: [], gr: [], cy: [] };
  for (const r of rows) queues[storyMarket(r)].push(r);
  const out: T[] = [];
  const order: Market[] = ["intl", "gr", "cy"];
  while (out.length < rows.length) {
    // Each round takes the newest waiting story of every market, newest round-head first.
    const heads = order.map((m) => queues[m].shift()).filter((x): x is T => !!x)
      .sort((a, b) => b.published_at.localeCompare(a.published_at));
    out.push(...heads);
  }
  return out;
}

export interface IntlHome<T extends IntlStory> {
  lead: T | null; latest: T[]; more: T[];
  brief: T[]; companies: T[]; fintech: T[]; compliance: T[];
}

/**
 * The International homepage's own selection: English headlines only, editor highlights first,
 * then a mix of EU/International, Greece and Cyprus stories; every story appears once on the page.
 */
export function buildIntlHome<T extends IntlStory>(rows: T[], opts: { now?: Date; blockSize?: number } = {}): IntlHome<T> {
  const size = opts.blockSize ?? 5;
  const seenTitle = new Set<string>();
  const english = rows.filter((r) => r.title && !isGreekText(r.title)).filter((r) => {
    const key = r.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seenTitle.has(key)) return false;
    seenTitle.add(key);
    return true;
  });
  const ordered = pinHighlighted(mixMarkets(english), [], opts.now ?? new Date());
  const used = new Set<string>();
  const take = (list: T[], n: number) => { const out = list.filter((s) => !used.has(s.id)).slice(0, n); out.forEach((s) => used.add(s.id)); return out; };

  // The lead is a highlighted story, else the first of the top few that has its own picture.
  const now = opts.now ?? new Date();
  const first = ordered[0];
  const lead = !first ? null : isHighlighted(first, now) ? first : ordered.slice(0, 6).find((s) => !!s.image_url) ?? first;
  if (lead) used.add(lead.id);
  const latest = take(ordered, 6);
  const more = take(ordered, 4);
  const block = (rule: (s: IntlStory) => boolean) => take(mixMarkets(english.filter(rule)), size);
  const brief = block(BLOCK_RULES.brief);
  const companies = block(BLOCK_RULES.companies);
  const fintech = block(BLOCK_RULES.fintech);
  const compliance = block(BLOCK_RULES.compliance);
  return { lead, latest, more, brief, companies, fintech, compliance };
}
