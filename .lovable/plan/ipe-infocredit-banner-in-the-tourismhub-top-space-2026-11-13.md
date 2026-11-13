# IPE Infocredit banner in the TourismHub top space

## What you'll get
- The empty 970×125 space at the top of the TourismHub front page shows an IPE Infocredit banner. It replaces the "Advertise here" placeholder.
- The banner has your uploaded logo, unchanged, on a white background. Beside it is the short line **"Professional education in Cyprus"** and the web address **ipe.com.cy**.
- Clicking the banner opens https://ipe.com.cy in a new tab.
- The banner runs from today with no end date. You can pause it or set an end date in the Banners admin, like any other banner.
- Views and clicks are counted the same way as for other banners.

If you want different wording for the short line, tell me before I start.

## Steps
1. Make the banner at double resolution (1940×250) so it stays sharp. The logo is placed as it is, not redrawn.
2. Upload it to the public banner storage.
3. Add a live banner record for the TourismHub top space, linking to https://ipe.com.cy.
4. Open /explore in the preview to check that it fits the space and the link works.

## Technical details
- The banner image is drawn with code (PIL), using the logo's exact pixels.
- It is uploaded to `banner-images/banners/ipe-infocredit-tourism-top.png`.
- A row is added to `banner_placements` with `slot_id='tourism-top'`, `is_active=true`, `starts_at=now()` and `ends_at` empty.
