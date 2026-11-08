# More banner space, inspired by Fintech News UAE

## What works on fintechnews.ae
- **Leaderboard above the site header**: a full-width sponsor banner is the first thing visitors see. Its "Brought to you by" tag names the sponsor.
- **Wide banner above the news feed**: a large banner (about 4:1) promoting a report download.
- **Sponsored story in the sidebar**: a large image with "RegTech" and "Sponsored" labels, styled like a normal story.
- **Utility bar at the top**: "Media Kit", "Contact Us", "Work With Us", "Submit Press Release" and "Newsletter" sell advertising and bring in content.

## What we add (homepage)
1. **Top leaderboard** above the menu (new `homepage-top` slot). Wide on desktop, shorter on mobile.
2. **Banner above the news feed** (new `homepage-feed-top` slot), sized like the Stitch banner.
3. **Sponsored story in the sidebar**: turns an existing sponsored article into a labelled story card next to the lead stories.
4. **Banner between the hub rows** (new `homepage-mid` slot), placed between the Directory banner and the FinTech/Compliance row.
5. **Thin utility bar** above the logo: Advertise / Media Kit, Submit Press Release, Contact, Newsletter. Advertise opens the existing enquiry form.

Empty slots show the "Advertise here" placeholder, as they do now. Each banner is still scheduled and switched on in the existing Banners admin.

## Other pages (light touch)
- Hub pages (FinTech, Compliance, RegTech): one banner above the hub's story list.
- Article pages: one banner in the middle of the article text, plus the existing sidebar slot.

## Technical details
- Add slot IDs `homepage-top`, `homepage-feed-top`, `homepage-mid`, `hub-top` and `article-inline` to the banner placements list and the Banners admin dropdown. Reuse `LeaderboardAdSlot`.
- Sponsored sidebar card: reads the newest published sponsored article and always shows a "Sponsored" badge.
- Utility bar: new `UtilityBar` component above `TopNavigation`. Only the homepage gets it at first.
- Update the AGENTS.md homepage-ads rule and the advertising memory: the homepage now has 6 slots, and a sponsor never appears twice on one page.
