# Use your navy BH icon next to the edition name

## What changes
- In every header and footer logo (International "BHUB NETWORK", Cyprus "BUSINESSHUB.CY", Greece "BUSINESSHUB ΕΛΛΑΔΑ / GREECE"), the drawn BH letters are replaced by your uploaded icon: the navy square with the white BH and the light-blue arrow.
- The square gets slightly rounded corners and the same height as today (about 32px, 28px on phones), so the text beside it stays aligned.
- On the dark footer the navy square gets a thin light border so it stays visible against the navy background.
- The tab and app icons already use this icon and stay as they are.

## Checks
- View the header on International, Cyprus and Greece (desktop and phone), and the footer, in the test browser.
- Run the existing logo checks.

## Technical details
- Upload the PNG with lovable-assets to `src/assets/bh-icon.png.asset.json`.
- `BhMark` renders `<img src={asset.url} alt="BHub Network">` with `aspect-square rounded-[6px]`, keeping its `className`/`inverse` props (inverse adds `ring-1 ring-primary-foreground/30`); `BrandLockup` unchanged otherwise.
