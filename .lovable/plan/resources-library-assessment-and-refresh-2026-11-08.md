# Resources library: assessment and refresh

## What's wrong now
- All 12 resources were added on 11 April 2026 and haven't changed since.
- Each one is only a title and a single sentence (50–90 characters). There's no real guide, glossary or report behind it, and nothing to download.
- Some make claims we can't back up: "500+ Cyprus SMEs" in the SME benchmark (no such data exists), "State of FinTech 2025" (no report written) and "Trade Report Q1 2026" (now out of date; we have live data up to August 2026).
- Several are now out of date on rules: MiCA (Cyprus transition ended July 2025), DORA (in force since January 2025), and VAT (the "MOSS" wording was replaced by OSS in 2021).

## Proposal

**1. Rewrite as real guides (6 items).** Each gets 800–1,500 words in plain English, with a "Last reviewed: Nov 2026" date and links to official sources:
- How to Register a Company in Cyprus
- Cyprus VAT Registration Guide (current thresholds, OSS)
- GDPR Checklist for SMEs
- DORA Implementation Guide (now "in force: what to check")
- MiCA Compliance Guide (after the transition period)
- EU Funding for Cyprus Startups (current programmes, with a disclaimer to check the official portals)

**2. Turn the 3 glossaries into one useful A–Z page each.** Cyprus Business & Legal, EU Regulation Acronyms (adding AMLR, AMLA, NIS2, AI Act, DAC8) and FinTech terms, with 40–80 entries each.

**3. Replace the 3 reports with live versions or hide them.**
- Trade report: becomes "Cyprus Trade Snapshot — latest month", built from the trade data we already update monthly.
- State of FinTech: rebuilt from real directory numbers (CySEC- and CBC-licensed firms by type).
- SME Digital Maturity Benchmark: unpublished, as the data doesn't exist.

**4. Keep it fresh.**
- Show a "Last reviewed" date on each resource.
- Add a reminder in the editorial dashboard to review any resource older than 6 months.
- Resources can be edited in the dashboard, the same way as the directory articles.

## Technical details
- Content goes into `resources.content` as Markdown, rendered the same way as directory articles. Add a `reviewed_at` column.
- Add a Resources tab in the editorial dashboard.
- The trade and FinTech reports query the existing tables live, so they never go stale.
- Before writing the guides, check the facts and dates with a web search.
