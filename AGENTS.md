# Agent rules

- `directory_companies` is the master company record; curated `companies` rows link to it via `directory_company_id` and their old profile page redirects. Why: one company, one page, one URL.
- News↔company/person links, company events and regulatory records carry a `status`; only `approved`/`published` rows are public, and only registration-number matches auto-approve. Why: no unsupported claims about people or firms.
- People are never auto-merged by name; name matches go to `match_review_queue`. Why: identical names are common and errors are reputational.
- Regulatory data is split by `record_type` (licensed, warning, enforcement); a warning must never be shown as a company's own sanction. Why: legal accuracy.
- Scrapers only collect from sources with `access_status = 'active'`. Why: no collection until reuse rights are confirmed.
- Entity extraction (`extract-entities`) runs inside the hourly `scrape-sources` batch, not a separate cron. Why: avoid duplicate scheduled jobs.
- Custom Studio uses the `custom-studio` banner placement and shows a labelled "Advertise here" placeholder (as do the other homepage slots) when no live, in-date image is available; sponsored article pages remain separate. Why: reuse banner scheduling without reserving empty homepage space.
- Homepage ads are limited to `custom-studio`, `homepage-stories` (sidebar on desktop, after the second story on mobile), and `homepage-footer`; other pages retain generic slots. Why: prevent repeated ads and preserve editorial spacing.
- Homepage lead and feed share `useBlendedNews`: stable same-day source/topic mixing and deduplication happen before slicing; publication dates remain unchanged. Why: prevent scraping batches dominating the feed or repeating between sections.
