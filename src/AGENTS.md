# Frontend rules

- Homepage blocks (lead, Latest, Full coverage, feed) split via `partitionHomepage` (`src/lib/homepageStories.ts`). Why: no story twice.
- `/rankings` uses only `get_rankings()` (security invoker) + `market_quotes`, each list sourced. Why: official data only.
- Top menu: `src/config/siteSections.ts`. Why: one list for menu and tests.
- Hub front pages share `HubMasthead` (own full-width, half-height `wide-banner` top slot from `HUB_TOP_SLOTS`) + `HubLeadStories`; `HubLayout landing` drops the `hub-top` strip. Why: same structure, one banner per page.
