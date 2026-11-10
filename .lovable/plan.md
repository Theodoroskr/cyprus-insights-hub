# Financial Literacy in English and Greek

The English / Ελληνικά switch already changes the menu, page titles and breadcrumbs. This plan makes the rest of each page switch language too, across all 10 sections and the Academy.

## What will switch to Greek
- **Page text:** introductions, section headings, explanations, notes and "related" links on all 10 sections.
- **Survey results:** score labels, gauge text and breakdown labels. The OECD and Central Bank figure names get a Greek label next to the stored English one.
- **Figures and charts:** card labels, chart controls ("From 2020", CSV), units, "latest period", "Data not available" and source lines. Months are shown in Greek (e.g. "Σεπ 2026").
- **Calculators:** all six, including field names, results, explanations and the disclaimer.
- **Sources & Methodology:** the six explanations and the datasets table headings.
- **Academy:** pages and buttons. Full Greek lesson text is written for all 37 lessons and saved as drafts with the lessons.
- **Google:** Greek page title and description when Greek is selected.
- The chosen language is remembered across pages, as it is today.

## What stays the same
- No figures change. Official dataset names keep their source wording, with a Greek label added.
- Nothing is published automatically: the Greek lesson text stays draft until you publish it.

## Needs you
- I will write the Greek myself. Please have a native speaker review it, especially the lessons, before publishing.

## Technical details
- Add `src/lib/finlitI18n.ts`: a typed EN/EL dictionary plus a `t(lang, key)` helper and Greek month formatting. Pass `lang` (already provided by `FinLitLayout`) into `SurveyScores`, `StatChart`, `StatCard`, `Calculators`, `Methodology` and the module pages.
- Dataset Greek titles come from the existing `stat_datasets.title_el`; fill any blanks. Add a Greek label map for survey indicators in code (no schema change).
- Fill `academy_lessons.body_el` for the 37 lessons with a data update (no schema change); `LessonPage` already prefers Greek when present.
- Add a test that every dictionary key has both English and Greek.
- Browser check of all 10 sections and one lesson in Greek on desktop and phone.
