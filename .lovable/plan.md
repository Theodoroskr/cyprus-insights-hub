# Give Compliance, FinTech and RegTech a homepage-style news layout

## What's wrong
The Compliance page takes its 6 newest compliance stories as they come in. This morning that was 6 ICPAC circulars in a row. FinTech and RegTech load their news the same way, so they can have the same problem.

## Plan
1. **Same mix as the homepage.** Each section's news is mixed by source, the way the homepage does it. Within the last 24 hours, one source's batch is spread out among the others, and the newest story still comes first.
2. **Homepage-style news block at the top of each section,** in that section's colour:
   - one large lead story with picture
   - four shorter stories beside it
   - a "Most read in Compliance" (or FinTech / RegTech) list with small pictures
3. **A 6-story feed below it,** with pictures, followed by a "More Compliance news" link to the full news list for that section.
4. The section's own tools stay where they are below the news: the regulation guides, calendar, DORA check and calculators.
5. The section's banner slot stays in place.

## Technical details
- Add a shared `HubNewsBlock` component built from `IntelligenceHub`'s three-column layout, with a `vertical` setting and the hub's accent colour.
- Add a `vertical` setting to `useBlendedNews`, fetching up to 120 of that section's published stories and running them through `blendNews`.
- Most read: filter `get_most_read_articles` results by vertical, with a fallback to the section's newest stories.
- Replace the existing "Latest ... Intelligence" lists in `CompliancePage`, `FinTechPage` and `RegTechPage` with `HubNewsBlock`.
- Test that a section feed with 6 ICPAC stories plus others gets at most 2 ICPAC stories in its top 5.
