
INSERT INTO public.announcement_sources (slug, name, kind, section, method, url, company_name, oam_company_id, directory_company_id, status, auto_publish, check_interval_hours, search_query, notes) VALUES
('cse-oam','Cyprus Stock Exchange — official announcements (OAM)','exchange','listed','cse_oam','https://publicoam.cse.com.cy/',NULL,NULL,NULL,'active',true,24,NULL,'Officially Appointed Mechanism for regulated information. Primary source for listed-company disclosures; read through its public JSON service.'),
('boc-ir','Bank of Cyprus Holdings — Investor Relations','issuer','listed','page','https://www.bankofcyprus.com/en-gb/group/investor-relations/announcements/announcements/','Bank of Cyprus Holdings Plc',1822,NULL,'active',false,72,NULL,'Registered in Ireland, so there is no Cyprus registry profile to link to yet.'),
('logicom-ir','Logicom — Investor Relations','issuer','listed','page','https://www.logicom.net/investors/announcements/','Logicom Public Ltd',1637,'ec2fd33c-e6e5-4f17-bc76-5336412842b0','active',false,72,NULL,NULL),
('demetra-ir','Demetra Holdings — Investor Relations','issuer','listed','page','https://www.demetra.com.cy/investor-relations','Demetra Holdings Plc',1646,'405a7e90-0872-4ecb-905b-9780922d5a5a','pending_setup',false,72,NULL,'Official site verified, but its announcements page could not be read automatically. Exchange filings are used meanwhile.'),
('eurobank-ir','Eurobank S.A. — Press office','issuer','listed','page','https://www.eurobank.gr/en/group/press-office','Eurobank S.A.',2042,NULL,'pending_setup',false,72,NULL,'Registered in Greece (no Cyprus registry profile). Issuer page returns no readable list; exchange filings are used meanwhile.'),
('asbis-ir','ASBISc Enterprises — Current reports','issuer','listed','page','https://investor.asbis.com/en/current-reports','ASBISc Enterprises Plc',1737,'aedb41fb-2755-4e7d-9a4d-594394754b2b','active',false,72,NULL,NULL),
('mhv-ir','MHV Mediterranean Hospitality Venture — Investor Relations','issuer','listed','page','https://mhvgroup.com/investor-relations/','MHV Mediterranean Hospitality Venture Plc',1934,'724a3bf7-99f2-4cd6-8d28-ce077c4ff957','active',false,72,NULL,NULL),
('cbn-companies','CBN — Companies','discovery','deals','page','https://www.cbn.com.cy/categories/companies',NULL,NULL,NULL,'active',false,24,NULL,'Discovery only: a deal is verified once a company, investor, exchange or official announcement is attached.'),
('cbn-financial','CBN — Financial Services','discovery','deals','page','https://www.cbn.com.cy/categories/financial-services',NULL,NULL,NULL,'active',false,24,NULL,'Discovery only.'),
('cbn-technology','CBN — Technology','discovery','deals','page','https://www.cbn.com.cy/categories/technology',NULL,NULL,NULL,'active',false,24,NULL,'Discovery only.'),
('invest-cyprus','Invest Cyprus — News & Events','discovery','deals','page','https://www.investcyprus.org.cy/news-and-events/',NULL,NULL,NULL,'active',false,24,NULL,'Official investment promotion agency; discovery input.'),
('tech-funding-map','Tech Funding Map — Cyprus','discovery','deals','page','https://techfundingmap.com/countries/cyprus/',NULL,NULL,NULL,'active',false,72,NULL,'Discovery only.'),
('seed-omilia','Discovery search — Omilia','discovery','deals','search','https://www.omilia.com/','Omilia',NULL,'a7e13f40-1269-435e-99a4-397be4b2463d','active',false,168,'Omilia Cyprus funding OR investment OR acquisition',NULL),
('seed-inxy','Discovery search — INXY Payments','discovery','deals','search','https://inxy.io/','INXY Payments',NULL,NULL,'active',false,168,'INXY Payments Cyprus funding OR investment OR acquisition',NULL),
('seed-studio42','Discovery search — Studio 42','discovery','deals','search','https://studio42.cy/','Studio 42',NULL,NULL,'active',false,168,'"Studio 42" Cyprus funding OR investment OR acquisition',NULL),
('seed-mika-games','Discovery search — Mika Games','discovery','deals','search','https://mikagames.com/','Mika Games',NULL,NULL,'active',false,168,'"Mika Games" Cyprus funding OR investment OR acquisition',NULL),
('seed-piney','Discovery search — Piney','discovery','deals','search','https://piney.com/','Piney',NULL,NULL,'active',false,168,'Piney Cyprus funding OR investment OR acquisition',NULL),
('manual','Manual entry (releases received by email)','discovery','deals','manual','https://businesshub.cy/',NULL,NULL,NULL,'active',false,24,NULL,'Used for releases entered by editors.')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.content_sources SET routing_profile = 'ccci' WHERE slug = 'ccci';
UPDATE public.content_sources SET routing_profile = 'oeb', scrape_path = '/en/category/latest-news/' WHERE slug = 'oeb';
UPDATE public.content_sources SET routing_profile = 'icpac', scrape_path = '/selk/en/news.aspx?year={year}', active = true WHERE slug = 'icpac';
UPDATE public.content_sources SET routing_profile = 'cybar', scrape_path = '/index.php/el/news' WHERE slug = 'cybar';
INSERT INTO public.content_sources (name, slug, url, scrape_path, category, trust_level, auto_publish, target_vertical, active, scrape_interval_hours, access_status, routing_profile)
SELECT 'CITEA — Cyprus IT Enterprises Association','citea','https://citea.cy','/en/news/','cyprus','standard',false,'fintech',true,6,'active','citea'
WHERE NOT EXISTS (SELECT 1 FROM public.content_sources WHERE slug = 'citea');
