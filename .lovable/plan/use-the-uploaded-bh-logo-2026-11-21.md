# Use the uploaded BH logo

## What changes
- The header and footer BH logo is redrawn to match your file: a bold navy B and H, with the light-blue arrow running into the H's crossbar.
- The edition names stay as they are next to the logo: BUSINESSHUB.CY, BUSINESSHUB with ΕΛΛΑΔΑ underneath, and BHUB NETWORK. In your file, "BHUB" is heavy and "NETWORK" is lighter. The International logo will copy that mix.
- In the dark footer the logo shows white, with the arrow still light blue.
- The browser tab icon and phone app icon stay the gold "B.", as you chose.

## How
- I'll redraw the logo by hand from your file so it stays sharp at every size and can turn white on dark backgrounds. Your PNG file is stored as the original artwork, but the site won't show it.
- I'll check the logo on Cyprus, Greece and hub pages, on desktop and phone, and in the footer.

## Technical details
- Replace the paths in `src/components/brand/BhMark.tsx` to match the upload: a B with a squared top bowl, a tall H, a navy tab on the crossbar and a `fill-brand-sky` arrow.
- In `BrandLockup.tsx`, the intl edition gets "BHub" at extrabold and "Network" at medium weight.
- Upload the PNG with `lovable-assets` to `src/assets/brand/bhub-network-logo.png.asset.json` as the reference original. The favicon is left unchanged, per the saved preference.
- Update `mem://brand/bhub-network`: the approved logo file has been received.
