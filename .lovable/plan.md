# Fix article photos so they show properly

## Problem (seen on "Risk Analysis and Monitoring")
- The story has no main photo, so a backup image is shown, while the real photo is buried in the text.
- That photo is wrapped in a website "card" link with leftover `\\` symbols, so it shows as a broken/odd block with stray characters.
- The main photo box uses a fixed 16:9 shape plus a height cap, which can crop or stretch photos awkwardly.

## Changes
1. **Clean "card" photos in the text**: turn `[![alt](img)\\ \\ **Label**](link)` patterns into a plain photo, removing stray `\\` and duplicate label text. Applied in the article cleaner (site and scraper copy).
2. **Use the story's own photo first**: when a story has no main photo, use the first photo found in its text as the main photo (and remove it from the text so it doesn't show twice). Fall back to the hub's branded image only if none exists.
3. **Steady main photo frame**: keep a consistent 16:9 frame with proper cropping, no height cap distortion.
4. **Tidy single photos in text**: full-width, rounded, with correct proportions; broken ones hidden.
5. **Tests** for the card-cleanup and first-photo pick; check the reported story in the browser.

## Technical details
- `src/lib/cleanArticleMarkdown.ts` + `supabase/functions/scrape-sources/cleanArticleMarkdown.ts`: regex to unwrap linked image cards and strip `\\` line-break escapes; redeploy scraper.
- New `extractFirstImage(markdown)` in `src/lib/groupArticleImages.ts`; `ArticlePage.tsx` uses it when `image_url` is null.
- Hero `<img>`: drop `max-h-[420px]`, keep `aspect-[16/9] object-cover`.
- Tests in `src/test/`.
