
-- Reusable official statistics store (first source: Eurostat)
CREATE TABLE public.stat_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'eurostat',
  dataset_code text NOT NULL,
  title_en text NOT NULL,
  title_el text,
  category text NOT NULL,
  description text,
  unit_label text NOT NULL,
  frequency text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  geos text[] NOT NULL DEFAULT ARRAY['CY','EU27_2020'],
  since_period text NOT NULL,
  decimals integer NOT NULL DEFAULT 1,
  higher_is_better boolean,
  sort_order integer NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  refresh_hours integer NOT NULL DEFAULT 24,
  source_label text,
  source_updated_at timestamptz,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  latest_period text,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.stat_datasets TO authenticated;
GRANT ALL ON public.stat_datasets TO service_role;
ALTER TABLE public.stat_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read datasets" ON public.stat_datasets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update datasets" ON public.stat_datasets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER stat_datasets_updated BEFORE UPDATE ON public.stat_datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stat_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  triggered_by uuid,
  trigger text NOT NULL DEFAULT 'schedule',
  status text NOT NULL DEFAULT 'running',
  datasets_checked integer NOT NULL DEFAULT 0,
  datasets_skipped integer NOT NULL DEFAULT 0,
  new_rows integer NOT NULL DEFAULT 0,
  unchanged_rows integer NOT NULL DEFAULT 0,
  changed_rows integer NOT NULL DEFAULT 0,
  rejected_rows integer NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.stat_import_jobs TO authenticated;
GRANT ALL ON public.stat_import_jobs TO service_role;
ALTER TABLE public.stat_import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read import jobs" ON public.stat_import_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.stat_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.stat_datasets(id) ON DELETE CASCADE,
  geo text NOT NULL,
  period text NOT NULL,
  period_date date NOT NULL,
  value numeric NOT NULL,
  status_flag text,
  source_updated_at timestamptz,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  import_job_id uuid REFERENCES public.stat_import_jobs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_id, geo, period)
);
CREATE INDEX stat_observations_dataset_idx ON public.stat_observations (dataset_id, geo, period_date);
GRANT SELECT ON public.stat_observations TO anon, authenticated;
GRANT ALL ON public.stat_observations TO service_role;
ALTER TABLE public.stat_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published statistics are public" ON public.stat_observations FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE TRIGGER stat_observations_updated BEFORE UPDATE ON public.stat_observations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stat_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.stat_datasets(id) ON DELETE CASCADE,
  geo text NOT NULL,
  period text NOT NULL,
  previous_value numeric,
  replacement_value numeric NOT NULL,
  previous_flag text,
  replacement_flag text,
  source_updated_at timestamptz,
  import_job_id uuid REFERENCES public.stat_import_jobs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stat_revisions_pending_idx ON public.stat_revisions (status, dataset_id);
GRANT SELECT ON public.stat_revisions TO authenticated;
GRANT ALL ON public.stat_revisions TO service_role;
ALTER TABLE public.stat_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read revisions" ON public.stat_revisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public catalogue of enabled datasets (no internal error text)
CREATE OR REPLACE FUNCTION public.get_public_stat_datasets()
RETURNS TABLE(id uuid, code text, source text, dataset_code text, title_en text, title_el text, category text, description text,
  unit_label text, frequency text, geos text[], decimals integer, higher_is_better boolean, sort_order integer, source_label text,
  source_updated_at timestamptz, last_success_at timestamptz, latest_period text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT d.id, d.code, d.source, d.dataset_code, d.title_en, d.title_el, d.category, d.description, d.unit_label, d.frequency,
         d.geos, d.decimals, d.higher_is_better, d.sort_order, d.source_label, d.source_updated_at, d.last_success_at, d.latest_period
  FROM public.stat_datasets d WHERE d.enabled = true ORDER BY d.sort_order, d.title_en
$$;
GRANT EXECUTE ON FUNCTION public.get_public_stat_datasets() TO anon, authenticated;
