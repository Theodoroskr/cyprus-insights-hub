# Why three Greece Business Pulse cards say "Data unavailable"

The import tools are built and ready, but the data they need has not been added yet:

- **Active registered businesses / New business registrations (GEMI):** no GEMI access key is saved yet. The importer starts only after a working key is saved and tested.
- **Inbound travellers (Bank of Greece):** the Bank of Greece blocks automatic downloads, so an editor has to upload its official spreadsheet once. Nothing has been uploaded yet.

## What you need to do (nothing to build)

1. Get a free GEMI Open Data key from opendata.businessportal.gr (register, then copy the API key).
2. Go to Editorial → Open data → the GEMI card, paste the key and press **Test and save**. If the test passes, the first import starts by itself and both GEMI cards fill in within a few minutes.
3. Download the Bank of Greece "Travel receipts / Inbound travellers" .xlsx from bankofgreece.gr (Statistics → External sector → Travel). In Editorial → Open data → Bank of Greece upload, choose the file, check the preview and press **Import**.

## Optional change I can make

Change the three "Data unavailable" messages so visitors see a softer "Coming soon" note instead, and only admins see the "waiting for import" reason.

## Technical notes
- Checked: `internal_secrets` has no `gemi_api_key`; `stat_observations` has 0 rows for `gr_gemi_active`, `gr_gemi_new`, `gr_travellers`.
