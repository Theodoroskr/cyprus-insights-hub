ALTER TABLE public.directory_companies
  ADD COLUMN IF NOT EXISTS nace21_code text,
  ADD COLUMN IF NOT EXISTS nace21_description text,
  ADD COLUMN IF NOT EXISTS cystat_register_date date;

COMMENT ON COLUMN public.directory_companies.cystat_register_date IS 'Edition date of the latest CYSTAT Business Register of active enterprises that lists this company (null = not listed).';

CREATE TABLE public.cystat_business_register (
  registration_no text PRIMARY KEY,
  company_name text NOT NULL,
  nace2_code text,
  nace2_description text,
  nace21_code text,
  nace21_description text,
  register_date date NOT NULL,
  directory_company_id uuid,
  match_type text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cystat_business_register TO authenticated;
GRANT ALL ON public.cystat_business_register TO service_role;

ALTER TABLE public.cystat_business_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read CYSTAT register"
ON public.cystat_business_register FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_cystat_register_company ON public.cystat_business_register(directory_company_id);