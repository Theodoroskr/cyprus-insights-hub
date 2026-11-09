# Facebook picture library: no people, with logo and section name

## What changes
1. **Replace the 11 pictures that show people** with ones that have no people in them (places, objects, abstract visuals):
   - Business: boardroom and handshake → empty boardroom with a Nicosia view, coffee and a newspaper on a marble desk
   - FinTech: café payment and startup office → payment terminal on a café counter, empty modern office with a sea view
   - Compliance: man with magnifying glass → magnifying glass on reports
   - RegTech: analyst at screens → empty control room with abstract charts
   - SME: all 4 → empty Cypriot shopfront, workshop table, kraft parcels ready to ship, café table with a notebook
   The 9 pictures with no people stay as they are.
2. **Add branding to all 20 pictures**: a dark band along the bottom with the "BusinessHub.cy" wordmark (white serif "B" mark, the same style as the site icon) and the section name: Business, FinTech, Compliance, RegTech or SME, each in its section colour (teal for FinTech, slate blue for Compliance, purple for RegTech).
3. Upload the new pictures in place of the old ones, so the rotation keeps working with no other changes.
4. Make a new preview sheet so you can check all 20.

## Technical details
- New pictures are generated without any text. The logo and labels are then drawn on with Pillow using Playfair Display, so the lettering is always spelled correctly.
- The pictures are uploaded as new versions (`<section>-<n>-v2.jpg`), and the `SOCIAL_IMAGE_LIBRARY` file names are updated. This stops Facebook from using its cached copies of the old ones.
- Tests stay as they are (4 per section, rotation rules).
