-- Evidence-based relationships and people
ALTER TABLE public.relationships
  ADD COLUMN IF NOT EXISTS role_type text,
  ADD COLUMN IF NOT EXISTS started_at date,
  ADD COLUMN IF NOT EXISTS ended_at date,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS name_el text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS directory_company_id uuid REFERENCES public.directory_companies(id) ON DELETE SET NULL;
ALTER TABLE public.cna_articles
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS entities_extracted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_cna_articles_content_hash ON public.cna_articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_cna_articles_canonical_url ON public.cna_articles(canonical_url);
ALTER TABLE public.content_sources
  ADD COLUMN IF NOT EXISTS access_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS records_imported integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_rejected integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_duplicate integer NOT NULL DEFAULT 0;

-- News to entity links
CREATE TABLE public.news_entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.cna_articles(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_label text,
  confidence numeric,
  match_method text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, entity_type, entity_id)
);
GRANT SELECT ON public.news_entity_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_entity_links TO authenticated;
GRANT ALL ON public.news_entity_links TO service_role;
ALTER TABLE public.news_entity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved links are public" ON public.news_entity_links FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins manage links" ON public.news_entity_links FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_news_entity_links_entity ON public.news_entity_links(entity_type, entity_id);

-- Company events (facts, separate from article summaries)
CREATE TABLE public.company_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_company_id uuid REFERENCES public.directory_companies(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  event_date date,
  source_url text,
  source_article_id uuid REFERENCES public.cna_articles(id) ON DELETE SET NULL,
  is_sensitive boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_events TO authenticated;
GRANT ALL ON public.company_events TO service_role;
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved events are public" ON public.company_events FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins manage events" ON public.company_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Match review queue
CREATE TABLE public.match_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  extracted_name text NOT NULL,
  candidate_type text,
  candidate_id uuid,
  candidate_label text,
  confidence numeric,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id, extracted_name, candidate_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_review_queue TO authenticated;
GRANT ALL ON public.match_review_queue TO service_role;
ALTER TABLE public.match_review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage review queue" ON public.match_review_queue FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Regulatory records split by type
CREATE TABLE public.regulatory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulator text NOT NULL DEFAULT 'CySEC',
  record_type text NOT NULL,
  entity_name text NOT NULL,
  license_number text,
  directory_company_id uuid REFERENCES public.directory_companies(id) ON DELETE SET NULL,
  title text,
  details text,
  decision_date date,
  source_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regulatory_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regulatory_records TO authenticated;
GRANT ALL ON public.regulatory_records TO service_role;
ALTER TABLE public.regulatory_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published regulatory records are public" ON public.regulatory_records FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage regulatory records" ON public.regulatory_records FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Licence status history
CREATE TABLE public.cysec_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulated_entity_id uuid NOT NULL REFERENCES public.regulated_entities(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cysec_status_history TO anon, authenticated;
GRANT ALL ON public.cysec_status_history TO service_role;
ALTER TABLE public.cysec_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Status history is public" ON public.cysec_status_history FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.log_regulated_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.cysec_status_history (regulated_entity_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_regulated_status_history AFTER UPDATE ON public.regulated_entities
FOR EACH ROW EXECUTE FUNCTION public.log_regulated_status_change();

-- Correction requests (GDPR)
CREATE TABLE public.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.people(id) ON DELETE CASCADE,
  company_id uuid,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.correction_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.correction_requests TO authenticated;
GRANT ALL ON public.correction_requests TO service_role;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a correction" ON public.correction_requests FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'open' AND length(message) BETWEEN 5 AND 3000 AND length(requester_email) <= 255);
CREATE POLICY "Admins read corrections" ON public.correction_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update corrections" ON public.correction_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));