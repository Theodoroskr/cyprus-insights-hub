# Corruption data: source health monitoring

## Current state (from the last check run today)
- Working: TI CPI page, EU Rule of Law, Greece Transparency Authority (15 items found).
- Blocked (HTTP 403): Transparency International news, GRECO, OECD Working Group on Bribery, Cyprus Audit Office.
- Broken: Cyprus anti-corruption authority — the address `acauthority.gov.cy` does not exist (DNS failure).

## What you will get
1. **Source health table** in Editorial > Open data > Corruption panel, one row per source:
   status badge (Working / Blocked / Not reachable / Timed out / No items found), last success, last attempt,
   failures in a row, items found last time, the address being checked, and a "Test now" button per source.
2. **Clear reasons in plain words**, e.g. "Site refuses automated access (403)", "Address does not exist".
3. **Blocked sources stay listed but are marked "Manual check"** with a link to open the site yourself, so nothing is silently dropped.
4. **Admin alert** (bell) only when a source changes state (working -> failing or back), not every week.
5. **Cyprus authority URL verified**: I'll test the candidate official addresses (e.g. `anticorruption.gov.cy` and its news page), keep the one that responds with real announcements, and show the result in the table. If none work, it is marked "Not reachable" and you're told.
6. Published CPI figures are never touched by any of this.

## Technical details
- Migration: `integrity_sources` table (slug, publisher, url, keywords, enabled, manual_only, last_status, last_http_code, last_error, last_success_at, last_attempt_at, consecutive_failures, last_found) with admin-only RLS + grants; seeded from the current hard-coded list in `ingest-integrity`.
- `ingest-integrity` reads sources from the table, classifies errors (403/401 -> blocked, DNS -> unreachable, abort -> timeout, 0 links -> empty), updates per-source health, inserts a notification on state change. New `action: "test", slug` tests one source and returns the classification without adding updates.
- `IntegrityPanel.tsx`: health table + per-source test + editable URL (admin) with test-before-save.
- Tests for the error classifier and state-change alert rule; update the integrity AGENTS.md.
