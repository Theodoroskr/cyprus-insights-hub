# Corruption & Public Integrity research section

## What visitors get
Three pages, one shared layout, with a "Cyprus | Greece | International" switcher:

- **Cyprus** `/research/corruption-perceptions/cyprus` — English by default, Greek via the language selector. Headline "Cyprus scores 55/100 ... seven points below the EU average". Score, change (-1), rank (tied 49th of 182), trend 2022–2025, EU (62) and global (42) benchmarks, procurement and integrity updates.
- **Greece** `/research/corruption-perceptions/greece` — Greek by default, English via `?lang=en` (same rule as the rest of Greece). Score 50 (+1), tied 56th of 182, trend, EU benchmark, Greek business developments.
- **International** `/research/corruption-perceptions/global` — global average 42, 182 countries, 122 below 50, Denmark top at 89. Searchable ranking, year filter, regional benchmarks, compare up to three countries' trends.

Each page shows three separate dates: CPI edition year, release date (10 Feb 2026), and our last verified date. A short note explains the 0–100 scale (higher means less perceived corruption). Ties stay ties ("=49"), and each year keeps its own country count (180 or 182). Missing values say "Unavailable". Every chart, figure and update names its source with a link.

A separate **Business survey findings** panel (Eurobarometer 2026: Cyprus 46%, Greece 79%, EU 37%) is labelled as survey results, links to the EU country chapters, and stays out of the CPI chart and ranking.

Links: added to "Data & rankings" in the main menu, the Greece data area, and the International Data page. Related ComplianceHub stories come from existing tags (corruption, anti-bribery, procurement, GRECO, rule of law).

## Data and updates
- First data load uses your verified figures. Greece's other years and the full country table come from Transparency International's official dataset file. Any figure that doesn't match your brief stops the load.
- **Every Monday at 09:00 Cyprus time** the system checks Transparency International, the EU rule-of-law chapters, GRECO, the OECD Working Group on Bribery, Cyprus's Anti-Corruption Authority and Audit Office, and Greece's National Transparency Authority. Editors also get a **"Check sources now"** button.
- A new CPI year or a correction is **staged, not published**. Editors see a preview of the changed scores, ranks, country counts and benchmarks, then publish it all at once. Earlier years stay for comparison.
- An important official development creates **separate drafts** for Cyprus, Greece and International: "What happened / Why it matters / What to do or watch", in Greek for Greece ("Τι συνέβη / Γιατί έχει σημασία / Τι να παρακολουθήσουμε"). Each draft shows the publisher, link, publication date and date checked, and labels whether something is an investigation, a finding or a final ruling. Nothing goes public until an editor approves it.
- If a source is down or fails checks, the last approved figures stay on the pages. The failure shows in admin with a Retry button.

## Technical details
- Tables (staff-only writes; the public sees only `published`): `cpi_editions` (year, release_date, countries_covered, global_avg, eu_avg, status staged/published, verified_at), `cpi_results` (unique country_iso3+edition_year, score nullable, rank, rank_tied, region), `cpi_benchmarks` (edition, scope EU/global/region, value), `integrity_survey_findings`, `integrity_source_updates` (unique canonical_url + content_hash, publisher, published_at, checked_at, claim_status, audience[]), `integrity_check_runs` (status, error). One `open_data_sources` row per source. Grants and RLS follow `public-schema-grants`, with staff checked through `has_role`.
- Edge function `ingest-integrity` starts with `requireTrustedCaller`. Actions: `seed`, `check`, `stage-cpi`, `publish-cpi` (a single database function that does the whole publish at once). Parsing goes in `_shared/cpiParse.ts` with no AI. Development drafts go into `cna_articles` as `draft`, using AI with source attribution and the same English/Greek rules as other stories. Weekly cron `0 7 * * 1` UTC with a Nicosia-time guard, so it lands at 09:00 in both winter and summer. Rules recorded in `supabase/functions/ingest-integrity/AGENTS.md`.
- Frontend: `CorruptionPerceptionsPage.tsx` (one page with three modes) and Recharts trends, with `ROUTE_META`, sitemap entries and a canonical address. The International canonical stays on the live address until the bhubnetwork.com International edition is live.
- Admin tab "Integrity data": staged preview, publish, Check now, run history with Retry, update drafts.
- Tests: seed values, ties and denominators, the dedupe key, failed check keeps public figures, survey kept out of CPI.

## Checks before handover
All three pages on desktop and phone, default languages, the switcher, exact seed numbers, source links, comparisons, running the import twice (no duplicates), a simulated failed check, and pending items visible only to editors. The report will list the live pages, schedule status and any source that still needs setting up. Sites that block automated downloads, likely the EU Publications Office or some Greek and Cypriot authority pages, get an editor upload option, as with Bank of Greece.
