ALTER TABLE public.open_data_sources
  ADD COLUMN IF NOT EXISTS max_staleness_days integer,
  ADD COLUMN IF NOT EXISTS max_period_lag_months integer,
  ADD COLUMN IF NOT EXISTS alert_state text NOT NULL DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS alert_reason text,
  ADD COLUMN IF NOT EXISTS alerted_at timestamptz;
UPDATE public.open_data_sources SET max_staleness_days = CASE WHEN check_frequency ILIKE 'weekly%' THEN 9 ELSE 35 END WHERE max_staleness_days IS NULL;
UPDATE public.open_data_sources SET max_period_lag_months = 3 WHERE max_period_lag_months IS NULL AND module IN ('trade','tourism','real_estate');