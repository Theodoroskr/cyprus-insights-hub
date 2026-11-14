# post-to-x
- Hourly managed schedule; reuses `_shared/facebookPosting.ts` hours/cap/headline-dedupe and day-level mix (`pickArticles` gets today's posted stories: other section/publisher first, never a picture already used today); one `posted` row per article in `x_posts`. Why: same no-repeat rules on every social account.
