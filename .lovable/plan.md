# Unified Financial Literacy Observatory (OECD + Central Bank of Cyprus)

## What I checked
- **Survey results already stored and approved:**
  - OECD 2023: overall 56/100, 17% reaching the target, knowledge 25/35, behaviour 21/45, attitudes 10/20, digital 44/100, compound interest 34%.
  - Central Bank of Cyprus 2018: knowledge 4.78/7.
  - Breakdowns by gender, age and income are **not** stored yet.
- **Statistics store:** only Eurostat feeds the shared statistics tables today. CYSTAT data (Economy page) uses its own tables.
- **Central Bank figures:** the Central Bank sends Cyprus's monthly banking statistics to the European Central Bank. The ECB publishes them through an official, free download service. I tested it today and got Cyprus monthly series up to **September 2026**, including:
  - household loans
  - household deposits
  - mortgage and consumer-loan interest rates
- This is the reliable automatic route. The Central Bank's own website mostly offers PDF and Excel releases, which I would use only as a manual fallback.

## What visitors will see (Observatory page, no new sections)
- **A – OECD survey:** the existing gauge and score bars, plus gender, age and income comparisons once I've checked them against the report. Labels: "Survey reference year: 2023 · Published: 2025". The Central Bank 2018 survey is shown separately, with the "not comparable" note.
- **B – Household banking (Central Bank of Cyprus):** household deposits, household loans (total, housing, consumer), mortgage rate, consumer-loan rate, deposit rate and household debt trend. Each figure has:
  - a chart from 2020, with year filter and CSV download
  - a Cyprus vs euro area comparison where the definitions match
  - publisher, unit, latest period and source link
- **C – Cyprus financial conditions:** links to the existing Eurostat/CYSTAT figures (inflation, income, saving, price level, unexpected expenses) using the current cards. These also appear in Household and Cost of Living.
- **Credit & Borrowing:** the "coming once verified" box is replaced with the real loan and interest-rate figures.

## Monthly automation (5th of each month, 04:00 Cyprus time)
- **Central Bank job:**
  - Downloads the chosen series and checks the units and periods.
  - New months publish automatically.
  - A changed past figure is held for your approval, never overwritten.
  - A failed run keeps the existing figures.
  - It retries up to 3 times, then alerts admins.
- **OECD job:**
  - Checks the OECD Cyprus publication page and OECD's financial literacy publication list for changes or new Cyprus reports.
  - Records the check and alerts admins when something changes.
  - It never extracts or publishes numbers from a PDF automatically. New figures are entered as drafts and approved by you, as today.
- Eurostat and CYSTAT schedules stay as they are.

## Admin (existing Official Data Sources tab)
- A single table for OECD, Central Bank, Eurostat and CYSTAT showing:
  - latest period
  - last check
  - last successful import
  - status: current / review needed / error
  - a "Run check" button
- Revision review uses the existing approval screen. Import history and errors stay viewable.

## Deliverables
- A short report with:
  - the architecture assessment
  - an inventory of the verified OECD findings, with page references
  - the Central Bank data feasibility check
  - which series are covered, from which month

## Not done
- No automatic number extraction from PDFs.
- No combined "score" mixing different measures.
- No new public sections.

## Technical details
- Add a new source `ecb` to `stat_datasets`, with about 9 series. Keys come from ECB BSI and MIR, e.g.:
  - `BSI.M.CY.N.A.A20.A.1.U2.2250.Z01.E` (household loans)
  - `MIR.M.CY.B.A2C.A.R.A.2250.EUR.N` (mortgage rate)
  - `U2` series for the euro-area comparison
- Each series key is checked against the live API before it is added.
- The ECB SDMX CSV API is used for `ingest-ecb` (data-api.ecb.europa.eu, free reuse with attribution). The function:
  - is protected by `requireTrustedCaller`
  - reuses the same new-period/revision logic as `ingest-eurostat`: shared helper, `stat_observations`/`stat_revisions`/`stat_import_jobs`
- `check-oecd-publications` hashes the publication page and an OECD search listing, stores the result on its `open_data_sources` row, and raises an admin notification on change.
- Demographic findings are added as draft `fin_lit_findings` rows (with page refs) for admin approval.
- Scheduling:
  - Two cron jobs at 02:00 UTC on the 5th (04:00 Cyprus winter time); the functions skip if the local hour is wrong, so summer time is handled too.
  - Retry with backoff runs inside the function.
  - Repeated failures feed the existing `check-open-data-health` alerts.
- Database changes: a few new `stat_datasets` rows and 2 `open_data_sources` rows (data, not new tables). Possibly one small migration if `stat_datasets.source` limits its allowed values.
- Tests:
  - ECB CSV parser: units, blank cells kept blank, duplicate periods
  - revision detection
  - the DST schedule guard
