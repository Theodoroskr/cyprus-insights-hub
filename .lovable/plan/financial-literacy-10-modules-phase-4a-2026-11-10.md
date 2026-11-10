# Financial Literacy – 10 modules (Phase 4A)

## 1. What exists today

| Current page / section | Contents |
|---|---|
| `/financial-literacy`: one long page | Survey results (OECD 2023, CBC 2018), Household financial health (6 Eurostat cards), Cost of living (4 cards), "Explore the figures" chart, Money basics (9 topic cards), six calculators, Sources & methodology, Academy link |
| `/financial-literacy/academy` (+ programme and lesson pages) | 5 programmes, 37 lessons (still drafts), each lesson with one calculator embedded |
| Editorial dashboard | Survey approvals (Open Data tab), Academy tab |

**Overlaps:**
- "Money basics" topic cards repeat what the Academy programmes cover.
- The one chart mixes household and cost-of-living figures.
- The calculators appear both on the main page and inside lessons. That one is fine, because both places use the same calculators.

**Not built yet:** credit & borrowing figures, research & publications, campaigns.

## 2. New structure (one sub-page per module, all under /financial-literacy)

| # | Module (EN / EL) | Address | Contents (moved, not rebuilt) |
|---|---|---|---|
| 1 | Overview / Επισκόπηση | `/financial-literacy` | Short intro, 4–5 headline figures, and cards linking to the other 9 modules |
| 2 | Observatory / Παρατηρητήριο | `/financial-literacy/observatory` | OECD and CBC survey gauges and bars, plus the "not comparable" note |
| 3 | Household Financial Health / Οικονομική Κατάσταση Νοικοκυριών | `/financial-literacy/household` | 6 household cards + chart limited to household indicators |
| 4 | Cost of Living / Κόστος Διαβίωσης | `/financial-literacy/cost-of-living` | 4 price cards + chart limited to price indicators; link to Economy |
| 5 | Credit & Borrowing / Πίστωση & Δανεισμός | `/financial-literacy/credit` | Loan calculator, links to Academy programme B and the credit lessons. Official household debt figures are listed as "coming once verified" — no figures invented |
| 6 | Financial Education Academy / Ακαδημία | `/financial-literacy/academy` (unchanged) | Programmes and lessons; the "Money basics" topic cards move here as a quick-start strip. A future assessment and certificates also go here |
| 7 | Financial Calculators / Υπολογιστές | `/financial-literacy/calculators` | All six calculators. A link in the address (e.g. `#loan`) opens a specific one. Lessons get a "see all calculators" link |
| 8 | Research & Publications / Έρευνες & Δημοσιεύσεις | `/financial-literacy/research` | List of the source reports behind the survey results (OECD Policy Paper 79, CBC Working Paper), and relevant Resource Hub guides |
| 9 | Campaigns / Εκστρατείες | `/financial-literacy/campaigns` | A short "first campaigns coming soon" page with the three planned themes. Nothing is stored; campaign building stays in Stage D |
| 10 | Sources & Methodology / Πηγές & Μεθοδολογία | `/financial-literacy/methodology` | The existing methodology text + list of datasets with source, period and update date |

**Navigation:**
- Every Financial Literacy page gets a sticky bar with the 10 modules, each with an icon. It shows English or Greek labels according to the language switch.
- On a phone, the bar scrolls sideways.
- Breadcrumbs follow the pattern Financial Literacy / Module. Academy lessons keep their deeper breadcrumbs.
- Each module ends with 2–3 "Related" links.
- The language switch is shared by all Financial Literacy pages.

**Existing addresses:** `/financial-literacy` and every Academy address stay the same, so no redirects are needed. Old section anchors such as `#calculators` on the main page are sent to the new module pages.

## 3. What does not change
- No new database tables.
- No changes to data, approvals or the admin dashboard.
- Nothing is removed. Every figure, chart, calculator and text block on today's page stays reachable in exactly one module.
- The new pages are added to the sitemap, with their own search titles in English and Greek.

## Technical details
- New `FinLitLayout` component with the module nav, breadcrumbs, language switch (reuses `useAcademyLang` and `LangSwitch`) and a related-links footer. The module list lives in one `FINLIT_MODULES` constant.
- `FinancialLiteracyPage.tsx` is split into small module pages under `src/pages/finlit/`.
  - Shared data loading is pulled out into a `useFinLitStats` hook, so stats aren't fetched twice per page.
  - `StatChart` takes the dataset list per module.
- `Calculators` gains an initial tab from the address (`#budget`, `#loan`, …).
- Add 9 routes in `App.tsx`, plus static sitemap entries.
- Test: the module list has exactly 10 entries, each with an English and a Greek label, and the addresses are unique.
