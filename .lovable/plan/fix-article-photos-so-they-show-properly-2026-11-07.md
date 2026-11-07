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
5. **Same photo on the preview and the story**: some home page previews (Intelligence Hub list, Latest Stories) ignore the story's hub and use a different pick, so a Compliance story got a BusinessHub photo (the shipping containers) on the home page and a different one on its page. All previews will use the same hub + story pick as the article page, so Compliance stories only ever get Compliance photos and the preview matches the story.
6. **Tests** for the card-cleanup and first-photo pick; check the reported story in the browser.

## Technical details
- `src/lib/cleanArticleMarkdown.ts` + `supabase/functions/scrape-sources/cleanArticleMarkdown.ts`: regex to unwrap linked image cards and strip `\\` line-break escapes; redeploy scraper.
- New `extractFirstImage(markdown)` in `src/lib/groupArticleImages.ts`; `ArticlePage.tsx` uses it when `image_url` is null.
- Hero `<img>`: drop `max-h-[420px]`, keep `aspect-[16/9] object-cover`.
- `IntelligenceHub.tsx:200` passes `null` vertical; `IntelligenceListItem.tsx:93` uses `fallbackFor(null, whatHappened)`. Pass the real `vertical` and article `id` as seed everywhere; add the derived first-body photo to list queries where cheap.
- Add `roadmap.md` entry for this task.
- Tests in `src/test/` (incl. same id+vertical → same image; compliance never returns business set).
