# Show labelled banner placeholders

No banners have been uploaded yet, so all three homepage spaces are hidden. Show a clear "Advertise here" box in each space until a real banner is live.

## What you will see
- **Custom Studio** (below Intelligence Hub): wide box, 970×250, labelled "Custom Studio — Advertise here".
- **Latest Stories**: 300×250 box in the desktop sidebar, and after the second story on phones.
- **Above footer**: slim 728×90 box.
- Each box shows its size and a "Partner with us" link (email to advertising contact).
- When a real in-date banner exists for a space, it replaces the placeholder automatically.

## Technical details
- `AdSlot` / `LeaderboardAdSlot` / `SponsoredStudio`: when `useActiveBanner` returns null, render a dashed-border placeholder using design tokens (muted background, muted-foreground text) at fixed aspect ratio instead of `null`.
- Placeholder includes slot name, dimensions, and a mailto link.
- Update `AGENTS.md` rule (Custom Studio collapses when empty) to say empty slots show a labelled placeholder.
- Verify with screenshots on desktop and mobile.
