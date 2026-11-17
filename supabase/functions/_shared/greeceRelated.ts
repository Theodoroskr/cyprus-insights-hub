/**
 * "Greece-related" label for news stories: marks stories about Greece so editors can
 * present them on BusinessHub.gr later. A label only — it never adds a story to the Greece edition.
 */

// Cyprus phrases that use the word "Greek"/"Hellenic" without being about Greece.
const NOT_GREECE = /\bgreek[\s-](?:cypriots?|orthodox|language|speaking|version|text|translation|literature|culture|community|schools?|students?|teachers?)\b|\b(?:in|from|into) greek\b|\bhellenic bank\b/gi;

const GREECE = new RegExp(
  [
    String.raw`\bgreece\b`,
    String.raw`\bgreek\b`,
    String.raw`\bhellenic (?:republic|capital market|development bank|statistical|stock|exchanges?|financial|bank association|parliament)\b`,
    String.raw`\b(?:athens|thessaloniki|piraeus|patras|heraklion|crete|attica)\b`,
    String.raw`\b(?:athex|euronext athens|national bank of greece|alpha bank|eurobank|piraeus bank|attica bank|optima bank|mitsotakis)\b`,
    // Greek-language Cyprus text says "ελληνικ…" constantly, so only place names count.
    "ελλάδ", "αθήν", "θεσσαλονίκ", "πειραι",
  ].join("|"),
  "gi",
);

function hits(text: string): number {
  const cleaned = text.replace(NOT_GREECE, " ");
  return cleaned.match(GREECE)?.length ?? 0;
}

export type GreeceRelatedInput = {
  title: string;
  summary?: string | null;
  /** Accepted for convenience; not used for the decision. */
  body?: string | null;
  tags?: string[] | null;
  edition?: string[] | null;
};

/**
 * True when the story is about Greece: a Greece-edition story, or Greece named in the headline, summary or tags.
 * The body is not read: EU statistics list every country and pages carry "Greek" language menus.
 */
export function isGreeceRelated(s: GreeceRelatedInput): boolean {
  if (s.edition?.includes("gr")) return true;
  return hits(`${s.title} ${s.summary ?? ""} ${(s.tags ?? []).join(" ")}`) > 0;
}
