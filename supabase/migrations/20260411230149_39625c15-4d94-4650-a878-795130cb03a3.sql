
CREATE TABLE public.section_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  sponsor_name text NOT NULL,
  sponsor_url text NOT NULL,
  logo_url text,
  label text NOT NULL DEFAULT 'Section powered by',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active section sponsors"
ON public.section_sponsors FOR SELECT
TO public
USING (active = true);

CREATE POLICY "Admins can manage section sponsors"
ON public.section_sponsors FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_section_sponsors_updated_at
BEFORE UPDATE ON public.section_sponsors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed ComplianceSuite as the compliancehub sponsor
INSERT INTO public.section_sponsors (section_key, sponsor_name, sponsor_url, logo_url, label)
VALUES ('compliancehub', 'ComplianceSuite', 'https://compliancesuite.ai', NULL, 'Section powered by');
