# Fix the picture on "Survey on the Trips of Residents 2025"

The story has no picture of its own, so the page shows a generic stand-in image.

## What I'll do
1. Create a fitting photo: Cyprus residents travelling (a suitcase and boarding passes at Larnaca airport, with a hint of a Cyprus village road trip). No text, no logos.
2. Store it in the site's picture storage and attach it to this story only, so the story page, homepage cards and Facebook preview all use it.
3. Open the story in the preview to confirm the new picture shows.

## Technical details
- Generate the image, upload it to the public storage bucket, and set `cna_articles.image_url` for id `fadabdf7-…` via a one-row update.
