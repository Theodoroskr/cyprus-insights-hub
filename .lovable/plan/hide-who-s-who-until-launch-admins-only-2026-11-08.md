# Hide Who's Who until launch (admins only)

## What changes
- **Pages:** the Who's Who list (`/whoiswho`) and each person's profile (`/whoiswho/...` and `/people/...`) open only for signed-in admins. Everyone else is sent to the homepage, so there's no "locked" screen.
- **Links:** the Who's Who link disappears from the top menu, the footer and the section navigator for non-admins. Admins still see it, with a small "Admin preview" label.
- **Other places that link to people:** "Who's Who" teasers and person links in the directory preview, the directory pages, company pages, search results and the people panels next to news stories are hidden for non-admins. Company pages keep working, just without the people links.
- **Search engines:** the Who's Who pages are taken out of the sitemap, and the pages are marked "do not index" until launch.
- **Launch later:** flipping it back on is a single switch in the code. When you're ready, ask me to "launch Who's Who".

## Not covered
- The people records stay readable in the database (company leadership and news links use them). This plan hides the pages from visitors. It does not lock the underlying data.
- If you want the data locked too, I can restrict it to admins as well. In that case company pages would stop showing leadership names until launch.

## Technical details
- Add `src/lib/featureFlags.ts` with `WHOISWHO_PUBLIC = false`.
- Add `useIsAdmin()`, reusing the `has_role` RPC query already used by TopNavigation.
- Add an `AdminOnlyRoute` wrapper that shows nothing while loading and redirects non-admins to `/`. Wrap the `/whoiswho`, `/whoiswho/:slug` and `/people/:slug` routes in `App.tsx` with it.
- Filter the nav items in `TopNavigation.tsx`, `Footer.tsx` and `VerticalNavigator.tsx`. Gate the people links in `DirectoryPreview`, `DirectoryPage`, `DirectoryHomePage`, `SearchResults`/`SearchPage`, `KnowledgeGraph`, `VerticalConnection` and `CompanyIntelligence`.
- Remove `/whoiswho` from `STATIC_PAGES` in the sitemap function, plus any people entries, and redeploy it.
- Record the flag rule in AGENTS.md.
