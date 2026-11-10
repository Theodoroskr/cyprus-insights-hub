# Financial Literacy module — status audit and next phase

Assessment only. Nothing was changed. Figures below come from the live database and code as of 10 Nov 2026.

## 1. Status matrix

| Requirement | Status |
|---|---|
| Financial Literacy page and navigation | Not implemented |
| Cyprus financial literacy dashboard | Not implemented |
| OECD financial literacy benchmarks | Not implemented (source verified: OECD 2023 survey, published 2025) |
| Eurostat API integration | Implemented and tested (12 datasets, daily) |
| ECB data | Not implemented |
| CYSTAT / Cyprus Open Data | Implemented and tested (Economy, Tourism, Trade, Real Estate) |
| Central Bank of Cyprus data | Partial: licence registers only, no household debt/lending statistics |
| Financial education content | Not implemented (Resource Hub can host it) |
| Financial calculators | Not implemented (old SME tools removed from menus) |
| Historical data from 2020 | Implemented: every dataset has 2020+ and 2024 values |
| Automatic refresh | Implemented and tested (Eurostat daily 07:15 Cyprus; CYSTAT weekly/monthly) |
| Source attribution and reference periods | Implemented on Economy cards, charts and footer |
| Data administration and monitoring | Implemented: dataset settings, manual refresh, revisions, import history, health alerts. Admin buttons opened, not pressed in browser |
| Greek and English | Partial: headings/titles bilingual, body text English only |
| Roles and audit logs | Implemented: admin role, database rules, import/revision history with approver |

## 2. Verified dataset inventory (Cyprus)

All values are real imports from official APIs. None are manually entered or placeholders.

| Indicator | Eurostat dataset | Range | Latest |
|---|---|---|---|
| Inflation HICP | prc_hicp_minr | 2020-01 to 2026-10 | Oct 2026 (estimate) |
| Food inflation | prc_hicp_minr | 2020-01 to 2026-09 | Sep 2026 |
| Unemployment | une_rt_m | 2020-01 to 2026-09 | Sep 2026 |
| Employment 20–64 | lfsi_emp_a | 2010–2025 | 2025 |
| Disposable income | tec00113 | 2014–2025 | 2025 |
| Household consumption | nama_10_gdp | 2010–2025 | 2025 |
| Saving rate | tec00131 | 2014–2025 | 2025 |
| Net earnings | earn_nt_net | 2014–2025 | 2025 |
| Poverty risk | ilc_li02 | 2010–2025 | 2025 |
| Poverty or exclusion | ilc_peps01n | 2015–2025 | 2025 |
| Can't face unexpected expenses | ilc_mdes04 | 2010–2025 | 2025 |
| Price level vs EU | prc_ppp_ind_1 | 2010–2025 | 2025 |

All 12 last imported successfully on 10 Nov 2026, 19:32 UTC. Next check: 11 Nov, 05:15 UTC. Each has EU-27 comparison (inflation also euro area).

CYSTAT (`econ_indicators`): CPI, HICP, GDP, unemployment and youth unemployment, back to the 1990s/2000s, latest Oct 2026 (monthly) or Q2 2026 (quarterly). Refreshed weekly.

## 3. Architecture findings

- Reusable: official sources list with health alerts, the statistics store (datasets, observations, revisions, import jobs), admin-only server checks, chart/card patterns, Resource Hub for long-form content.
- Avoid duplication: new data (ECB, CBC statistics, OECD findings) should go into the same statistics store, not new one-off tables.
- Security: public sees only published figures; dataset errors are hidden from visitors; imports need an admin or scheduled job.

## 4. Issues found

- Eurostat's HICP and CYSTAT's CPI are both called "inflation" on the same page (Oct 2026: 5.4% vs 4.4%). They measure different indices and need clearer labels.
- Inflation series ending 2025 (`prc_hicp_manr`) was retired by Eurostat; the replacement is in use.
- Survey figures (OECD, CBC) only exist in PDFs, so they need an admin-approved entry step.
- Greek body text is missing everywhere.

## 5. Prioritised backlog

| # | Task | Depends on | Size | Done when | Impact on existing |
|---|---|---|---|---|---|
| 1 | Clarify HICP vs CPI labels on Economy | — | S | Each card names its index | Text only |
| 2 | OECD/CBC survey findings store + admin approval | — | M | OECD 2023 figures entered with page refs, approved | New tables only |
| 3 | Financial Literacy page: overview, Cyprus literacy, household health, cost of living | 2 | M | Every card shows publisher, year, unit, link; missing = "Data not available" | New page |
| 4 | ECB household debt-to-income connector | — | M | Cyprus + euro area series 2020+, daily check | Reuses store |
| 5 | CBC household lending statistics | verify source format | M–L | Official tables imported or marked blocked | Reuses store |
| 6 | Six calculators with formulas and disclaimer | — | M | Formulas tested; nothing saved | New page tab |
| 7 | Nine bilingual lessons with quizzes | your answer on authorship | L | Published with Greek review | Uses Resource Hub |
| 8 | Credit & Borrowing tab | 4, 5 | S | Shows verified series | — |
| 9 | Production test pass | 1–8 | S | Permissions, figures, mobile, both languages checked | — |

## 6. Recommended next prompt

"Build steps 1–3: relabel HICP vs CPI on Economy, add the admin-approved survey findings store with the OECD 2023 Cyprus figures, and build the Financial Literacy page (Overview, Cyprus Financial Literacy, Household Financial Health, Cost of Living) using existing Eurostat data. Footer and Economy page link only."

Approving this plan starts steps 1–3.
