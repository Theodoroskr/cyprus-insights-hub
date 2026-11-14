# Tidy the EnergyHub menu link

In the Menu panel, the Hubs list shows "EnergyHub.cy — Energy / Ενέργεια". Change it to just "EnergyHub.cy", so it matches FinTechHub.cy, ComplianceHub.cy, RegTechHub.cy and TourismHub.cy. The link still goes to the Energy page.

## Technical details
- `src/config/siteSections.ts`: change the label of the `/energy` entry in the "Hubs" group to `EnergyHub.cy`.
- Run the nav test (`src/test/fortuneIdeas.test.ts`).
