# Update the Regulatory Frameworks list (Compliance page)

The six framework cards are typed into the page by hand and some are out of date as of November 2026.

## Corrections
- **AML/KYC**: regulators become "CySEC / CBC / MOKAS"; law reference becomes "Law 188(I)/2007 + EU AML Package (AMLR 2024/1624)". Mark "Changing" — the EU AML Regulation applies from July 2027 and the EU AML Authority (AMLA) is setting up.
- **GDPR**: unchanged (Active).
- **MiFID II**: add "MiFIR review 2024/791" to the reference; stays Active.
- **FATCA/CRS**: reference becomes "FATCA IGA, CRS & DAC8 (crypto reporting from 2026)"; stays Active.
- **DORA**: change from "Upcoming" to **Active** — it has applied since 17 January 2025. Add "CySEC / CBC / ICCS" as regulators.
- **MiCA**: stays Active, adding a note that the CySEC transition period for existing crypto firms ended on 1 July 2025.

## Additions
- **NIS2** (Cybersecurity): Digital Security Authority, EU Directive 2022/2555, Active.
- **EU AI Act**: EU Regulation 2024/1689, "Phasing in" (main obligations from August 2026).

## Also fix
- The backup calendar entries that are now in the past or wrong (for example "DORA deadline Jul 2026", "MiCA ends Sep 2026") will be replaced with correct upcoming dates. The live calendar from the database is unaffected.

## Technical details
- Edit the `complianceAreas` and `fallbackCalendar` arrays in `src/pages/CompliancePage.tsx`; add a "changing/phasing in" status style next to Active/Upcoming.
- I'll double-check each date with a quick web search before writing it.
