# Frontend rules

- Homepage blocks (lead, Latest, Full coverage, feed) split via `partitionHomepage` (`src/lib/homepageStories.ts`). Why: no story twice.
- `/rankings` uses only `get_rankings()` (security invoker) + `market_quotes`, each list sourced. Why: official data only.
- Top menu: `src/config/siteSections.ts`. Why: one list for menu and tests.
- Hub front pages share `HubMasthead` (own `wide-banner` top slot from `HUB_TOP_SLOTS`) + `HubLeadStories` (TourismHub reads the `tourism` vertical; fills the column under the 3 cards with `MoreStories` + own 728×90 slot from `HUB_MID_SLOTS`; homepage uses Most Read + `homepage-lead`); `HubLayout landing` drops the `hub-top` strip. Why: same structure, one banner per page.
- Google News: prebuild writes `public/news-sitemap.xml` (cna_articles first published ≤48h, via `recentNews`/`buildNewsSitemap` in `src/lib/sitemap.ts`); Deputy Ministry of Tourism releases enter by hand (`MinistryReleaseForm`, rules in `src/lib/ministryRelease.ts`) as drafts, deduped by canonical URL, near-matches tagged "Possible duplicate". Why: the gov.cy firewall blocks crawling; nothing publishes without an editor.
- Tourism news is its own `tourism` article vertical, set at collection time by `isTourismStory` (`supabase/functions/_shared/tourismNews.ts`, also used by the site) and shown at `/explore/news` (TourismHub "News" tab). Why: one section per story, filed once, not re-guessed on every page.
- Hand-written stories/press releases: Articles tab "New story / press release" (`NewStoryDialog`, rules in `src/lib/manualStory.ts`) inserts `cna_articles`; press releases always carry the "Press release" tag (shown as a badge on the story page) and name the issuer. Why: readers must see what is paid/issued material, not reporting.
