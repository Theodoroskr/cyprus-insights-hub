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

export function storyLanguage(s: Bilingual, choice: StoryLang | null): StoryLang {
  if (!s.title_el) return "en";
  if (!(s.edition ?? ["cy"]).includes("cy")) return "el";
  return choice ?? "en";
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
