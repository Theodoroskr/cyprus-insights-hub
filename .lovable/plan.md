# Put the BHub Network brand on all brand pictures

## Which pictures
1. **Phone start-up screens** (20 sizes): replace the gold "B." and "BusinessHub.cy / CYPRUS EDITION" with your white BH icon and "BHUB NETWORK", using the heavy "BHUB" and lighter "NETWORK" from your logo, on navy.
2. **Link previews** shown when the site is shared on Facebook, LinkedIn, X or WhatsApp. The main preview and the default fallback get the BH logo and "BHUB NETWORK". The tagline "Business news, companies and official data" replaces "Cyprus Business Intelligence".
3. **FinTech, Compliance and RegTech previews**: each hub keeps its own name and colour, and "Part of BHub Network" with the small BH logo is added in one corner.
4. **App name**: when the site is saved to a phone's home screen, it is labelled "BHub Network".

## Not changed
- News story photos, banners and company pictures, because these are not brand pictures.
- The logo in the site header. It already uses your BH logo, and each edition keeps its own name (BusinessHub.cy, BusinessHub Ελλάδα).

## Technical details
- Make the images with ImageMagick from `src/assets/brand` artwork plus a traced SVG of the mark. Use the Manrope font, navy #002147 and sky blue.
- Overwrite `public/splash/*.png` at the same sizes, so the links in `index.html` stay as they are.
- Regenerate `public/og-default.jpg` and `public/images/og-*.png` at 1200×630.
- In `manifest.webmanifest`, set `name` to "BHub Network" and `short_name` to "BHub". Set `apple-mobile-web-app-title` to "BHub".
- Update `mem://brand/app-icon` and `mem://brand/bhub-network`.
