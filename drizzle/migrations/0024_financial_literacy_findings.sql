CREATE TABLE public.fin_lit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher text NOT NULL,
  survey text NOT NULL,
  survey_year int NOT NULL,
  published_year int,
  indicator text NOT NULL,
  value numeric,
  unit text NOT NULL,
  comparison_label text,
  comparison_value numeric,
  source_url text NOT NULL,
  page_ref text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fin_lit_findings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_lit_findings TO authenticated;
GRANT ALL ON public.fin_lit_findings TO service_role;
ALTER TABLE public.fin_lit_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads approved findings" ON public.fin_lit_findings FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins manage findings" ON public.fin_lit_findings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER fin_lit_findings_updated BEFORE UPDATE ON public.fin_lit_findings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();