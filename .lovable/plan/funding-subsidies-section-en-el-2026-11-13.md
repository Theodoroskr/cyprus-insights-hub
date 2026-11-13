# Funding & Subsidies section (EN/EL)

## What exists today
- There is no funding database yet. The SME page has a static "EU Funding Matchmaker" and an eligibility helper that hold no live calls.
- The Research & Innovation Foundation (RIF) is already a registered news source. Its news will stay as news, and its calls will feed the new section.
- Accounts, sign-in, the editorial dashboard, the hourly scheduler, the official-sources list and the Greek/English discovery agent already exist and will be reused.

## What visitors will see
- A new **Funding & Subsidies / Χρηματοδοτήσεις & Χορηγίες** link in the main menu, and a **Funding** link in the TourismHub menu that opens the section with the Tourism filter on.
- **Signed out:** an indexable landing page explaining the section, plus exactly 3 editor-picked, verified, open calls. Each shows title, issuer, short eligibility, deadline and the official application link. Below them are a "Register free to view all funding opportunities" button and a sign-in link.
- **Signed in (free account):** the full verified catalogue with search and filters: sector, applicant type, funding type, deadline, geography and programme. Grants, subsidies, vouchers, loans and other instruments each get their own label.
- **Views:** Open (the default, soonest confirmed deadline first), Upcoming, Ongoing and Closed.
- **Opportunity pages:** issuer, programme, call reference and round, budget, maximum award, co-funding rate, eligible costs, applicants, geography, consortium rules, dates, documents, the IRIS/Ermis application link where the issuer names one, and a "last verified" date.
- **Return after sign-up:** people come back to the call or filtered list they were viewing.
- **News links:** editors can link a published story to an opportunity, and the story shows a "Related funding call" box.

## What editors will see
- A new **Funding** tab in the editorial dashboard:
  - a review queue of imported and discovered calls; nothing is public until an editor verifies it
  - a field to pick the 3 public preview calls
  - a "submit official call URL" form for sources that can't be imported
  - change alerts for deadline extensions, budget used up, suspensions, corrections and eligibility changes
- Editor edits are never overwritten by later imports.

## Sources
1. **Collected automatically** where the site offers a feed, an API or a stable calls page:
   - Funding Programmes Portal, including its THALIA, Eurostars Cyprus and Deputy Ministry of Tourism pages
   - RIF
   - Ministry of Energy, Commerce & Industry (MECI)
   - RES & Energy Conservation Fund
   - EU Funding & Tenders Portal (its public search API, keeping only calls Cyprus applicants can enter)
2. **Each checked before it is added:** HRDA/ΑνΑΔ, Department of Labour, Interreg Greece–Cyprus, Euro-MED, NEXT MED, agriculture/rural development, fisheries, Erasmus+ and Creative Europe/culture. Any that can't be read reliably go to manual URL submission.
3. **Discovery agent:** it also suggests new funding sources and calls, which always go to review first.

Note: in earlier tests the Funding Programmes Portal did not answer from my side. If that continues, it starts as manual-only and the report says so.

## One record per call
- Calls are matched on issuer + call reference + round. A call listed on the portal and in Greek and English releases becomes one record with several source links.
- A new round is a new record. A revised deadline updates the matching round and is logged.
- Programme descriptions are kept as reference pages, not opportunities.
- Dates without a time are stored and shown exactly as published.

## Access rules (enforced by the database, not just hidden on screen)
- Signed-out visitors can read only the 3 preview calls, and only their preview fields. The same rule applies to direct links, search and the data feed.
- Signed-in users can read all verified calls. Unverified, rejected and ineligible calls are never public.

## Checks and report
- **Tests with real calls** from RIF, MECI and an EU programme:
  - a call listed in two places creates one record
  - a deadline change updates the right round
  - an EU call Cyprus applicants can't enter stays out of the catalogue
  - the Tourism filter shows the same records as the main section
- **Access checks**, signed out and signed in, across the list, search, direct links and data feed: exactly 3 previews when at least 3 are available, and the full catalogue after sign-in.
- **Final report:** which sources were reused, which import successfully, which need manual review, and verified open calls by sector, counted separately from discovery candidates.

## Technical details
- New tables (each with grants and row-level security):
  - `funding_sources`: or reuse of `open_data_sources` rows tagged module `funding`, to keep one registry
  - `funding_programmes`: reference pages
  - `funding_calls`: canonical record with `dedupe_key = issuer|call_ref|round`, `status` (review/verified/rejected/ineligible), `call_state` (upcoming/open/ongoing/closed), `is_preview`, `editor_locked_fields`, `deadline_date` + optional `deadline_time`
  - `funding_call_sources`: mirrors and documents
  - `funding_call_changes`: changes waiting for review
  - `article_funding_links`
- Signed-out visitors get no direct table access. The 3 previews come from a security-definer `get_funding_preview()` that returns preview columns only. Signed-in users read `funding_calls` where `status='verified'` through RLS.
- Edge function `ingest-funding`:
  - uses `requireTrustedCaller`, with a parser module per source in `_shared/funding/`
  - EU calls come from the SEDIA search API, filtered on eligible countries
  - runs on a managed daily HTTP schedule
- The discovery agent gets a `funding` mode.
- Routes:
  - `/funding`, `/funding/:slug`, plus `/explore/funding` which redirects to `/funding?sector=tourism`
  - entries added to the sitemap, ROUTE_META and `siteSections`
  - signed-in users' detail pages are `noindex`; the landing page is indexed
- Rules recorded in `AGENTS.md`; vitest tests for dedupe, round and deadline updates, eligibility filtering and preview limits.
