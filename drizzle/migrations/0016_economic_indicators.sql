CREATE TABLE public.econ_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid,
  total_rows integer NOT NULL DEFAULT 0,
  new_rows integer NOT NULL DEFAULT 0,
  unchanged_rows integer NOT NULL DEFAULT 0,
  changed_rows integer NOT NULL DEFAULT 0,
  rejected_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  validation_report jsonb
);
GRANT SELECT ON public.econ_import_batches TO authenticated;
GRANT ALL ON public.econ_import_batches TO service_role;
ALTER TABLE public.econ_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Econ batches admin read" ON public.econ_import_batches FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.econ_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_code text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly','quarterly')),
  period_date date NOT NULL,
  period_label text NOT NULL,
  value numeric,
  status text NOT NULL DEFAULT 'published',
  import_batch_id uuid REFERENCES public.econ_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_code, period_date)
);
GRANT SELECT ON public.econ_indicators TO anon, authenticated;
GRANT ALL ON public.econ_indicators TO service_role;
ALTER TABLE public.econ_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Econ published read" ON public.econ_indicators FOR SELECT USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE INDEX econ_indicators_series_period ON public.econ_indicators(series_code, period_date);
CREATE TRIGGER econ_indicators_updated BEFORE UPDATE ON public.econ_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.econ_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_code text NOT NULL,
  period_date date NOT NULL,
  previous_value numeric,
  replacement_value numeric,
  source_batch_id uuid REFERENCES public.econ_import_batches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT ON public.econ_revisions TO authenticated;
GRANT ALL ON public.econ_revisions TO service_role;
ALTER TABLE public.econ_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Econ revisions admin read" ON public.econ_revisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX econ_revisions_pending ON public.econ_revisions(status, series_code, period_date);