# Homepage clean-up: hide Who's Who, replace Featured Companies with a Directory banner

Visitors already can't see Who's Who; you see it because you're signed in as admin. This hides it from the homepage for everyone, admins included, until it's populated.

## Changes
1. **Who's Who on the homepage** — remove the "Who's Who" people row from the Directory preview block and the people/news "connection" block, for everyone. The admin-only `/whoiswho` pages stay so you can keep building them.
2. **Remove Featured Companies** — take the "Featured Companies by City" section off the homepage.
3. **New Directory banner** in its place — a full-width editorial banner (brand teal, Playfair headline), e.g.:
   - Headline: "Explore the Cyprus Business Directory"
   - Line: "Search 55,000+ registered companies, licences and regulatory badges."
   - Button: "Open the Directory" → `/directory` (live company count from the database).

## Technical details
- `Index.tsx`: drop `FeaturedCompaniesSection` and `VerticalConnection`; add new `DirectoryCtaBanner` component using semantic tokens.
- `DirectoryPreview.tsx`: remove the Who's Who block entirely (not just admin-gated).
- Who's Who menu/footer links stay admin-only as now.
