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

/** Routine notices (staff moves, filings, meetings) that never carry a topic block. */
export const ROUTINE_RE = /\b(resign\w*|appoint\w*|voting rights|financial calendar|general meeting|own shares|share buyback|notification of (important )?changes|correct repetition|newsletter|daily news)\b/i;
/** Political or EU-paperwork items that mention both countries but are not business between them. */
const BRIEF_EXCLUDE_RE = /\b(spokes(man|woman|person)|meeting with journalists|press (briefing|conference)|payment requests?|nextgenerationeu|court of justice|infringement|refers? greece)\b/i;
/** Business subjects a Greece–Cyprus story must touch. */
const BUSINESS_RE = /\b(trade|exports?|imports?|invest\w*|business\w*|banks?|banking|compan(y|ies)|firms?|market\w*|energy|interconnector|shipping|tourism|hotels?|real estate|property|innovation|start-?ups?|tech\w*|ict|digital|deals?|acqui\w+|merger|listed|stock exchange|funding|tenders?|chamber|entrepreneur\w*|industry|manufactur\w*)\b/i;
const FINTECH_RE = /\b(fintech|paytech|regtech|crypto\w*|mica|digital euro|e-money|electronic money|stablecoins?|tokeni[sz]\w*|blockchain|neobank\w*|defi|open banking|digital (payments?|assets?|wallets?)|instant payments?|cross-border payments?|payment (services?|institutions?|providers?|gateways?|systems?|cards?|accounts?)|card payments?|psd[23]|psps?|bnpl|buy now,? pay later)\b/i;
const FINTECH_EXCLUDE_RE = /\b(balance of payments|current account (deficit|surplus|balance))\b/i;
const COMPLIANCE_RE = /\b(aml|anti-money laundering|money laundering|sanctions?|dora|nis2|cyber\w*|compliance|fatf|fine[sd]?|penalt\w+|enforcement|data protection|gdpr|vulnerabilit\w+|security updates?|kyc|whistleblow\w*|breach\w*|ransomware|phishing)\b/i;
const EXPANSION_RE = /\b(expands?|expansion|enters? the \w+ market|opens? (a |an |its |new )*(office|branch|plant|factory|hub|store|hotel|subsidiary)s?)\b/i;

/** Topic rules for the homepage blocks, matched on headline, summary or tags (never the collector's broad section alone). */
export const BLOCK_RULES = {
  /** Greece–Cyprus Business Brief: business between the two markets, not political briefings or EU paperwork. */
  brief: (s: IntlStory) => {
    // AI tags such as "Greece-Cyprus Trade" are given too freely to count on their own.
    if (s.gr_section === "greece-cyprus" || !!s.cross_border_note) return true;
    // Both countries must be named in the headline or summary; the "Greece-related" label alone also covers unrelated stories.
    const linked = GREECE_RE.test(text(s)) && CYPRUS_RE.test(text(s));
    return linked && !ROUTINE_RE.test(s.title) && !BRIEF_EXCLUDE_RE.test(text(s)) && BUSINESS_RE.test(text(s));
  },
  /** Fintech: payments technology, digital finance and crypto; a plain "payment" (dividends, EU funds) is not fintech. */
  // The "RegTech" tag is given to EU digital-policy items (democracy, disinformation) too freely to count; macro "balance of payments" is not fintech.
  fintech: (s: IntlStory) => !ROUTINE_RE.test(s.title) && !FINTECH_EXCLUDE_RE.test(text(s))
    && (hasTag(s, ["Payments & FinTech", "Instant Payments"]) || FINTECH_RE.test(text(s))),
  /** Compliance: financial crime, sanctions, cyber risk and enforcement; a regulator's name alone is not enough. */
  compliance: (s: IntlStory) => !ROUTINE_RE.test(s.title)
    && (hasTag(s, ["Cybersecurity", "Sanctions", "AML"]) || COMPLIANCE_RE.test(text(s))),
  /** Companies & Investment: deals, company announcements, results and expansion (no staff moves). */
  companies: (s: IntlStory) => !/\b(resign\w*|appoint\w*|speech|press conference|press statement|remarks|keynote)\b/i.test(s.title)
    && (hasTag(s, ["Funding & Investment Deals", "Listed Company Disclosures", "Corporate Announcements", "Financial Results"])
      || !!SECTION_TOPICS.deals.re?.test(text(s)) || !!SECTION_TOPICS.announcements.re?.test(text(s)) || EXPANSION_RE.test(s.title)),
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

/** Stories with an English headline, each headline once (the same story filed by two sources shows once). */
export function englishUnique<T extends IntlStory>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => r.title && !isGreekText(r.title)).filter((r) => {
    const key = r.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const english = englishUnique(rows);
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
  // Specialist blocks pick before the broad Companies block, so a crypto or cyber story lands where readers look for it.
  const brief = block(BLOCK_RULES.brief);
  const fintech = block(BLOCK_RULES.fintech);
  const compliance = block(BLOCK_RULES.compliance);
  const companies = block(BLOCK_RULES.companies);
  return { lead, latest, more, brief, companies, fintech, compliance };
}
