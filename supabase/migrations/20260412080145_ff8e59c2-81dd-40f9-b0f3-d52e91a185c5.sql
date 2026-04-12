-- Add regulatory flags to directory_companies
ALTER TABLE public.directory_companies
ADD COLUMN IF NOT EXISTS cysec_licensed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cysec_license_type text,
ADD COLUMN IF NOT EXISTS cysec_license_number text,
ADD COLUMN IF NOT EXISTS cysec_status text,
ADD COLUMN IF NOT EXISTS cbc_supervised boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS icpac_registered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bar_member boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cifa_member boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_flags_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_directory_cysec ON public.directory_companies(cysec_licensed) WHERE cysec_licensed = true;
CREATE INDEX IF NOT EXISTS idx_directory_cbc ON public.directory_companies(cbc_supervised) WHERE cbc_supervised = true;
CREATE INDEX IF NOT EXISTS idx_directory_icpac ON public.directory_companies(icpac_registered) WHERE icpac_registered = true;
CREATE INDEX IF NOT EXISTS idx_directory_bar ON public.directory_companies(bar_member) WHERE bar_member = true;
CREATE INDEX IF NOT EXISTS idx_directory_cifa ON public.directory_companies(cifa_member) WHERE cifa_member = true;

-- Create regulated_entities table
CREATE TABLE IF NOT EXISTS public.regulated_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  entity_name text NOT NULL,
  license_number text,
  license_type text,
  status text DEFAULT 'active',
  address text,
  website text,
  contact_email text,
  raw_data jsonb,
  matched_company_id uuid REFERENCES public.directory_companies(id) ON DELETE SET NULL,
  match_confidence numeric(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(source, entity_name)
);

CREATE INDEX IF NOT EXISTS idx_reg_entities_source ON public.regulated_entities(source);
CREATE INDEX IF NOT EXISTS idx_reg_entities_matched ON public.regulated_entities(matched_company_id);
CREATE INDEX IF NOT EXISTS idx_reg_entities_status ON public.regulated_entities(status);

ALTER TABLE public.regulated_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read regulated entities" ON public.regulated_entities
  FOR SELECT USING (true);

CREATE POLICY "Admins manage regulated entities" ON public.regulated_entities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));