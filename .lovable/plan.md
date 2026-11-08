# Cyprus Real Estate Intelligence (/real-estate)

A new section built from official Department of Lands and Surveys data on the Cyprus Open Data Portal. It follows the same pattern as Trade Intelligence: automatic import, admin oversight and public charts. Everything else on the site stays as it is.

## What the checks found
- **The site already has what this needs:** monthly CYSTAT import and AI summaries (Trade), the scheduled-job setup, admin-only background jobs, charts, the editorial dashboard with a Health tab, and the sitemap. All of it will be reused.
- **Both official datasets download directly**, with no login: 1007 (sale contracts) and 1005 (transfers). The dataset page lists the files themselves (CSV and yearly Excel files), so the CSV files you mention don't need uploading. The import reads the files straight from the portal.
- **The site has no Greek/English switch today**, so full bilingual pages would be a separate project. In this phase pages are in English with Greek subtitles and labels (for example "Αγορά Ακινήτων"), and the Greek text will be saved so a full Greek version can follow later.

## Phase 1 — Data (this build)
- New database tables: data sources, sale contracts by district and month, transfers by district and month (cases, parcels, declared and accepted value in exact euros), import batches and revision history. Districts accept spelling variants such as PAFOS, ΠΑΦΟΣ and Λευκωσία.
- **Importer:**
  - Reads the official page, finds the newest files and detects whether they changed.
  - Converts the wide district columns into one row per district per month.
  - Keeps blank months blank, never zero.
  - Rejects rows that don't parse, and logs every changed historical figure with its old and new value.
- **Approval:** new months publish automatically, but changes to already-published figures wait in the Review tab for an admin. If the portal is down, published data stays untouched and the error appears in Health.
- **Schedule:** checks run monthly on the 20th, and admins can also start a check by hand. You asked for quarterly, but monthly is safe because nothing changes when no new file is out.
- **Public pages see only published figures.** Imports and revisions are admin-only.

## Phase 2 — Public dashboard (this build)
- `/real-estate`, titled "Cyprus Real Estate Intelligence", with the latest reporting period shown.
- **8 headline figures:** contracts, transfer cases, parcels, declared value, accepted value, and year-on-year change for contracts, transfers and accepted value. Each has a "what this means" tooltip and shows its source.
- **Charts:**
  - Contracts since 2016.
  - Transfers and values from the start of the available history.
  - Accepted versus declared value.
  - Contracts compared with transfers, with a note that they are different events.
  - Each district's share of the market.
- **Filters:** district (several at once), year or date range, and monthly, quarterly or annual view.
- **Part-year handling:** the current year is labelled "year to date" and compared only with the same months of earlier years.
- **Indicators:**
  - Year-on-year growth.
  - 3-month and 12-month momentum.
  - District share.
  - Accepted-to-declared ratio.
  - "Accepted value per transfer case", clearly labelled as not an average price.
- **No forecasts and no invented price index.**
- **5 district pages** (`/real-estate/limassol` and the other four), each with its figures, trends, share of the national market, comparison with Cyprus overall, and links to the other districts.
- **Attribution on every page:** "Source: Department of Lands and Surveys, Republic of Cyprus, via the Cyprus Open Data Portal", linking to both datasets, the licence, and a note on how we processed the data.
- **For search engines and the menu:** page titles and descriptions, sitemap entries, and a "Real Estate" link in the top menu.

## Phase 3 — Admin and downloads (this build)
- **Real Estate card in the editorial dashboard:**
  - Source status: last check, latest month and next check.
  - "Check now" button.
  - Import history with row counts.
  - Revisions waiting for approval.
  - Undo a batch.
  - Upload a CSV or Excel file by hand as a fallback.
- **CSV downloads** of the filtered data, with the source and definitions included. They use the same formula-safe export as the subscriber list.

## Later (not in this build)
- Full Greek version of the site.
- PDF and Excel reports.
- Sharing the data with 11880.cy, RISQO and CompaniesHouseCyprus.
- Weekly AI market summaries in the style of Trade.

## Technical details
- **Tables:**
  - `re_districts`, `re_sources`, `re_import_batches`, `re_sale_contracts` and `re_transfers`. The sale contracts and transfers tables are unique on district and month, with `numeric(16,2)` amounts and a `status` column (published or pending).
  - `re_revisions` (JSON of the old and new values).
  - Grants and RLS: anon can read published rows only, and admins can do everything.
- **Edge function `ingest-real-estate`:**
  - Protected by `requireTrustedCaller`.
  - Scrapes the dataset HTML for `/sites/default/files/*.csv|xlsx` links.
  - Uses a SHA-256 checksum per resource.
  - Parses with the existing `_shared/xlsxReader.ts` plus a CSV parser that handles encoding detection (UTF-8, falling back to Windows-1253).
  - Pure parsing goes in `_shared/realEstateParse.ts`, with tests.
- **Cron** on the 20th at 06:00 UTC, with the `x-cron-secret` header.
- **Frontend:** `RealEstatePage.tsx`, `RealEstateDistrictPage.tsx` and `RealEstatePanel.tsx` (admin). Charts use recharts. Pure maths (year to date, momentum, ratios) goes in `src/lib/realEstateMetrics.ts`, with tests.
- **Before building:** download the files and check the real column layout and the licence, and adjust the parser to match.
