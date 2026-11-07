# Always publish articles in English

243 of 1,195 saved news articles are fully or partly in Greek (title or body). From now on, every article is shown in English.

## What changes
- **New stories:** when a story is collected, the title, summary, three briefing points and full body are translated into English before saving. Names of people, companies and laws stay as written, with the Greek in brackets where helpful.
- **Existing stories:** translate the 243 Greek articles in small batches, using the same rules.
- A "Translated from Greek" note with a link to the original appears on translated articles.

## Technical details
- `scrape-sources`: detect Greek (`[α-ωΑ-Ω]` share); call Lovable AI (`google/gemini-3-flash-preview`) to translate title, summary, what_happened/why_it_matters/what_to_do and body_markdown, keeping Markdown. Store `original_language = 'el'`.
- Migration: add nullable `original_language text` to `cna_articles`.
- New edge function `translate-articles` (`{limit}`, default 10) for the backfill; run it repeatedly until no Greek rows remain.
- `ArticlePage.tsx`: show the note when `original_language = 'el'`.
- Record the rule in `AGENTS.md`.
