# Make search find news stories

## What's wrong
The search page only looks through company names, people and the 12 directory articles. It never searches the news stories, which are most of the site. So "ICPAC" gives 0 results, even though there are 10 ICPAC stories. "Compliance" finds just one directory article, even though there are 570 published compliance stories.

## Plan
1. Search published news stories by headline, summary and tags. Show the newest first, up to 30.
2. Add a "News" tab at the top of the results with the story picture, section badge, date and summary. Each result opens the story.
3. A search for a section name (Compliance, FinTech, RegTech, SME/Business) also brings back that section's latest stories.
4. A search for a source name like "ICPAC" also brings back stories from that source.
5. Companies: search the full company directory (about 55,000 firms) instead of the small featured list. Results link to each company's profile.
6. The results count includes all of these.

## Technical details
- `SearchPage.tsx`: add a `cna_articles` query (`status=published`, `or(title.ilike, summary.ilike, tags.cs)` plus a `vertical` match and a `source_id like '<slug>:%'` match when the query equals a hub or source slug), sorted by `published_at` desc.
- Replace the `companies` query with `directory_companies` by name / registration number.
- Add a small tested helper that maps the search term to a section or source, with tests for "ICPAC" and "Compliance".
