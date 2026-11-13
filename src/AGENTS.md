# Frontend rules

- Homepage blocks (lead, Latest, Full coverage, feed) split via `partitionHomepage` (`src/lib/homepageStories.ts`). Why: no story twice.
- `/rankings` uses only `get_rankings()` (security invoker) + `market_quotes`, each list sourced. Why: official data only.
- Top menu: `src/config/siteSections.ts`. Why: one list for menu and tests.
- Hub front pages share `HubMasthead` (own `wide-banner` top slot from `HUB_TOP_SLOTS`) + `HubLeadStories` (TourismHub uses `topic="tourism"`: headline/tag match in `src/lib/tourismNews.ts`, as stories have no tourism vertical; fills the column under the 3 cards with `MoreStories` + own 728×90 slot from `HUB_MID_SLOTS`; homepage uses Most Read + `homepage-lead`); `HubLayout landing` drops the `hub-top` strip. Why: same structure, one banner per page.
- Google News: prebuild writes `public/news-sitemap.xml` (cna_articles first published ≤48h, via `recentNews`/`buildNewsSitemap` in `src/lib/sitemap.ts`); Deputy Ministry of Tourism releases enter by hand (`MinistryReleaseForm`, rules in `src/lib/ministryRelease.ts`) as drafts, deduped by canonical URL, near-matches tagged "Possible duplicate". Why: the gov.cy firewall blocks crawling; nothing publishes without an editor.
