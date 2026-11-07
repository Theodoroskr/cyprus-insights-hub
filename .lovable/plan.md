# Branded hub images and cleaner photo galleries

## 1. Branded images for each hub
Create a set of branded images for each hub. Each one is a hub-themed photo with a small wordmark for the hub's web address in its corner:
- **BusinessHub.cy**: Cyprus business, teal
- **FinTechHub.cy**: payments and markets, teal
- **ComplianceHub.cy**: regulation and legal, slate blue
- **RegTechHub.cy**: data and technology, purple

There will be 4 per hub, 16 in total. Each one is made by placing the wordmark on one of the backup photos the site already has, so the hub's name is spelled correctly every time. These replace the unbranded backup photos wherever a story photo is missing or broken. As now, each story keeps the same image and stories next to each other show different ones. SME stories use the BusinessHub.cy set.

## 2. No repeated photos in article galleries
- Drop repeated photos inside an article, including the same picture saved at different sizes or with a different link ending.
- Leave out any gallery photo that is the same as the article's main photo.
- If a gallery photo fails to load, hide it instead of filling the gap with a backup image. A gallery shouldn't fill up with the same branded image.
- If only one photo is left, show it full width with no gallery.

## 3. Check
Add tests for removing repeats, then check an article with a gallery and a story with a missing photo in the browser.

## Technical details
- Composite the wordmarks with PIL over the existing `src/assets/fallback/*` photos, using a bottom gradient and a "<Hub>Hub.cy" wordmark. Write them to `src/assets/fallback/branded/<hub>-N.jpg`. `fallbackImage.ts` maps verticals: general and sme go to business, plus fintech, compliance and regtech.
- `groupArticleImages(markdown, heroUrl?)`: normalise URLs by removing the query, hash and size suffixes such as `-300x200` or `@2x`, then dedupe and exclude the hero. Update its tests.
- Mark gallery `<img>` elements with `data-no-fallback`, and give them an `onError` that hides the tile.
