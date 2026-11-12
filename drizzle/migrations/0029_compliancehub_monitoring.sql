-- ComplianceHub: official source registry, regulatory records, references, change history, FATF releases
CREATE TABLE public.compliance_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  authority text NOT NULL,
  jurisdiction text NOT NULL DEFAULT 'CY',
  homepage_url text NOT NULL,
  collection_method text NOT NULL DEFAULT 'html',
  endpoint_urls text[] NOT NULL DEFAULT '{}',
  sections text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending_validation',
  check_interval_hours integer NOT NULL DEFAULT 24,
  manual_reason text,
  notes text,
  news_source_slug text,
  validated_at timestamptz,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_items_found integer,
  last_new_items integer,
  last_changed_items integer,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_sources TO authenticated;
GRANT ALL ON public.compliance_sources TO service_role;
ALTER TABLE public.compliance_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage compliance sources" ON public.compliance_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  status text NOT NULL DEFAULT 'review',
  sections text[] NOT NULL DEFAULT '{updates}',
  authority text NOT NULL,
  jurisdiction text NOT NULL DEFAULT 'CY',
  official_id text,
  canonical_url text NOT NULL,
  document_type text NOT NULL DEFAULT 'announcement',
  official_title text NOT NULL,
  title_en text,
  title_el text,
  summary_en text,
  summary_el text,
  what_changed_en text,
  what_changed_el text,
  action_en text,
  action_el text,
  source_language text NOT NULL DEFAULT 'en',
  topics text[] NOT NULL DEFAULT '{}',
  sectors text[] NOT NULL DEFAULT '{}',
  publication_date date,
  application_date date,
  effective_date date,
  deadline_date date,
  deadline_type text,
  deadline_note text,
  legal_act_ref text,
  regime text,
  measure_type text,
  countries text[] NOT NULL DEFAULT '{}',
  audience text,
  related_acts text[] NOT NULL DEFAULT '{}',
  content_hash text,
  last_seen_at timestamptz,
  change_pending boolean NOT NULL DEFAULT false,
  change_note text,
  ai_suggestions jsonb,
  routing_note text,
  source_id uuid REFERENCES public.compliance_sources(id) ON DELETE SET NULL,
  merged_into uuid REFERENCES public.compliance_items(id) ON DELETE SET NULL,
  is_test boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX compliance_items_official_uidx ON public.compliance_items (authority, official_id) WHERE official_id IS NOT NULL;
CREATE UNIQUE INDEX compliance_items_canonical_uidx ON public.compliance_items (canonical_url);
CREATE INDEX compliance_items_public_idx ON public.compliance_items (status, publication_date DESC);
CREATE INDEX compliance_items_sections_idx ON public.compliance_items USING gin (sections);
GRANT SELECT ON public.compliance_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_items TO authenticated;
GRANT ALL ON public.compliance_items TO service_role;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published compliance items are public" ON public.compliance_items FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_test = false);
CREATE POLICY "Admins manage compliance items" ON public.compliance_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.compliance_item_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.compliance_items(id) ON DELETE CASCADE,
  authority text NOT NULL,
  official_id text,
  url text NOT NULL UNIQUE,
  title text,
  language text NOT NULL DEFAULT 'en',
  published_at date,
  role text NOT NULL DEFAULT 'primary',
  source_id uuid REFERENCES public.compliance_sources(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX compliance_item_refs_item_idx ON public.compliance_item_refs (item_id);
GRANT SELECT ON public.compliance_item_refs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_item_refs TO authenticated;
GRANT ALL ON public.compliance_item_refs TO service_role;
ALTER TABLE public.compliance_item_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "References of published items are public" ON public.compliance_item_refs FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.compliance_items i WHERE i.id = item_id AND i.status = 'published' AND i.is_test = false));
CREATE POLICY "Admins manage compliance references" ON public.compliance_item_refs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.compliance_item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.compliance_items(id) ON DELETE CASCADE,
  change_kind text NOT NULL,
  field text,
  old_value text,
  new_value text,
  details jsonb,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX compliance_item_history_item_idx ON public.compliance_item_history (item_id, changed_at DESC);
GRANT SELECT, INSERT ON public.compliance_item_history TO authenticated;
GRANT ALL ON public.compliance_item_history TO service_role;
ALTER TABLE public.compliance_item_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read compliance history" ON public.compliance_item_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add compliance history" ON public.compliance_item_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.fatf_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_date date NOT NULL UNIQUE,
  label text NOT NULL,
  call_for_action_url text,
  increased_monitoring_url text,
  status text NOT NULL DEFAULT 'review',
  content_hash text,
  stated_removals text[] NOT NULL DEFAULT '{}',
  notes text,
  fetched_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fatf_releases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatf_releases TO authenticated;
GRANT ALL ON public.fatf_releases TO service_role;
ALTER TABLE public.fatf_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published FATF releases are public" ON public.fatf_releases FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins manage FATF releases" ON public.fatf_releases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.fatf_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.fatf_releases(id) ON DELETE CASCADE,
  country_name text NOT NULL,
  country_code text,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (release_id, country_name)
);
GRANT SELECT ON public.fatf_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatf_listings TO authenticated;
GRANT ALL ON public.fatf_listings TO service_role;
ALTER TABLE public.fatf_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings of published FATF releases are public" ON public.fatf_listings FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.fatf_releases r WHERE r.id = release_id AND r.status = 'published'));
CREATE POLICY "Admins manage FATF listings" ON public.fatf_listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Validation + slug + publish timestamp
CREATE OR REPLACE FUNCTION public.compliance_item_prepare()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE base text;
BEGIN
  IF NEW.status NOT IN ('review','published','rejected','merged') THEN RAISE EXCEPTION 'Invalid status: %', NEW.status; END IF;
  IF NOT (NEW.sections <@ ARRAY['updates','eu_sanctions','cy_sanctions','deadlines']::text[]) THEN RAISE EXCEPTION 'Invalid section'; END IF;
  IF NEW.document_type NOT IN ('consultation','draft_standard','adopted_legislation','circular','guidance','announcement','decision','report','notice','corrigendum') THEN
    RAISE EXCEPTION 'Invalid document type: %', NEW.document_type; END IF;
  IF NOT (NEW.topics <@ ARRAY['aml_cft','sanctions','mica','dora','licensing','regulatory_reporting','payments','prudential','markets','governance','consumer_protection','other']::text[]) THEN RAISE EXCEPTION 'Invalid topic'; END IF;
  IF NEW.deadline_type IS NOT NULL AND NEW.deadline_type NOT IN ('consultation_close','filing','application','effective','other') THEN RAISE EXCEPTION 'Invalid deadline type'; END IF;
  IF NEW.measure_type IS NOT NULL AND NEW.measure_type NOT IN ('new_regime','listings','delistings','amendment','extension','sectoral','implementing','exemption','corrigendum','guidance','other') THEN RAISE EXCEPTION 'Invalid measure type'; END IF;
  IF NEW.jurisdiction NOT IN ('CY','EU','INT') THEN RAISE EXCEPTION 'Invalid jurisdiction'; END IF;
  IF NEW.source_language NOT IN ('en','el') THEN RAISE EXCEPTION 'Invalid language'; END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(coalesce(NEW.authority,'') || ' ' || coalesce(NEW.title_en, NEW.official_title, ''));
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := left(regexp_replace(base, '^-+|-+$', '', 'g'), 90);
    NEW.slug := base || '-' || left(replace(NEW.id::text,'-',''), 6);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER compliance_items_prepare BEFORE INSERT OR UPDATE ON public.compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.compliance_item_prepare();

-- Keep every previous date in the admin history
CREATE OR REPLACE FUNCTION public.compliance_item_log_dates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.deadline_date IS DISTINCT FROM OLD.deadline_date THEN
    INSERT INTO public.compliance_item_history(item_id, change_kind, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'date', 'deadline_date', OLD.deadline_date::text, NEW.deadline_date::text, auth.uid());
  END IF;
  IF NEW.application_date IS DISTINCT FROM OLD.application_date THEN
    INSERT INTO public.compliance_item_history(item_id, change_kind, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'date', 'application_date', OLD.application_date::text, NEW.application_date::text, auth.uid());
  END IF;
  IF NEW.effective_date IS DISTINCT FROM OLD.effective_date THEN
    INSERT INTO public.compliance_item_history(item_id, change_kind, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'date', 'effective_date', OLD.effective_date::text, NEW.effective_date::text, auth.uid());
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.compliance_item_history(item_id, change_kind, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', 'status', OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER compliance_items_log_dates AFTER UPDATE ON public.compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.compliance_item_log_dates();

CREATE OR REPLACE FUNCTION public.compliance_simple_prepare()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_TABLE_NAME = 'compliance_sources' THEN
    IF NEW.status NOT IN ('active','pending_validation','manual','disabled') THEN RAISE EXCEPTION 'Invalid source status'; END IF;
    IF NEW.collection_method NOT IN ('rss','api','html','crawler','manual') THEN RAISE EXCEPTION 'Invalid collection method'; END IF;
    IF NEW.check_interval_hours < 1 THEN RAISE EXCEPTION 'Interval must be at least 1 hour'; END IF;
  ELSIF TG_TABLE_NAME = 'fatf_releases' THEN
    IF NEW.status NOT IN ('review','published','rejected') THEN RAISE EXCEPTION 'Invalid release status'; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER compliance_sources_prepare BEFORE INSERT OR UPDATE ON public.compliance_sources FOR EACH ROW EXECUTE FUNCTION public.compliance_simple_prepare();
CREATE TRIGGER fatf_releases_prepare BEFORE INSERT OR UPDATE ON public.fatf_releases FOR EACH ROW EXECUTE FUNCTION public.compliance_simple_prepare();

CREATE OR REPLACE FUNCTION public.validate_fatf_listing()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.category NOT IN ('countermeasures','enhanced_due_diligence','increased_monitoring') THEN RAISE EXCEPTION 'Invalid FATF category'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fatf_listings_validate BEFORE INSERT OR UPDATE ON public.fatf_listings FOR EACH ROW EXECUTE FUNCTION public.validate_fatf_listing();

-- Editors link two records about the same matter: references move to the kept item
CREATE OR REPLACE FUNCTION public.merge_compliance_items(_dup uuid, _keep uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _dup = _keep THEN RAISE EXCEPTION 'Same item'; END IF;
  SELECT * INTO d FROM compliance_items WHERE id = _dup;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Item not found'; END IF;
  UPDATE compliance_item_refs SET item_id = _keep, role = 'related' WHERE item_id = _dup;
  UPDATE compliance_items k SET
    sections = (SELECT array_agg(DISTINCT s) FROM unnest(k.sections || d.sections) s),
    topics = (SELECT coalesce(array_agg(DISTINCT s), '{}') FROM unnest(k.topics || d.topics) s),
    sectors = (SELECT coalesce(array_agg(DISTINCT s), '{}') FROM unnest(k.sectors || d.sectors) s),
    related_acts = (SELECT coalesce(array_agg(DISTINCT s), '{}') FROM unnest(k.related_acts || d.related_acts) s)
  WHERE k.id = _keep;
  UPDATE compliance_items SET status = 'merged', merged_into = _keep WHERE id = _dup;
  INSERT INTO compliance_item_history(item_id, change_kind, details, changed_by)
  VALUES (_keep, 'merge', jsonb_build_object('merged_item', _dup, 'title', d.official_title, 'url', d.canonical_url), auth.uid());
END $$;
REVOKE EXECUTE ON FUNCTION public.merge_compliance_items(uuid, uuid) FROM anon;

-- First-release source registry
INSERT INTO public.compliance_sources (slug, name, authority, jurisdiction, homepage_url, collection_method, endpoint_urls, sections, status, validated_at, news_source_slug, notes, manual_reason) VALUES
('cysec-circulars','CySEC circulars (incl. AML/CFT)','CySEC','CY','https://www.cysec.gov.cy/en-GB/public-info/circulars/','html',
  ARRAY['https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/aml-cft/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/Circulars-DORA/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/casp-circulars/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/issuers-of-art-under-micar-circulars/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/investment-firms/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/aif/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/ucits/','https://www.cysec.gov.cy/en-GB/public-info/circulars/supervised/service-providers/','https://www.cysec.gov.cy/en-GB/public-info/circulars/general/'],
  ARRAY['updates','deadlines'],'active',now(),'cysec','No RSS or API. Official listing pages per supervised-entity category are read directly; the category sets the affected sector.',NULL),
('cbc-announcements','Central Bank of Cyprus announcements','Central Bank of Cyprus','CY','https://www.centralbank.cy/en/announcements/','html',
  ARRAY['https://www.centralbank.cy/en/announcements/'],ARRAY['updates'],'active',now(),'cbc-announcements','No RSS. Listing read directly; only supervisory/regulatory announcements are kept (statistics, speeches and events are skipped).',NULL),
('nsiu','National Sanctions Implementation Unit (NSIU)','NSIU','CY','https://www.gov.cy/nsiu/en/','api',
  ARRAY['https://www.gov.cy/nsiu/en/wp-json/wp/v2/posts','https://www.gov.cy/nsiu/en/wp-json/wp/v2/document'],ARRAY['cy_sanctions'],'active',now(),NULL,'Official WordPress REST API (news posts and guidance documents); the modified date detects revisions. RSS also available at /nsiu/en/feed/.',NULL),
('eurlex-oj','EUR-Lex — Official Journal L series','EUR-Lex','EU','https://eur-lex.europa.eu/','rss',
  ARRAY['https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222'],ARRAY['updates','eu_sanctions'],'active',now(),'eur-lex','Official RSS of acts in the L series. Restrictive measures go to EU Sanctions; AML/CFT, MiCA, DORA and financial-services acts go to Regulatory Updates.',NULL),
('amla-news','AMLA news','AMLA','EU','https://www.amla.europa.eu/index_en','rss',
  ARRAY['https://www.amla.europa.eu/node/19/rss_en'],ARRAY['updates'],'active',now(),'amla','Official RSS. Speeches, meetings and interviews are skipped.',NULL),
('amla-consultations','AMLA public consultations','AMLA','EU','https://www.amla.europa.eu/policy/public-consultations_en','html',
  ARRAY['https://www.amla.europa.eu/policy/public-consultations_en'],ARRAY['updates','deadlines'],'active',now(),NULL,'Official consultations list; opening date and deadline are read from the page''s structured date fields.',NULL),
('ec-sanctions-resources','European Commission — sanctions resources','European Commission','EU','https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en','html',
  ARRAY['https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en'],ARRAY['eu_sanctions'],'active',now(),NULL,'Checks that the EU Sanctions Map and consolidated financial sanctions list links are still published on the official resources page.',NULL),
('fatf-lists','FATF high-risk and monitored jurisdictions','FATF','INT','https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions.html','crawler',
  ARRAY['https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions.html'],ARRAY['fatf'],'active',now(),'fatf','The FATF site refuses direct requests, so the existing crawler reads it. Each release is saved for editor verification before it is shown.',NULL),
('icpac','ICPAC','ICPAC','CY','https://www.icpac.org.cy/','manual',ARRAY[]::text[],ARRAY['updates'],'manual',NULL,'icpac',NULL,'The ICPAC site blocks automated reading of its announcements; enter items manually with the official URL.'),
('cybar','Cyprus Bar Association','Cyprus Bar Association','CY','https://www.cyprusbarassociation.org/','crawler',ARRAY['https://www.cyprusbarassociation.org/index.php/el/news'],ARRAY['updates'],'pending_validation',NULL,'cybar','Configured for expanded coverage; validate before enabling.',NULL),
('mokas','MOKAS (Cyprus FIU)','MOKAS','CY','https://www.law.gov.cy/law/mokas/mokas.nsf/index_en/index_en','crawler',ARRAY['https://www.law.gov.cy/law/mokas/mokas.nsf/index_en/index_en?OpenDocument'],ARRAY['updates'],'pending_validation',NULL,'mokas','Configured for expanded coverage; validate before enabling.',NULL),
('moneyval-cyprus','MONEYVAL — Cyprus','MONEYVAL','INT','https://www.coe.int/en/web/moneyval/jurisdictions/cyprus','crawler',ARRAY['https://www.coe.int/en/web/moneyval/jurisdictions/cyprus'],ARRAY['updates'],'pending_validation',NULL,NULL,'Configured for expanded coverage; validate before enabling.',NULL),
('nba','National Betting Authority','National Betting Authority','CY','https://www.nba.gov.cy/','crawler',ARRAY['https://www.nba.gov.cy/'],ARRAY['updates'],'pending_validation',NULL,NULL,'Configured for expanded coverage; validate before enabling.',NULL);