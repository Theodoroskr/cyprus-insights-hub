# Bank of Greece travel figures

- The Bank of Greece (and its open-data/data.gov.gr file links) blocks automated downloads, so `gr_travellers` is filled only by an admin uploading the official .xlsx here; `preview` parses and compares without writing, `import` writes. Why: the figures must come from the bank's own file, and the admin sees every number first.
- Only the all-countries Total line is read (`_shared/bogTravel.ts`); single quarters or months only, cumulative spans are skipped, conflicting or out-of-range totals abort the whole file; new periods publish, changed periods go to `stat_revisions`. Why: no guessed or silently overwritten figures.
- `gr_travel_receipts` is the bank's balance-of-payments travel credit as published by Eurostat (`bop_c6_q`), refreshed by `ingest-eurostat`, not by this function. Why: an automatic official route exists for receipts.
