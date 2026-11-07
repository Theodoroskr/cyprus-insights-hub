# Show the latest stories on News & Insights

## Why it shows old articles
The News & Insights page only reads the 7 hand-written directory articles (newest from 11 April 2026). It never reads the scraped news feed, which has 1,033 published stories (newest today).

## Changes
1. List the latest published stories from the main news feed, newest first, using the same source/topic blending as the home page so one source doesn't fill the page.
2. Keep the 7 hand-written articles, mixed in by date and still opening their own page.
3. Add "Load more" (24 at a time) and the hub filter (All, Business, FinTech, Compliance, RegTech).
4. Use the same photo for each story as on the home page and story page.

## Technical details
- `src/pages/NewsListPage.tsx`: query `cna_articles` (status `published`, `published_at desc`, paged) plus `directory_articles` (news/insight); merge and sort by `published_at`; links `/article/:id` vs existing directory route.
- Reuse `blendNews` and `storyImage(image_url, vertical, id, body_markdown)`.
