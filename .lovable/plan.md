# Use the sharper ICPAC logo on ICPAC stories

## Assessment
- Your file is 500x500 with a transparent background and clean lettering. It is sharper than the small, blurry preview images ICPAC's website attaches to each circular, which is what the homepage shows now.
- It is square with a lot of empty space around it, while story pictures are wide (16:9). If we drop it in as it is, it will look small or get cropped.

## Plan
1. Make one wide version (1600x900): your logo placed exactly as supplied, centred on a plain white background with even margins. The logo itself is not redrawn or changed.
2. Show that picture for every ICPAC story, on the homepage, news lists, story pages and link previews. It replaces ICPAC's blurry preview images, including on stories already on the site.
3. Facebook posts for ICPAC stories use the same picture.
4. Other sources are unchanged.

## Note
Using ICPAC's logo to mark its own circulars, with the source credited, is normal for news sites. It must not suggest ICPAC endorses BusinessHub.

## Technical details
- Make the 16:9 picture with an image script (pixels reused, no AI), upload it to the site's file storage and keep a link to it in the project.
- Add a per-source picture override in `storyImage`/`articleImage` keyed on the `icpac` slug of `source_id`, and the same in the postbuild story previews and `post-to-facebook`.
- Add a test that ICPAC stories get the logo and other sources don't.
