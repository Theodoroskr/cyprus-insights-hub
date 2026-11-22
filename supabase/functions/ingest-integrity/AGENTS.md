# Corruption & Public Integrity rules

- CPI figures come only from Transparency International. Rows are keyed by `country_iso3` + `edition_year`, start as `staged`, and go public only through `publish_cpi_edition` (one transaction). Earlier editions are kept. Why: no unreviewed or partial datasets.
- Missing scores or ranks stay null and display as "Unavailable". Ties (`rank_tied`) and each edition's own `countries_covered` are kept. Why: legal accuracy.
- Eurobarometer survey figures live in `integrity_survey_findings` and are never charted or ranked with CPI scores. Why: they measure something different.
- The check (Monday 09:00 Nicosia, `local_hour` guard) only adds `pending` rows to `integrity_source_updates`, deduped on canonical URL + content fingerprint, and never edits published figures. Failures are logged in `integrity_check_runs`. Why: last approved figures always stay visible.
- "Create drafts" makes one `cna_articles` draft per audience (cy/gr/intl). Greek drafts use the Greek section headings, and each draft carries the publisher, link, dates and a claim label (investigation/finding/ruling). Why: nothing publishes without an editor, and investigations are never presented as rulings.
- Per-source health lives in admin-only `integrity_source_health` (status via `classifyFailure`, alert to admins only on working↔failing change via `healthChanged`); a changed address must pass `action: test` before it is saved, and "Manual check" sources are skipped by the scheduled run. Why: blocked feeds are visible, not silent.
