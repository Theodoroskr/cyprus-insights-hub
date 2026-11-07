# House banners for Infocredit Group, Compliance Suite and Risqo

Fill the three homepage banner spaces with banners for your own partner brands. These replace the "Advertise here" placeholders.

## What gets made
1. Read each website (infocreditgroup.com, compliancesuite.ae, risqo.ai) for its tagline, main offer and brand colours. Use the existing Compliance Suite logo in the project.
2. Design one banner per brand, sized for its space:
   - **Infocredit Group**: Custom Studio, 970x250, below Intelligence Hub
   - **Compliance Suite**: beside Latest Stories, 300x250 (also shows after the second story on mobile)
   - **Risqo**: above the footer, 728x90
3. Each banner gets a short headline, the brand name and a "Learn more" prompt. Clicking it opens that brand's website in a new tab.
4. Add them as live banners with no end date, so you can pause, swap or schedule them later from the Banners tab in the editorial dashboard.

## Mix up the backup photos
Stories with no photo, or a broken one, currently all show the same image for their hub. Make 3 more photos per hub (about 20 in total). Each story will always get the same photo, but neighbouring stories will usually get different ones. Also add the roadmap entry.

## Notes
- The text on the banners comes from each brand's own website. Check it before publishing.
- When a paying advertiser signs, pause a house banner and that advertiser takes its place.

## Technical details
- Generate the images at premium quality (they contain text) into `src/assets/banners/`, upload them to the public storage bucket, and insert `banner_placements` rows (slot_id `custom-studio` / `homepage-stories` / `homepage-footer`, active, start = now, end = null, link_url = brand site).
- Fallback images: `fallbackFor(vertical, seed)` picks from a per-hub array by hashing the article id or title. Pass the seed at every `articleImage` call site, and to the broken-image handler via `data-seed`.
- Check all three on desktop and mobile with Playwright.
