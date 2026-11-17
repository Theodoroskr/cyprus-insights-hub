# Greece edition (BusinessHub.gr) — phase 1

Live at businesshub.cy/greece first; businesshub.gr takes over once the domain is connected. Cyprus pages, links and canonicals stay as they are.

## What visitors get
- **Edition switcher** in the header and menu: "Κύπρος / Cyprus" and "Ελλάδα / Greece". The Greece pages always show a "Cyprus Edition" link back.
- **/greece homepage** in Greek (EL/EN toggle) with the H1 "Επιχειρηματική ενημέρωση για την Ελλάδα" and the subheading you gave. It has a lead story, a latest announcements list, short blocks for Banking & Finance, Company Announcements, Funding & Tenders and Economic Indicators, and the existing banner slots.
- **Greece navigation**: Επιχειρήσεις, Τράπεζες & Χρηματοοικονομικά, Εταιρικές Ανακοινώσεις, Χρηματοδοτήσεις & Διαγωνισμοί, Οικονομικοί Δείκτες, FinTech & Συμμόρφωση, Ελλάδα–Κύπρος. Each one reuses an existing section layout.
- **Banking & Finance** has filters for Financial Results, Corporate Announcements, SME Finance and Payments & FinTech. It also gets organisation pages for NBG, Eurobank, Alpha Bank and Piraeus Bank, showing approved items, official links and related companies or people.
- **Company Announcements** has two tabs: Listed Company Disclosures and Funding & Investment Deals.
- **Greece–Cyprus**: one story record can show in both editions, with the cross-border link stated. Search and filters only cover the current edition by default.
- The analysis box shows "Τι συνέβη / Γιατί έχει σημασία / Τι να κάνετε" in Greek.
- A normal empty state appears wherever no verified content exists yet.

## Sources
- All ~35 source pages from your brief go into the source register. Each one records its country, publisher, type, section, priority (P1/P2) and status.
- Every source starts as **not collecting**. I'll check each one against the live site, then switch on only pages with a confirmed RSS feed or a crawlable public announcements page, starting with P1 bank and press pages.
- Sources that can't be collected automatically are marked "manual". Editors get a "Submit link" box for them.
- Everything collected goes to the editorial review queue. Nothing publishes automatically.
- Duplicate checks use the source link, the issuer's announcement number, and matching title + issuer + date. An exchange filing and a bank press release about the same event become supporting sources on one story.
- Funding & Tenders shows the issuer, area, who can apply, the Upcoming/Open/Closed status, the deadline and the official link. A call is only marked as open to Cyprus firms once that is confirmed.
- Economic Indicators show the period, unit and source on every figure. Greece is compared with Cyprus only when these match, and cards without verified data stay hidden.

## Out of phase 1 (follow-up)
Automated Bank of Greece / ELSTAT / data.gov.gr series, procurement feeds, ΓΕΜΗ, and P2 sector sources. These stay registered as "manual review" until their data links are verified.

## Technical details
- Backward-compatible migration:
  - `edition text[] default '{cy}'` on `cna_articles`, `company_announcements`, `funding_calls` and the analysis tables, with a GIN index.
  - `content_sources` gets `country`, `markets`, `priority`, `ingestion_status` (`registered|verified|active|manual`) and `publisher`.
  - New `organisations` table (slug, names EL/EN, official links, `directory_company_id`).
  - New tables `greece_indicators` / `stat_*` reuse, with period/unit/frequency/last_refresh.
- Greek text: Greek-source articles keep their original Greek (`title_el`, `summary_el`, `body_el`, `analysis_el`) next to the English translation. This changes the current English-only rule, which will be updated in AGENTS.md. English only shows when a translation exists.
- `src/lib/edition.ts`: `useEdition()` resolves the edition from the hostname (businesshub.gr) or the `/greece` path prefix. `canonicalUrl()` and the postbuild page heads point Greece pages at https://businesshub.gr once the `GR_DOMAIN_LIVE` flag is on. After that, /greece/* URLs on .cy redirect client-side to the matching .gr page.
- Existing queries default to `edition @> '{cy}'`, so Cyprus feeds stay unchanged. Scrapers set the edition from the source's country.
- Sitemaps and RSS get a separate Greece file.
- Domain: connect businesshub.gr as a second domain without making it primary. At the moment the .cy primary would redirect all traffic to .cy, so this needs either unsetting the primary or keeping Greece on /greece until then. I'll confirm the setting before connecting.

## Checks before reporting
Desktop and mobile at 375px, EL/EN switching, search limited to the edition, source attribution, deduplication, a shared Greece–Cyprus story with one record, and the Cyprus nav, publishing, crawlers and banners unchanged. Then I'll report the preview URL, which sources are active and which are manual, and what's left for businesshub.gr.
