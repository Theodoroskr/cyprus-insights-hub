# Remove "Related news / Latest publications" leftovers from articles

Some stories (mainly ESMA/EU authority pages) still end with the source website's own "Related Press & News" list, a "Latest publications" box, "Download All Files" buttons and a broken table. 10 stored articles have this.

## What changes
- The article cleaner stops the story at headings or lines such as "Related Press & News", "Related news", "Latest publications", "More news", "Download All Files / Download Selected Files".
- Removes blocks of teaser snippets (a date line followed by a cut-off sentence) and empty or broken tables (rows with only dates/blank cells).
- Applies to new stories when scraped, and the page also cleans older stories when shown.
- Re-clean the 10 already-saved affected articles in the database.

## Technical details
- Extend `FOOTER_HEADING` and add a plain-line cut list in `src/lib/cleanArticleMarkdown.ts`; mirror in `supabase/functions/scrape-sources/cleanArticleMarkdown.ts` and redeploy.
- Strip date-only lines followed by truncated teasers; drop markdown tables whose rows are mostly empty cells.
- Add tests in `src/test/cleanArticleMarkdown.test.ts` using this ESMA sample.
- One-off data update on `cna_articles.body_markdown` for the 10 matching rows (cut from the first matching marker).
- Screenshot the reported article to confirm.
