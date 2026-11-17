
ALTER TABLE public.cna_articles ADD COLUMN IF NOT EXISTS edition text[] NOT NULL DEFAULT '{cy}',
  ADD COLUMN IF NOT EXISTS title_el text, ADD COLUMN IF NOT EXISTS summary_el text, ADD COLUMN IF NOT EXISTS body_el text,
  ADD COLUMN IF NOT EXISTS gr_section text, ADD COLUMN IF NOT EXISTS cross_border_note text, ADD COLUMN IF NOT EXISTS organisation_slug text;
ALTER TABLE public.company_announcements ADD COLUMN IF NOT EXISTS edition text[] NOT NULL DEFAULT '{cy}';
ALTER TABLE public.funding_calls ADD COLUMN IF NOT EXISTS edition text[] NOT NULL DEFAULT '{cy}';
CREATE INDEX IF NOT EXISTS cna_articles_edition_gin ON public.cna_articles USING gin(edition);
CREATE INDEX IF NOT EXISTS company_announcements_edition_gin ON public.company_announcements USING gin(edition);
CREATE INDEX IF NOT EXISTS funding_calls_edition_gin ON public.funding_calls USING gin(edition);

ALTER TABLE public.content_sources ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'CY',
  ADD COLUMN IF NOT EXISTS markets text[] NOT NULL DEFAULT '{CY}',
  ADD COLUMN IF NOT EXISTS priority text, ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS source_type text, ADD COLUMN IF NOT EXISTS ingestion_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_notes text;

CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, country text NOT NULL DEFAULT 'GR',
  name_en text NOT NULL, name_el text, kind text NOT NULL DEFAULT 'bank',
  description_en text, description_el text,
  official_links jsonb NOT NULL DEFAULT '[]', directory_company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organisations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read organisations" ON public.organisations FOR SELECT USING (true);
CREATE POLICY "Admins manage organisations" ON public.organisations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.organisations (slug,name_en,name_el,description_en,description_el,official_links) VALUES
('national-bank-of-greece','National Bank of Greece','Εθνική Τράπεζα της Ελλάδος','Greek systemic bank.','Συστημική τράπεζα της Ελλάδας.','[{"label":"Press Office","url":"https://www.nbg.gr/en/group/press-office"},{"label":"Investor Relations","url":"https://www.nbg.gr/en/group/investor-relations"}]'),
('eurobank','Eurobank','Eurobank','Greek systemic bank with operations in Cyprus.','Συστημική τράπεζα με δραστηριότητα στην Κύπρο.','[{"label":"Investor Relations","url":"https://www.eurobank.gr/en/group/investor-relations"}]'),
('alpha-bank','Alpha Bank','Alpha Bank','Greek systemic bank.','Συστημική τράπεζα της Ελλάδας.','[{"label":"Press Releases","url":"https://www.alpha.gr/en/Group/media-centre/Press-Releases"}]'),
('piraeus-bank','Piraeus Bank','Τράπεζα Πειραιώς','Greek systemic bank.','Συστημική τράπεζα της Ελλάδας.','[{"label":"Website","url":"https://www.piraeusbank.gr/"},{"label":"Financial results archive","url":"https://www.piraeusholdings.gr/en/investor-relations/financial-results"}]');

INSERT INTO public.content_sources (name,slug,url,category,scrape_path,target_vertical,target_section,access_status,active,auto_publish,country,markets,priority,publisher,source_type,ingestion_status,source_notes) VALUES
('NBG Press Office','gr-nbg-press','https://www.nbg.gr/en/group/press-office','bank','/en/group/press-office','fintech','banking','pending',false,false,'GR','{GR}','P1','National Bank of Greece','press_office','registered','Bank announcements, partnerships, digital services, SME programmes'),
('NBG Investor Relations','gr-nbg-ir','https://www.nbg.gr/en/group/investor-relations','bank','/en/group/investor-relations','fintech','banking','pending',false,false,'GR','{GR}','P1','National Bank of Greece','investor_relations','registered','Earnings, annual reports, disclosures'),
('Eurobank Investor Relations','gr-eurobank-ir','https://www.eurobank.gr/en/group/investor-relations','bank','/en/group/investor-relations','fintech','banking','pending',false,false,'GR','{GR,CY}','P1','Eurobank','investor_relations','registered','Results, dividends; capture Cyprus figures separately'),
('Alpha Bank Press Releases','gr-alpha-press','https://www.alpha.gr/en/Group/media-centre/Press-Releases','bank','/en/Group/media-centre/Press-Releases','fintech','banking','pending',false,false,'GR','{GR,CY}','P1','Alpha Bank','press_office','registered','Resolve final announcements URL'),
('Piraeus Bank','gr-piraeus','https://www.piraeusbank.gr/','bank','/','fintech','banking','pending',false,false,'GR','{GR}','P1','Piraeus Bank','investor_relations','manual','Locate current IR/announcements pages; archive at piraeusholdings.gr'),
('Athens Exchange','gr-athex','https://www.athexgroup.gr/','exchange','/','general','announcements','pending',false,false,'GR','{GR}','P1','Athens Exchange','exchange','manual','Locate issuer announcement pages; verify issuer and ticker'),
('Bank of Greece — Monetary & Banking Statistics','gr-bog-stats','https://www.bankofgreece.gr/en/statistics/monetary-and-banking-statistics/','data','/en/statistics/monetary-and-banking-statistics/','general','indicators','pending',false,false,'GR','{GR}','P1','Bank of Greece','statistics','manual','Lending, deposits, rates'),
('Bank of Greece — Open Data','gr-bog-opendata','https://opendata.bankofgreece.gr/en/about','data','/en/about','general','indicators','pending',false,false,'GR','{GR}','P1','Bank of Greece','api','manual','Verify XML API endpoints'),
('Bank of Greece — FinTech Innovation Hub','gr-bog-fintech','https://www.bankofgreece.gr/en/main-tasks/supervision/fintech-innovation-hub','regulator','/','regtech','fintech','pending',false,false,'GR','{GR}','P1','Bank of Greece','reference','manual','Regulatory reference'),
('Hellenic Capital Market Commission','gr-hcmc','https://www.hcmc.gr/','regulator','/','compliance','fintech','pending',false,false,'GR','{GR}','P1','HCMC','regulator','registered','Announcements and investor warnings'),
('Hellenic Bank Association','gr-hba','https://old.hba.gr/','association','/','fintech','banking','pending',false,false,'GR','{GR}','P1','Hellenic Bank Association','association','manual','Verify current announcements page'),
('DIAS','gr-dias','https://www.dias.com.gr/en/','payments','/en/','fintech','banking','pending',false,false,'GR','{GR}','P1','DIAS','payments_infrastructure','registered','IRIS, instant payments'),
('Greek Open Data Portal','gr-datagovgr','https://data.gov.gr/','data','/','general','indicators','pending',false,false,'GR','{GR}','P1','data.gov.gr','portal','manual','Dataset discovery; legacy old.data.gov.gr'),
('ELSTAT release calendar','gr-elstat','https://www.statistics.gr/en/exp-cal','data','/en/exp-cal','general','indicators','pending',false,false,'GR','{GR}','P1','ELSTAT','statistics','manual','GDP, inflation, unemployment, trade'),
('ΕΣΗΔΗΣ / ΚΗΜΔΗΣ procurement','gr-eprocurement','https://portal.eprocurement.gov.gr/','tenders','/','general','funding','pending',false,false,'GR','{GR}','P1','General Secretariat of Commerce','procurement','manual','Tech, digital government, consulting tenders'),
('ΕΣΠΑ call planning','gr-espa','https://espa.gr/el/Pages/ProclamationsProgramming.aspx','funding','/el/Pages/ProclamationsProgramming.aspx','sme','funding','pending',false,false,'GR','{GR}','P1','ΕΣΠΑ','funding','registered','Publish links only when call opens'),
('GSRI calls for proposals','gr-gsri','https://gsri.gov.gr/en/calls-for-proposals/','funding','/en/calls-for-proposals/','sme','funding','pending',false,false,'GR','{GR,CY}','P1','GSRI','funding','registered','R&D and bilateral programmes'),
('Hellenic Development Bank','gr-hdb','https://hdb.gr/','funding','/','sme','funding','pending',false,false,'GR','{GR}','P1','Hellenic Development Bank','funding','registered','SME financing, guarantees'),
('ΓΕΜΗ public search','gr-gemi','https://publicity.businessportal.gr/','registry','/','general','business','pending',false,false,'GR','{GR}','P2','ΓΕΜΗ','registry','manual','Manual lookup only'),
('Enterprise Greece','gr-enterprise-greece','https://www.enterprisegreece.gov.gr/','trade','/','general','greece-cyprus','pending',false,false,'GR','{GR,CY}','P2','Enterprise Greece','agency','registered','Investments, exports, trade missions'),
('Athens Chamber (ΕΒΕΑ)','gr-acci','https://www.acci.gr/','chamber','/','general','greece-cyprus','pending',false,false,'GR','{GR,CY}','P2','ΕΒΕΑ','chamber','registered','Delegations, Greece–Cyprus activity'),
('Central Union of Chambers','gr-uhc','https://www.uhc.gr/','chamber','/','general','business','pending',false,false,'GR','{GR}','P2','ΚΕΕΕ','chamber','registered','Regional chamber initiatives'),
('ΣΕΒ','gr-sev','https://www.sev.org.gr/','association','/','general','business','pending',false,false,'GR','{GR}','P2','ΣΕΒ','association','registered','Industry policy'),
('ΣΕΠΕ','gr-sepe','https://www.sepe.gr/press/','association','/press/','fintech','fintech','pending',false,false,'GR','{GR}','P2','ΣΕΠΕ','association','registered','Technology sector'),
('Elevate Greece announcements','gr-elevate','https://elevategreece.gov.gr/announcements/','startups','/announcements/','fintech','business','pending',false,false,'GR','{GR}','P2','Elevate Greece','agency','registered','Confirm rounds before publication; startup DB /the-startup-database/'),
('National Cybersecurity Authority','gr-cyber','https://cyber.gov.gr/category/anakoinoseis/','regulator','/category/anakoinoseis/','compliance','fintech','pending',false,false,'GR','{GR}','P2','National Cybersecurity Authority','regulator','registered','For ComplianceHub'),
('ΣΕΤΕ','gr-sete','https://sete.gr/','tourism','/','tourism','business','pending',false,false,'GR','{GR}','P2','ΣΕΤΕ','association','registered','For TourismHub'),
('ΙΝΣΕΤΕ','gr-insete','https://insete.gr/','tourism','/','tourism','indicators','pending',false,false,'GR','{GR}','P2','ΙΝΣΕΤΕ','statistics','registered','Tourism statistics')
ON CONFLICT (slug) DO NOTHING;
