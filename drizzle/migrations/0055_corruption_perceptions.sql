CREATE TABLE public.cpi_editions (
  edition_year int PRIMARY KEY,
  release_date date,
  countries_covered int,
  global_avg numeric,
  eu_avg numeric,
  below_50 int,
  source_url text NOT NULL DEFAULT 'https://www.transparency.org/en/cpi/2025',
  status text NOT NULL DEFAULT 'staged',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cpi_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_iso3 text NOT NULL,
  country_name text NOT NULL,
  country_name_el text,
  region text,
  edition_year int NOT NULL,
  score numeric,
  rank int,
  rank_tied boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'staged',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_iso3, edition_year, status)
);
CREATE TABLE public.cpi_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_year int NOT NULL,
  scope text NOT NULL,
  value numeric,
  source_url text,
  status text NOT NULL DEFAULT 'staged',
  UNIQUE (edition_year, scope, status)
);
CREATE TABLE public.integrity_survey_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey text NOT NULL,
  survey_year int NOT NULL,
  geo text NOT NULL,
  metric text NOT NULL,
  value_pct numeric,
  source_label text NOT NULL,
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  UNIQUE (survey, survey_year, geo, metric)
);
CREATE TABLE public.integrity_source_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher text NOT NULL,
  title text NOT NULL,
  title_el text,
  canonical_url text NOT NULL,
  content_hash text NOT NULL,
  published_at date,
  checked_at timestamptz NOT NULL DEFAULT now(),
  claim_status text NOT NULL DEFAULT 'development',
  audience text[] NOT NULL DEFAULT '{}',
  summary text,
  article_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_url, content_hash)
);
CREATE TABLE public.integrity_check_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  trigger text NOT NULL DEFAULT 'cron',
  status text NOT NULL DEFAULT 'running',
  results jsonb NOT NULL DEFAULT '[]',
  error text
);

GRANT SELECT ON public.cpi_editions, public.cpi_results, public.cpi_benchmarks, public.integrity_survey_findings, public.integrity_source_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpi_editions, public.cpi_results, public.cpi_benchmarks, public.integrity_survey_findings, public.integrity_source_updates, public.integrity_check_runs TO authenticated;
GRANT ALL ON public.cpi_editions, public.cpi_results, public.cpi_benchmarks, public.integrity_survey_findings, public.integrity_source_updates, public.integrity_check_runs TO service_role;

ALTER TABLE public.cpi_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpi_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_survey_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_source_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_check_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published editions" ON public.cpi_editions FOR SELECT USING (status = 'published');
CREATE POLICY "Public reads published results" ON public.cpi_results FOR SELECT USING (status = 'published');
CREATE POLICY "Public reads published benchmarks" ON public.cpi_benchmarks FOR SELECT USING (status = 'published');
CREATE POLICY "Public reads published surveys" ON public.integrity_survey_findings FOR SELECT USING (status = 'published');
CREATE POLICY "Public reads approved updates" ON public.integrity_source_updates FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins manage editions" ON public.cpi_editions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage results" ON public.cpi_results FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage benchmarks" ON public.cpi_benchmarks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage surveys" ON public.integrity_survey_findings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage updates" ON public.integrity_source_updates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read runs" ON public.integrity_check_runs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Publish a staged edition in one transaction; earlier years are untouched.
CREATE OR REPLACE FUNCTION public.publish_cpi_edition(_year int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cpi_results WHERE edition_year=_year AND status='staged') THEN
    RAISE EXCEPTION 'nothing staged for %', _year;
  END IF;
  DELETE FROM cpi_results WHERE edition_year=_year AND status='published';
  UPDATE cpi_results SET status='published' WHERE edition_year=_year AND status='staged';
  DELETE FROM cpi_benchmarks WHERE edition_year=_year AND status='published';
  UPDATE cpi_benchmarks SET status='published' WHERE edition_year=_year AND status='staged';
  UPDATE cpi_editions SET status='published', verified_at=now(), updated_at=now() WHERE edition_year=_year;
END $$;
REVOKE EXECUTE ON FUNCTION public.publish_cpi_edition(int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.publish_cpi_edition(int) TO authenticated, service_role;