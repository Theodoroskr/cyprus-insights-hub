# Cyprus Open Data — next stage: source registry + Tourism Intelligence

The brief covers 17 phases and around 10 subject areas. I suggest building it in stages, reusing what already works on the site: the Real Estate import, the Trade import from CYSTAT and the editorial dashboard. This stage adds a shared list of official sources and the first new dashboard, Tourism. The remaining areas follow later, once each one's data has been confirmed.

## What I checked
- **The portal (data.gov.cy) has no machine-readable catalogue to download from.** I tried its standard catalogue address and it returned "not found". Each dataset page simply lists its files or links.
- **Real Estate (1007/1005) is already built and live.** It stays as it is, with no second copy.
- **The tourism datasets (2273, 2287, 2274) have no files of their own.** They point to CYSTAT's statistics database. The site already reads that database for Trade. It has *monthly* tourist arrivals by country of residence from 2002 onwards, plus annual totals.

## What gets built now
1. **Official Data Sources (admin):** one list of every official dataset the site uses, with:
   - publisher, link, licence, format, how often it's checked;
   - last check, last successful import, latest month and status.
   It covers Real Estate, Trade, Tourism and the regulators. New datasets can be added by pasting their data.gov.cy link. The site reads the page and lists the files it finds, and nothing imports until you switch it on.
2. **Tourism import:**
   - Monthly arrivals for Cyprus in total, by region (EU, Europe and so on) and by main country, read from CYSTAT.
   - It checks monthly, follows the same rules as Real Estate (blank means not yet published, never zero), and sends changed past figures to you for approval.
3. **Cyprus Tourism Intelligence page** (`/tourism`):
   - Headline figures: arrivals in the latest month, year to date, change on last year, and the top source country.
   - Charts:
     - Monthly trend and the seasonal pattern (each year's months side by side).
     - Annual history from 2002.
     - Top source countries and their share.
     - UK, Israel, Germany and Poland compared over time.
   - Part-year totals are labelled "year to date". Every page credits CYSTAT, and the data can be downloaded as CSV.
   - It gets a "Tourism" link in the top menu and footer, and goes in the sitemap.
4. **Open Data page** (`/open-data`): a simple public list of the sources the site uses, with a link to each dashboard and to the official source.

## Later stages (each one checked before it's built)
- Economic indicators (inflation, GDP, unemployment) from CYSTAT.
- Business demographics (business births and deaths, enterprises by sector), shown on directory sector pages.
- Construction (building permits).
- Public procurement: the national e-procurement system has no clear open download, so this needs checking first.
- Transport, energy, health and education, local government.
- Commercial extras: alerts, PDF reports, API access, and sharing with 11880.cy and RISQO.
- A full Greek version. Pages stay in English with Greek labels until the site gets a language switch.

## Technical details
- **New `open_data_sources` table:**
  - Columns: slug, title_en, title_el, publisher, portal_url, upstream_url, format, licence, check_frequency, enabled, last_checked_at, last_success_at, latest_period, status, last_error, module (`real_estate`, `trade`, `tourism` or `catalog`) and discovered_resources jsonb.
  - Public can read it; only admins can write.
  - Seeded with the existing sources. `re_sources` and the trade tables stay unchanged, and their importers also update the matching registry row.
- **Tourism tables:**
  - `tourism_arrivals_monthly` (period_date, country_code, country_label, region flag, arrivals int null, status), unique on country and period.
  - `tourism_revisions` and `tourism_import_batches`, mirroring the Real Estate ones.
  - Grants and RLS: public reads published rows, admins manage everything.
- **Edge function `ingest-tourism`:**
  - Protected by `requireTrustedCaller`.
  - Uses the existing CYSTAT PxWeb pattern from `ingest-cystat-trade`, querying the table "Arrivals of Tourists by Country of Usual Residence, Monthly".
  - The pure parser goes in `_shared/tourismParse.ts`, with tests.
  - Runs by cron on the 22nd at 06:00 UTC.
- **Edge function `discover-open-data`** (admin only): fetches a data.gov.cy dataset page and extracts the file and upstream links into `discovered_resources`.
- **Frontend:**
  - `TourismPage.tsx`, `OpenDataPage.tsx` and `OpenDataSourcesPanel.tsx` (a new dashboard tab).
  - The maths goes in `src/lib/tourismMetrics.ts`, reusing the year-to-date and momentum helpers from `realEstateMetrics.ts`, with tests.
- AGENTS.md gets a rule for the registry and tourism data.
