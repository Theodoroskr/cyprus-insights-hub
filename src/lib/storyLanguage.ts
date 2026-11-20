// Which language a story page shows: Greece-only stories read in Greek; stories in
// both editions read in English unless the reader picks Greek.
export type StoryLang = "en" | "el";

type Bilingual = {
  edition?: string[] | null;
  title: string; summary: string | null; body_markdown: string | null;
  what_happened: string | null; why_it_matters: string | null; what_to_do: string | null;
  title_el?: string | null; summary_el?: string | null; body_el?: string | null;
  what_happened_el?: string | null; why_it_matters_el?: string | null; what_to_do_el?: string | null;
};

/**
 * A story can be read in Greek only when its text (not just the headline) exists in Greek:
 * a Greek headline over English analysis and body reads half in each language.
 */
export function hasGreekText(s: Bilingual): boolean {
  if (!s.title_el) return false;
  const hasText = !!(s.body_markdown || s.what_happened || s.why_it_matters || s.what_to_do);
  return !hasText || !!(s.body_el || s.what_happened_el || s.why_it_matters_el || s.what_to_do_el);
}

/** `greekFirst`: the reader is on the Greece edition, so Greek is the default. */
export function storyLanguage(s: Bilingual, choice: StoryLang | null, greekFirst = false): StoryLang {
  if (!hasGreekText(s)) return "en";
  if (choice) return choice;
  return greekFirst || !(s.edition ?? ["cy"]).includes("cy") ? "el" : "en";
}

/** Text in the chosen language, falling back to the other language field by field. */
export function storyText(s: Bilingual, lang: StoryLang) {
  const pick = (en: string | null | undefined, el: string | null | undefined) =>
    (lang === "el" ? el || en : en || el) || null;
  return {
    title: pick(s.title, s.title_el) ?? "",
    summary: pick(s.summary, s.summary_el),
    body_markdown: pick(s.body_markdown, s.body_el),
    what_happened: pick(s.what_happened, s.what_happened_el),
    why_it_matters: pick(s.why_it_matters, s.why_it_matters_el),
    what_to_do: pick(s.what_to_do, s.what_to_do_el),
  };
}
