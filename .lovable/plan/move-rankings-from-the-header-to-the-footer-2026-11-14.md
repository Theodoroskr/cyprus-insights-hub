# Move Rankings from the header to the footer

- Remove "Rankings" from the top link row. The row becomes: All news, Directory, Funding, Economy, Trade, Real Estate, Compliance, FinTech, RegTech, Energy.
- The footer already has a "Cyprus Rankings" link, so it stays there. The Menu button keeps its Rankings link too.

## Technical details
- `src/config/siteSections.ts`: drop the `/rankings` entry from `PRIMARY_NAV` and update the header comment to ten links.
- `src/test/fortuneIdeas.test.ts`: expect ten links without Rankings; run it.
- Update the `mem://features/top-navigation-links` memory.
