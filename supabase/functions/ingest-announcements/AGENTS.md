# ingest-announcements
- Company Announcements: listed disclosures from the CSE OAM API (EL/EN filings grouped; auto-publish only if summarised from the filing); deals from discovery sources always wait for editor review. Duplicates via `isSameEvent` in `_shared/announcements.ts`, extra reports kept as source links. Why: one event, one page, every claim sourced.
