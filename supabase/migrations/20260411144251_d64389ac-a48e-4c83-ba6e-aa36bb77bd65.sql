
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule scrape-sources to run every 6 hours
SELECT cron.schedule(
  'scrape-sources-every-6h',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://oralbierakmfxcqncjnz.supabase.co/functions/v1/scrape-sources',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYWxiaWVyYWttZnhjcW5jam56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODU0NzQsImV4cCI6MjA5MTQ2MTQ3NH0.yQo--8oqA-UoQccYy2E4LpWbG76oE2a7OZjPykLSLiM"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
