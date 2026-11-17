UPDATE public.content_sources SET url = 'https://www.nbg.gr', scrape_path = '/en/group/press-office', access_status = 'active', active = true, ingestion_status = 'active', scrape_interval_hours = 6,
  source_notes = 'Official NBG press office listing (verified 2026-11-17)' WHERE slug = 'gr-nbg-press';
UPDATE public.content_sources SET url = 'https://www.alpha.gr', scrape_path = '/en/group/media-centre/press-releases', access_status = 'active', active = true, ingestion_status = 'active', scrape_interval_hours = 6,
  source_notes = 'Official Alpha Bank press releases and corporate announcements (PDF items, verified 2026-11-17)' WHERE slug = 'gr-alpha-press';

INSERT INTO public.content_sources (slug, name, publisher, url, scrape_path, country, markets, category, source_type, priority, target_section, target_vertical, trust_level, access_status, active, auto_publish, ingestion_status, scrape_interval_hours, source_notes)
SELECT 'gr-eurobank-press', 'Eurobank Press Office', 'Eurobank', 'https://www.eurobank.gr', '/en/group/grafeio-tupou', 'GR', ARRAY['GR','CY'], 'bank', 'press_office', 'P1', 'banking', 'fintech', 'standard', 'active', true, false, 'active', 6,
  'Official Eurobank press releases and corporate announcements (verified 2026-11-17)'
WHERE NOT EXISTS (SELECT 1 FROM public.content_sources WHERE slug = 'gr-eurobank-press');

INSERT INTO public.content_sources (slug, name, publisher, url, scrape_path, country, markets, category, source_type, priority, target_section, target_vertical, trust_level, access_status, active, auto_publish, ingestion_status, scrape_interval_hours, source_notes)
SELECT 'gr-athex-announcements', 'Euronext Athens — Listed Company Announcements', 'Euronext Athens', 'https://athens.euronext.com', '/en/more-options/announcements-companies', 'GR', ARRAY['GR'], 'exchange', 'exchange', 'P1', 'announcements', 'general', 'standard', 'active', true, false, 'active', 3,
  'Official issuer announcements on the Athens exchange (formerly athexgroup.gr; verified 2026-11-17)'
WHERE NOT EXISTS (SELECT 1 FROM public.content_sources WHERE slug = 'gr-athex-announcements');