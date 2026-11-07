# Fix Hellenic Bank / Eurobank profile

## What is wrong today
- The "Hellenic Bank" profile (featured and curated) is linked to a basic placeholder record that an old CIFA member import created. That record:
  - has no registration number
  - is labelled "Fund Administrator / Investment Manager" instead of bank
  - is not marked as supervised by the Central Bank
  - shows a "Former CySEC licence – Voluntary renunciation" badge, which actually belongs to a small, old investment licence held by "Hellenic Bank (Investments)"
- The real registry record (registration no. 6771, now named "EUROBANK LIMITED") is a separate profile. Its status reads "Reminder Letter Sent".
- Nothing on the site says Hellenic Bank merged into Eurobank.

## The facts we'll use
- On 1 September 2025 Eurobank Cyprus Ltd's business was transferred to Hellenic Bank Public Company Limited, which was then renamed **Eurobank Limited** ([source](https://www.eurobank.cy/en/group/results-and-reporting)).
- The minority shareholders were bought out and Hellenic Bank's shares were taken off the stock exchange ([source](https://cyprus-mail.com/2025/09/15/eurobank-hails-seamless-merger-outlines-next-steps-for-clients)).
- So legally, Eurobank Limited (registration 6771) **is** the former Hellenic Bank under a new name.

## Changes
1. **One profile:** fold the placeholder "Hellenic Bank Public Company Limited" record into the registry record 6771 "EUROBANK LIMITED". Its links (featured card, curated profile, licence rows) move across, and the placeholder is removed.
2. **Correct details on Eurobank Limited:**
   - Status: Active. Type: Credit institution (bank). Supervised by the Central Bank of Cyprus.
   - Website: eurobank.cy. Description: "Formerly Hellenic Bank Public Company Limited; renamed Eurobank Limited after absorbing Eurobank Cyprus Ltd on 1 September 2025."
   - Drop the misleading CIFA "fund administrator" membership row. Keep the old "Hellenic Bank (Investments)" CySEC licence only as history, so the main badge no longer says "Voluntary renunciation".
3. **Old name still searchable:** save "Hellenic Bank" and "Hellenic Bank Public Company Limited" as former names. Searches and future news mentions of Hellenic Bank then land on Eurobank Limited automatically.
4. **Company timeline:** add two published events with their sources:
   - "Eurobank acquires Hellenic Bank; minority squeeze-out and delisting" (2024–2025)
   - "Legal merger with Eurobank Cyprus; renamed Eurobank Limited" (1 September 2025)
5. **Featured card:** rename it to "Eurobank (formerly Hellenic Bank)", update its website, and point it to the merged profile.
6. **Show former names on profiles:** company pages will show a small "Formerly: …" line under the company name, using the saved former names.

## Please confirm
- That the featured card should read "Eurobank (formerly Hellenic Bank)" rather than plain "Eurobank".
- Whether anything else on the profile looks wrong to you, for example people, address or bank size.

## Technical details
- Merge with `merge_directory_duplicate(_dup := 2e26092f…, _keep := 5264aa14…)`, then update `companies.directory_company_id` and `featured_companies`. Delete the CIFA `regulated_entities` row and its licensed record.
- Insert rows into `company_aliases`. Insert `company_events` with `event_type` merger_acquisition / corporate_restructuring, status `approved` and the source URLs.
- Update fields on `directory_companies`. CySEC flags are recomputed from the remaining rows: the former CIF stays in history and `cysec_licensed` stays false.
- UI: `RegistryCompanyPage` reads `company_aliases` and shows a "Formerly" line.
- All changes are data edits plus one small UI addition. The database structure does not change.
