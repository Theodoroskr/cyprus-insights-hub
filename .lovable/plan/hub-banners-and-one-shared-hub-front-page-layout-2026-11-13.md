# Hub banners and one shared hub front-page layout

## What you'll see
Every hub front page (FinTechHub, ComplianceHub, RegTechHub, TourismHub) gets the same layout, top to bottom:

1. **Hub header**: the hub's own letter logo and menu. These stay as they are.
2. **Top banner**: half the width of the BusinessHub homepage banner (about 485 × 250 instead of 970 × 250), centred.
   - Each hub gets its own banner place, so you can sell FinTech, Compliance, RegTech and Tourism separately.
   - Until a banner is booked, each one shows the labelled "Advertise here" placeholder.
3. **Hub introduction**: the hub name, a one-line description and a row of key links, in the hub's colour.
4. **Lead story and Latest**: the new homepage design (big photo with the headline beside it, three stories, a "Latest" column), using only that hub's news. TourismHub shows its featured places here instead, because it has no news feed.
5. **Hub sections**: each hub's existing content, kept as it is but shown as matching cards. For example, FinTech regulations, Compliance sanctions and deadlines, RegTech vendors and DORA, and Explore destinations.
6. **Hub footer.**

Inner hub pages (articles, Compliance sub-pages, Explore place pages) keep their current small strip banner and are not restructured.

## Banners admin
The Banners editor lists four new places: "FinTechHub top", "ComplianceHub top", "RegTechHub top" and "TourismHub top" (each 485 × 250). The existing "Hub pages — below menu" place stays for inner pages.

## Technical details
- Add a `half-billboard` ad size (`max-w-[485px] aspect-[485/250]`) to `AdSlot`.
- Add the slot IDs `fintech-top`, `compliance-top`, `regtech-top` and `tourism-top` to `PLACEHOLDER_SLOTS` and to `BannersPanel`, keeping each slot ID once per page.
- Add a `HubLanding` template in `src/components/hub/HubLanding.tsx`. It takes the brand, the intro text, quick links, the news verticals and `children` for the hub sections.
  - It renders the banner, the intro, and the lead story and Latest block, reusing the partition logic with `useBlendedNews(verticals)`.
- `HubLayout` gets a `landing` prop. Landing pages skip the `hub-top` strip so the page doesn't show two banners.
- Refactor `FinTechPage`, `RegTechPage`, `CompliancePage` (via `ComplianceShell` masthead) and `ExplorePage` onto `HubLanding`. Existing sections move into it unchanged.
- Add a test that each hub landing uses its own top slot, and that no slot appears twice.
- Check all four pages in a browser on desktop and mobile.
