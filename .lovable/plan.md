# Regulatory Frameworks section: content check and colour refresh

## Assessment (to confirm against official sources before editing)
Most cards are still broadly right. These need checking and probably updating as of November 2026:
- **EU AI Act:** says "main obligations from Aug 2026". The EU's 2025 "Digital Omnibus" proposal would delay the high-risk rules to late 2027. Status stays "Changing"; the date line will match whatever the official EU text now says.
- **NIS2:** marked "Active" with only the EU directive. Check whether Cyprus has passed its own NIS2 law and add the law number if so. If it is still pending, switch to "Changing".
- **GDPR:** the Digital Omnibus also proposes GDPR amendments. Keep "Active" and add a short "amendments proposed" note only if the proposal is still live.
- **MiFID II:** check the EU Retail Investment Strategy package. Add it as a pending change if it was agreed.
- **AML/KYC:** add that the new EU AML Authority (AMLA) is now operating. The July 2027 date stays.
- **DORA, MiCA, FATCA/CRS/DAC8:** check only; no change expected.
- Each card gets an official source link and a "Last reviewed" date, so readers can see how current it is.

## Design refresh
- Each card gets its own colour accent: a coloured top bar, a tinted icon circle and a soft tinted background.
  - Blue: AML/KYC
  - Purple: GDPR
  - Teal: MiFID II
  - Amber: FATCA/CRS
  - Indigo: DORA
  - Orange: MiCA
  - Red: NIS2
  - Pink: EU AI Act
- Clearer status badges: a solid green "Active" pill and a solid amber "Changing" pill with a pulsing dot.
- The key date becomes a small highlighted line, for example "Applies 10 Jul 2027".
- The section title and badges also appear in Greek, using the existing language switch.
- On hover, the card lifts slightly and the colour bar strengthens.

## Technical notes
- Content lives in the compliance cards list in `src/components/compliance/staticContent.ts`. New fields: `accent`, `keyDate`, `sourceUrl`, `reviewedAt`, plus Greek descriptions.
- Colours are added as theme colours in the global styles and the Tailwind config, not hard-coded.
- The card markup in `src/pages/CompliancePage.tsx` is updated. No database changes.
