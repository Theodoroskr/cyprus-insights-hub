INSERT INTO public.content_sources (name, slug, url, scrape_path, category, target_vertical, trust_level, active, auto_publish, scrape_interval_hours)
VALUES
  ('ENISA', 'enisa', 'https://www.enisa.europa.eu', '/news', 'eu_agency', 'regtech', 'official', true, false, 24),
  ('DSA Cyprus', 'dsa-cyprus', 'https://www.dsa.cy', '/en/news', 'government', 'regtech', 'official', true, false, 24),
  ('Mastercard Newsroom', 'mastercard-newsroom', 'https://www.mastercard.com', '/news/press/press-releases', 'industry', 'regtech', 'trusted', true, false, 48),
  ('Recorded Future Blog', 'recorded-future', 'https://www.recordedfuture.com', '/blog', 'industry', 'regtech', 'trusted', true, false, 48)
ON CONFLICT DO NOTHING;