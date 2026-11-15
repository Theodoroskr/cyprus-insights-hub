# Make "Most Read" refresh every few hours

## Why it looks stuck
"Most Read" counts every view from the last 30 days. Older stories have had weeks to collect views, so the same stories stay at the top and new ones never catch up.

## What changes
- **Recent reading counts more.** A view from the last hour counts fully; a view from 6 hours ago counts half, from 12 hours ago a quarter, and so on. Popular new stories rise within a few hours, and old ones fade out.
- **Only fresh stories.** Only stories published in the last 7 days can appear.
- **Mix of publishers.** At most 2 stories from the same publisher in the list, so one source doesn't take over.
- **Never empty.** If there aren't enough recent reads (for example at night), the list is topped up with the newest published stories.
- **Refreshes itself.** The homepage, story pages and hub pages pick up the new order on every visit, with no manual step.

This applies everywhere "Most Read" appears: the homepage, the side of every story page, and the hub news blocks.

## Technical details
- Replace `get_most_read_articles(_limit)` (same signature and return columns, so no front-end changes are needed): score = `sum(0.5 ^ (hours_since_view / 6))` over `article_views` from the last 48h, limited to `cna_articles` that are `published` with `published_at` in the last 7 days; cap 2 per `split_part(source_id, ':', 1)`; fill with the latest published stories when there are fewer than `_limit`.
- Add an index on `article_views(created_at)` if it isn't there already.
- Add a test for the scoring rule (a view 6h old counts half as much as a new one).
