/** Greece-edition filing for stories collected from Greek sources (content_sources.country = 'GR'). */

/** Source slug → organisations.slug (bank pages on /greece/org/:slug). */
export const GR_SOURCE_ORG: Record<string, string> = {
  "gr-nbg-press": "national-bank-of-greece",
  "gr-nbg-ir": "national-bank-of-greece",
  "gr-alpha-press": "alpha-bank",
  "gr-eurobank-press": "eurobank",
  "gr-eurobank-ir": "eurobank",
  "gr-piraeus": "piraeus-bank",
};

const RULES: Array<[string, RegExp]> = [
  ["Financial Results", /\b(financial results|results|earnings|profit|net income|quarter|[1-4]q\s?20\d\d|9m|h1|1h|fy\s?20\d\d)\b|αποτελέσματ|κέρδ/i],
  ["SME Finance", /\b(sme|smes|small and medium|small business|guarantee|eib|eif|loan programme|recovery and resilience|rrf)\b|μμε|μικρομεσαί|εγγυοδοτ/i],
  ["Payments & FinTech", /\b(payments?|fintech|digital|card|instant|iris|embedded finance|app|wallet|blockchain)\b|πληρωμ|ψηφιακ/i],
];
const ANNOUNCEMENT = /\b(announcement|own shares|treasury shares|buyback|voting rights|general meeting|dividend|regulated information|transactions notification|financial calendar)\b|ανακοίνωση|ίδιων μετοχών/i;

/** Banking-page filter tags (BANKING_FILTERS in src/lib/edition.ts) that a story matches. */
export function grBankingTags(title: string, body = ""): string[] {
  const text = `${title} ${body.slice(0, 1500)}`;
  const tags = RULES.filter(([, re]) => re.test(text)).map(([t]) => t);
  if (ANNOUNCEMENT.test(title) || (!tags.length && ANNOUNCEMENT.test(text))) tags.push("Corporate Announcements");
  return tags;
}

type GrSource = { slug: string; country?: string | null; target_section?: string | null };

/** Edition columns for a new story, or null when the source is not Greek. */
export function grEditionFields(source: GrSource, title: string, body = "") {
  if ((source.country || "").toUpperCase() !== "GR") return null;
  const section = source.target_section || "business";
  return {
    edition: ["gr"],
    gr_section: section,
    organisation_slug: GR_SOURCE_ORG[source.slug] ?? null,
    extraTags: section === "banking" ? grBankingTags(title, body) : [],
  };
}
