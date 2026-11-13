CREATE TABLE public.funding_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  issuer text NOT NULL,
  url text NOT NULL,
  method text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending_validation',
  enabled boolean NOT NULL DEFAULT false,
  default_sectors text[] NOT NULL DEFAULT '{}',
  check_interval_hours integer NOT NULL DEFAULT 24,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  items_found integer NOT NULL DEFAULT 0,
  reused_from text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_sources TO authenticated;
GRANT ALL ON public.funding_sources TO service_role;
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage funding sources" ON public.funding_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.funding_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_el text,
  issuer text,
  description text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funding_programmes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.funding_programmes TO authenticated;
GRANT ALL ON public.funding_programmes TO service_role;
ALTER TABLE public.funding_programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programmes are public reference" ON public.funding_programmes FOR SELECT USING (true);
CREATE POLICY "Admins manage programmes" ON public.funding_programmes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.funding_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  dedupe_key text NOT NULL UNIQUE,
  source_id uuid REFERENCES public.funding_sources(id) ON DELETE SET NULL,
  programme_id uuid REFERENCES public.funding_programmes(id) ON DELETE SET NULL,
  origin text NOT NULL DEFAULT 'import',
  status text NOT NULL DEFAULT 'review',
  issuer text NOT NULL,
  programme text,
  call_reference text,
  round text,
  title_en text NOT NULL,
  title_el text,
  summary_en text,
  summary_el text,
  eligibility_summary text,
  instrument_type text NOT NULL DEFAULT 'grant',
  sectors text[] NOT NULL DEFAULT '{}',
  applicant_types text[] NOT NULL DEFAULT '{}',
  geography text NOT NULL DEFAULT 'cyprus',
  eligible_costs text,
  cofunding_rate text,
  max_award_eur numeric,
  total_budget_eur numeric,
  opening_date date,
  deadline_date date,
  deadline_time text,
  deadline_note text,
  call_state text NOT NULL DEFAULT 'open',
  consortium_requirements text,
  application_url text,
  official_url text NOT NULL,
  documents jsonb NOT NULL DEFAULT '[]',
  is_preview boolean NOT NULL DEFAULT false,
  editor_locked_fields text[] NOT NULL DEFAULT '{}',
  ineligible_reason text,
  last_verified_at timestamptz,
  verified_by uuid,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX funding_calls_status_idx ON public.funding_calls(status, call_state, deadline_date);
CREATE INDEX funding_calls_sectors_idx ON public.funding_calls USING gin(sectors);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_calls TO authenticated;
GRANT ALL ON public.funding_calls TO service_role;
ALTER TABLE public.funding_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read verified calls" ON public.funding_calls FOR SELECT TO authenticated
  USING (status = 'verified' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage calls" ON public.funding_calls FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.funding_call_prepare()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE base text;
BEGIN
  IF NEW.status NOT IN ('review','verified','rejected','ineligible','merged') THEN RAISE EXCEPTION 'Invalid status: %', NEW.status; END IF;
  IF NEW.call_state NOT IN ('upcoming','open','ongoing','closed') THEN RAISE EXCEPTION 'Invalid call state: %', NEW.call_state; END IF;
  IF NEW.instrument_type NOT IN ('grant','subsidy','voucher','loan','guarantee','equity','prize','tax_incentive','other') THEN RAISE EXCEPTION 'Invalid instrument: %', NEW.instrument_type; END IF;
  IF NEW.geography NOT IN ('cyprus','eu','cross_border','international') THEN RAISE EXCEPTION 'Invalid geography: %', NEW.geography; END IF;
  IF NEW.origin NOT IN ('import','discovery','manual') THEN RAISE EXCEPTION 'Invalid origin'; END IF;
  IF NEW.status <> 'verified' THEN NEW.is_preview := false; END IF;
  IF NEW.status = 'verified' AND NEW.last_verified_at IS NULL THEN NEW.last_verified_at := now(); END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(coalesce(NEW.call_reference, '') || ' ' || NEW.title_en);
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := left(regexp_replace(base, '^-+|-+$', '', 'g'), 90);
    NEW.slug := base || '-' || left(replace(NEW.id::text,'-',''), 6);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER funding_calls_prepare BEFORE INSERT OR UPDATE ON public.funding_calls
  FOR EACH ROW EXECUTE FUNCTION public.funding_call_prepare();
CREATE TRIGGER funding_sources_updated BEFORE UPDATE ON public.funding_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.funding_call_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.funding_calls(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.funding_sources(id) ON DELETE SET NULL,
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'listing',
  language text NOT NULL DEFAULT 'en',
  title text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_id, url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_call_sources TO authenticated;
GRANT ALL ON public.funding_call_sources TO service_role;
ALTER TABLE public.funding_call_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read sources of verified calls" ON public.funding_call_sources FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.funding_calls c WHERE c.id = call_id AND (c.status = 'verified' OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins manage call sources" ON public.funding_call_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.funding_call_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.funding_calls(id) ON DELETE CASCADE,
  change_kind text NOT NULL DEFAULT 'correction',
  field text,
  old_value text,
  new_value text,
  source_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_call_changes TO authenticated;
GRANT ALL ON public.funding_call_changes TO service_role;
ALTER TABLE public.funding_call_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage call changes" ON public.funding_call_changes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.article_funding_links (
  article_id uuid NOT NULL REFERENCES public.cna_articles(id) ON DELETE CASCADE,
  call_id uuid NOT NULL REFERENCES public.funding_calls(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, call_id)
);
GRANT SELECT ON public.article_funding_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.article_funding_links TO authenticated;
GRANT ALL ON public.article_funding_links TO service_role;
ALTER TABLE public.article_funding_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story links are public ids" ON public.article_funding_links FOR SELECT USING (true);
CREATE POLICY "Admins manage story links" ON public.article_funding_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_funding_preview()
RETURNS TABLE(slug text, title_en text, title_el text, issuer text, eligibility_summary text, instrument_type text, sectors text[], deadline_date date, deadline_time text, application_url text, official_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH pool AS (
    SELECT c.*, (CASE WHEN c.is_preview THEN 0 ELSE 1 END) AS pick
    FROM public.funding_calls c
    WHERE c.status = 'verified' AND c.call_state IN ('open','ongoing')
      AND (c.deadline_date IS NULL OR c.deadline_date >= current_date)
  )
  SELECT p.slug, p.title_en, p.title_el, p.issuer, p.eligibility_summary, p.instrument_type, p.sectors,
         p.deadline_date, p.deadline_time, p.application_url, p.official_url
  FROM pool p
  ORDER BY p.pick, p.deadline_date NULLS LAST, p.title_en
  LIMIT 3
$$;
GRANT EXECUTE ON FUNCTION public.get_funding_preview() TO anon, authenticated;