# Data source alerts + Trade status

## What you'll get
1. **Trade shows its real status** on the Open Data admin tab and public Official Data Sources page: last check time, OK/error, and latest month available (e.g. "Aug 2026").
2. **Admin alerts** (bell notifications for every admin, plus a red/amber badge in the Open Data admin tab) when:
   - **Missed check**: a source wasn't checked within its expected window (monthly sources: more than 35 days, weekly: 9 days).
   - **No new month**: the latest published month is older than expected (monthly statistics: more than ~3 months behind today, allowing for normal publication delay).
   - **Error**: the last check failed.
   One alert per source per problem — no repeats daily until it is fixed and then recurs.

## How it works
- The Trade importer updates its source row after every run (success or failure), like Tourism and Real Estate already do.
- A new daily check (07:00 UTC) reviews all enabled sources and creates alerts.
- Admin tab gets a "Health" column with the reason and a "Run check now" button.

## Technical details
- `ingest-cystat-trade`: on success set `status='ok'`, `last_checked_at`, `last_success_at`, `latest_period = max(trade_monthly_totals.date_month)`; on failure `status='error'`, `last_error`. Ensure a `cystat-trade` row exists (upsert by slug).
- New columns on `open_data_sources`: `max_staleness_days int`, `max_period_lag_months int` (defaults by `check_frequency`), `alert_state text`, `alert_reason text`, `alerted_at timestamptz`.
- New protected function `check-open-data-health` (`requireTrustedCaller`, cron secret): computes state, and only on state change inserts `notifications` rows (type `data_source_alert`, href `/editorial?tab=open-data`) for each admin from `user_roles`.
- pg_cron daily 07:00 UTC.
- `OpenDataSourcesPanel.tsx`: health badge, reason, "Run check now".
- Unit test for the staleness/lag rules (missed check, stale month, healthy).
- AGENTS.md rule for the alert mechanism.

Economic indicators (inflation, GDP, unemployment) stay as the next separate stage.
