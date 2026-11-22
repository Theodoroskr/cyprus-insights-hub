# Same layout for every hub as BusinessHub.cy

Hubs covered: FinTech, Compliance, RegTech, Energy, Tourism.

## What visitors will see
Every hub front page follows the BusinessHub.cy homepage order, in the hub's own colour and logo:

```text
Market ticker + news ticker
Top banner (970x125)            <- hub's own slot
Header + hub navigation         <- hub's own links
Hub masthead + trending topics
Section tabs (hub sub-sections)
Lead story + Latest column + more stories
Full coverage package (hub topic)
Feed-top banner                 <- hub's own slot
Story feed with sidebar
Hub specialist block (e.g. DORA tool, licensed firms, sanctions, energy prices, destinations)
Mid banner (728x90)             <- hub's own slot
Related hubs row (3 columns)
Newsletter signup
Footer banner (728x90)          <- hub's own slot
Footer
```

## Hub links (top navigation of each hub)
- FinTech: News, Regulations, Licensed firms, Payments, Crypto & MiCA, Funding, Rankings
- Compliance: Updates, AML, Sanctions, Deadlines, Guidance, FATF
- RegTech: News, DORA readiness, Vendors, Cyber & ICT risk, Frameworks
- Energy: News, Prices, Renewables, Regulator (CERA), Funding, Archive
- Tourism: News, Explore, Destinations, Conference venues, Arrivals data
- Each hub also links back to BusinessHub.cy; the other hubs stay in the footer.

## Banners
- Four bookable slots per hub: top, feed-top, mid, footer — each appears once per page, with the "Advertise here" placeholder when unsold.
- All new slots appear in the Banners admin so they can be booked.

## Kept as is
- Existing hub-only tools (DORA self-assessment, vendor list, sanctions, deadlines, energy archive, tourism places) move into the "specialist block" position, not removed.
- Cyprus homepage itself is unchanged.

## Technical details
- New shared `HubHomeLayout` component taking `brand`, `navLinks`, `verticals`, `slots`, `specialist` children; reuses `HubMasthead`, `HubLeadStories`, `AdSlot`, `LeaderboardAdSlot`, `NewsletterSignup`, `Footer`.
- `HUB_SLOTS` map (`<hub>-top`, `-feed-top`, `-mid`, `-footer`) added to `PLACEHOLDER_SLOTS` and Banners admin; existing hub-top/mid IDs kept so live bookings continue.
- Hub nav defined in `src/config/siteSections.ts` (`hubNav(brand)`), used by `TopNavigation` on hub pages.
- Refactor FinTechPage, CompliancePage, RegTechPage, EnergyPage, TourismPage onto the layout.
- Tests: each hub renders its four slot IDs exactly once and its nav links; Playwright check of all five hubs desktop + phone.
- Update AGENTS.md banner-slot rule.
