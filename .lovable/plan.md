# Phase 5 – Financial Literacy validation and go-live readiness

This phase checks what has already been built and fixes only small defects it finds. It adds no new sections and makes no redesign. Every item gets one of five statuses: tested, built but not verified, partial, not built, blocked. Nothing is marked working without a test run this turn.

## 1. Status audit
Go through the code, database, scheduled jobs and all 10 public pages. Tick off each item from the brief. Earlier work is not assumed to have succeeded.

## 2. OECD check
- Compare every stored OECD figure against the report text: score, scale, survey year 2023, publication year 2025, link and page reference.
- Search the pages for any "2025" or "2026" wrongly shown as a survey year.
- Confirm draft breakdowns stay hidden from visitors until approved.

## 3. Central Bank check
- Re-download each of the 7 series and compare the latest 3 months with the stored values. Also check units and the full Jan 2020 – Sept 2026 coverage.
- Household indebtedness has no verified series. Add a clear "not yet available" card for it on the Observatory, rather than showing nothing.

## 4. Automation tests (no changes to Eurostat or CYSTAT)
- Confirm both monthly schedules exist with the right timing. Test the Cyprus-hour guard in winter and summer.
- Manual refresh twice in a row: the second run must add no duplicates.
- Revision test: change one stored past value, run the import, confirm a pending revision appears and the public value is unchanged, then reject it and restore the value.
- Failure test: point a temporary copy of one series at a bad key. Confirm the error is recorded, the existing figures stay, and the health check raises an admin alert. Then restore it.
- OECD monitor test: remove one known publication from its saved list. Confirm it is detected and admins are notified, then restore the list.
- Check the import history and approval screens as admin.

## 5. Public pages
- Run a browser pass over all 10 sections at desktop and mobile width. Check:
  - menu links and breadcrumbs
  - charts and CSV downloads
  - English/Greek switch
  - page titles and descriptions
  - console errors
  - broken internal links
- Run a basic accessibility pass: headings, labels, alt text, focus, and a text alternative for charts (a short table/summary under each chart if missing).
- Spot-check Economy and the homepage so nothing regressed.

## 6. Lessons and calculators
- Recheck the six calculator formulas with known answers. Test that blank or negative inputs are handled.
- Confirm the disclaimers and that no input is saved.
- Lessons: confirm the 37 drafts stay hidden from visitors, and preview them as admin.
- Quizzes are not built yet; this will be reported, not built.

## 7. Data governance
- Read the access rules on the survey, Academy, statistics, revision and source tables: visitors can read only approved or published rows, and only admins can change them.
- Run the security linter.
- Check source credits and licences (OECD CC BY 4.0, ECB, Eurostat).
- Confirm no personal financial data is collected. Check that admin changes are logged (revision decisions, connector audit).

## 8. Final report
- Save `/mnt/documents/financial-literacy-phase5-report.md` with the 10 sections the brief asks for, including a prioritised fix list and a go-live recommendation.
- Small defects found along the way are fixed and retested in this turn. Larger items are listed with what is blocking them.

## Technical details
- Test data changes go through the data tool and are always restored. Every change is listed in the report.
- Revision and failure tests run against single series only, using a forced admin refresh.
- New tests are added only for rules not covered yet: the indebtedness "unavailable" state and calculator input validation.
