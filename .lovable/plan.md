# Take Who's Who out of the menus for everyone

Visitors already can't see Who's Who. You still see it in the header because you're signed in as admin. This removes it from the menus for admins too, until the section is populated.

## Changes
- Remove "Who's Who" from the main header menu and the category tab strip for everyone, admins included.
- Remove it from the footer for everyone as well.
- Admins keep access through a "Who's Who (private build)" link in the editorial dashboard, and the page itself stays admins-only.

## Technical details
- `TopNavigation.tsx`: drop the `/whoiswho` nav item (the menu only uses `WHOISWHO_PUBLIC`, no admin exception).
- `VerticalNavigator.tsx` and `Footer.tsx`: show the item only when `WHOISWHO_PUBLIC` is true.
- `EditorialDashboard.tsx`: add a link to `/whoiswho`.
- Update the AGENTS.md Who's Who rule: menu links are hidden for everyone until launch, and only the routes stay admin-only.
