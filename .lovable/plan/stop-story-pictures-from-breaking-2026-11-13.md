# Stop story pictures from breaking

On this story the picture is the European Commission's logo. The page stretches every picture to a full-width 16:9 frame and crops it to fill, so logos and small images get cut off and look broken.

## What changes
1. **Smaller main picture:** the top picture keeps its shape but gets a height limit (about 420px on desktop), so it no longer takes over the page.
2. **Logos and small images shown whole:** when a picture is a logo or too small to fill the frame (narrower than about 800px, or very wide or tall), it is shown complete and centred on a light background at a modest size, instead of being cropped.
3. **The same rule for the photo grid lower in the story**, so logos there aren't cut off either.
4. Check this story and one story with a normal photo in the preview.

## Technical details
- In `ArticlePage.tsx`, the hero `<img>` gets `max-h-[420px]`.
- An `onLoad` check of the image's natural width and height switches it to `object-contain`, with padding and a `max-h-[240px]`.
- Gallery tiles get the same check.
