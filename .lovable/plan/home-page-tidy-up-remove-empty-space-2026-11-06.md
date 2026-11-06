# Home page tidy-up: remove empty space

## What I found (10,200px tall page, 22 stacked blocks)

1. **Empty ad boxes are the biggest gap.** 6 grey "AD SPACE" placeholders show with no advertiser: the 970x250 billboard (~250px of nothing), the 728x90 mid-page, 468x60, lower and bottom leaderboards, and two 300x250 sidebar boxes beside the feed.
2. **Six bars before any news.** The ticker, group bar, main menu, BusinessHub.cy masthead with trending tags, "Free during beta" strip and section tabs take about 340px. The logo also appears twice.
3. **The same stories repeat.** The AmCham/Ioannou lead and the Culture grant story show in the Intelligence Hub and again in Latest Stories. Two near-identical grant stories sit side by side in the feed.
4. **Old sample blocks.** "Vertical Connection" and "Knowledge Graph" use fixed demo stories from April (Bank of Cyprus Q3, CYTA 5G, eToro hires). They look stale and pad the page.
5. **Two sign-up prompts back to back.** Newsletter signup and the large Premium box appear one after the other.

## Proposed changes

- **Ad slots:** hide a slot unless it has a live, in-date banner. Show nothing at all otherwise, with no grey box or reserved height. The sidebar keeps only the Premium card and fills the rest with "Most read" or the latest regulatory updates.
- **Top of page:** fold the masthead into the main menu (one logo). Move the trending tags into the section tab row. Make the beta notice a slim line that can be closed.
- **No repeats:** Latest Stories skips any article already shown in the Intelligence Hub. Near-duplicate titles from the same source on the same day show only once.
- **Replace the demo blocks:** "Vertical Connection" shows real approved news-to-person links. It hides if there are fewer than 3. Knowledge Graph is removed from the home page; it stays on Who's Who.
- **One sign-up block:** combine the newsletter and Premium into a single strip.
- **Spacing:** use one consistent section gap and drop the extra divider strips between sections.

Expected result: roughly 35-40% shorter page, with news visible higher up and no blank boxes.

## Technical details

- `InlineAdSlot` / `LeaderboardAdSlot` / sidebar slots: query `banner_placements` (active, within starts_at/ends_at) for the slot and return `null` when none.
- `Index.tsx`: remove `KnowledgeGraph`, merge `NewsletterSignup` + `PremiumCTABanner`, merge masthead into `TopNavigation`.
- `IntelligenceFeed`: accept excluded IDs from `IntelligenceHub`; dedupe by normalised title + source + date.
- `VerticalConnection`: read `news_entity_links` (status approved) joined to people and articles.
- Verify with screenshots before and after, at your current screen size.
