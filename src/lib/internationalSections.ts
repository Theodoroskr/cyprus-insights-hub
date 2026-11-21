import { INTL_PATH } from "@/lib/edition";
import { pinHighlighted } from "@/lib/highlight";
import { BLOCK_RULES, ROUTINE_RE, englishUnique, storyMarket, type IntlStory, type Market } from "@/lib/internationalHome";

/** The International edition's own section pages, in header order. */
export const INTL_SECTIONS = [
  { slug: "markets", label: "Markets", title: "Markets",
    intro: "The latest from each market of the network — EU & International, Greece and Cyprus — with the Greece–Cyprus business brief." },
  { slug: "companies", label: "Companies & Investment", title: "Companies & investment",
    intro: "Deals, company announcements, results and expansion across Cyprus, Greece and the EU." },
  { slug: "fintech", label: "Fintech", title: "Fintech & payments",
    intro: "Payments technology, digital finance, crypto-asset rules and the firms building them." },
  { slug: "compliance", label: "Compliance", title: "Compliance & risk",
    intro: "Financial crime, sanctions, cyber risk and enforcement — what changed and who it affects." },
  { slug: "funding", label: "Funding", title: "Funding & opportunities",
    intro: "Open funding calls with deadlines, Greek public tenders and the latest funding news." },
  { slug: "data", label: "Data", title: "Data & insights",
    intro: "Official figures for Cyprus, Greece and the EU on the same basis, each with its source and date." },
] as const;

export type IntlSectionSlug = (typeof INTL_SECTIONS)[number]["slug"];

export function isIntlSection(s: string | undefined): s is IntlSectionSlug {
  return !!s && INTL_SECTIONS.some((x) => x.slug === s);
}

export function intlSection(slug: IntlSectionSlug) {
  return INTL_SECTIONS.find((s) => s.slug === slug)!;
}

/** A section page's address: /intl/<section> on every host (bhubnetwork.com keeps the /intl/ prefix once live, so it never clashes with Cyprus pages). */
export function intlSectionPath(slug: IntlSectionSlug): string {
  return `${INTL_PATH}/${slug}`;
}

/** Funding news: grants, subsidies, calls and tenders — not a company "raising funding" (that is Companies & investment). */
export const FUNDING_RE = /\b(grants?|subsid(y|ies|ised|ized)|funding (calls?|programmes?|programs?|schemes?|opportunit\w+)|calls? for (proposals|applications)|horizon europe|recovery and resilience|structural funds?|cohesion funds?|state aid|public tenders?|procurement|investment incentives?|research and innovation foundation|thalia|espa)\b/i;

/** Story rules of the section pages that list stories. The homepage blocks use the same rules. */
export const SECTION_RULES = {
  companies: BLOCK_RULES.companies,
  fintech: BLOCK_RULES.fintech,
  compliance: BLOCK_RULES.compliance,
  funding: (s: IntlStory) => !ROUTINE_RE.test(s.title) && FUNDING_RE.test(`${s.title} ${s.summary ?? ""}`),
} as const;

export type StorySection = keyof typeof SECTION_RULES;
export type MarketFilter = Market | "all";

/** Stories of one section page: English headlines once each, editor highlights first, then newest first; optionally one market only. */
export function sectionStories<T extends IntlStory>(rows: T[], section: StorySection, market: MarketFilter = "all", now: Date = new Date()): T[] {
  const list = englishUnique(rows).filter(SECTION_RULES[section]).filter((s) => market === "all" || storyMarket(s) === market)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
  return pinHighlighted(list, [], now);
}

/** How many of a section's stories each market has (for the filter buttons). */
export function marketCounts<T extends IntlStory>(rows: T[], section: StorySection): Record<MarketFilter, number> {
  const all = sectionStories(rows, section);
  const c: Record<MarketFilter, number> = { all: all.length, intl: 0, gr: 0, cy: 0 };
  for (const s of all) c[storyMarket(s)]++;
  return c;
}

/** EU paperwork and shareholder notices that would otherwise fill a market column. */
const MARKET_SKIP_RE = /\b(payment requests?|additional announcement|distribution of|dividend|ex-date)\b/i;
/** First two words of a headline: "Commission greenlights Poland's final…" and "…Ireland's final…" count as one series. */
const series = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").trim().split(/\s+/).slice(0, 2).join(" ");

/** Markets page: the newest English stories of each market, n each, leaving out routine notices and repeats of one headline series. */
export function latestByMarket<T extends IntlStory>(rows: T[], n: number): Record<Market, T[]> {
  const out: Record<Market, T[]> = { intl: [], gr: [], cy: [] };
  const seen: Record<Market, Set<string>> = { intl: new Set(), gr: new Set(), cy: new Set() };
  const list = [...englishUnique(rows)].sort((a, b) => b.published_at.localeCompare(a.published_at))
    .filter((s) => !ROUTINE_RE.test(s.title) && !MARKET_SKIP_RE.test(s.title));
  for (const s of list) {
    const m = storyMarket(s);
    const key = series(s.title);
    if (out[m].length >= n || seen[m].has(key)) continue;
    seen[m].add(key);
    out[m].push(s);
  }
  return out;
}

/** Markets page: Greece–Cyprus business stories, newest first. */
export function briefStories<T extends IntlStory>(rows: T[], n: number): T[] {
  return englishUnique(rows).filter(BLOCK_RULES.brief).sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, n);
}
