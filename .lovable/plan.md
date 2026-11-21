# Show the Greece name in the reading language

## What changes
- The Greece logo follows the EN/EL switch at the top of the Greece pages:
  - **EN:** BUSINESSHUB, with GREECE underneath
  - **EL:** BUSINESSHUB, with ΕΛΛΑΔΑ underneath
- This applies in the page header and the phone menu, everywhere on the Greece pages.
- The switch between International, Cyprus and Greece already changes language in the same way (Greece / Ελλάδα), so it stays as it is.
- The Cyprus and International logos do not change.

## Technical details
- Add a `lang` prop to `BrandLockup`. For the `gr` edition it shows "Greece" when `lang` is "en" and "Ελλάδα" when it is "el".
- `TopNavigation` already receives `lang` and passes it on to `BrandLockup`.
- Check every place that shows the Greece pages and make sure it passes the current EN/EL choice to `TopNavigation`.
- Check both languages with Playwright on `/greece`.
- Update `mem://brand/bhub-network`: the Greece logo shows "GREECE" in English and "ΕΛΛΑΔΑ" in Greek.
