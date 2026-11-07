CREATE OR REPLACE FUNCTION public.normalize_company_name(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT nullif(trim(regexp_replace(regexp_replace(regexp_replace(
    lower(coalesce(_name,'')),
    '\([^)]*\)', ' ', 'g'),
    '\m(public company limited|public co ltd|public limited|limited|ltd|plc|llc|inc|s\.?a\.?|co|company|group|holdings?|the|cyprus|λτδ|λιμιτεδ)\M', ' ', 'g'),
    '[^a-z0-9α-ω]+', ' ', 'g')), '')
$$;

ALTER TABLE public.directory_companies
  ADD COLUMN IF NOT EXISTS name_key text GENERATED ALWAYS AS (public.normalize_company_name(company_name)) STORED;
CREATE INDEX IF NOT EXISTS idx_directory_companies_name_key ON public.directory_companies(name_key);

CREATE TABLE public.company_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias text NOT NULL,
  alias_key text GENERATED ALWAYS AS (public.normalize_company_name(alias)) STORED,
  directory_company_id uuid NOT NULL REFERENCES public.directory_companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX company_aliases_key_uq ON public.company_aliases(alias_key);
GRANT SELECT ON public.company_aliases TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_aliases TO authenticated;
GRANT ALL ON public.company_aliases TO service_role;
ALTER TABLE public.company_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aliases are public" ON public.company_aliases FOR SELECT USING (true);
CREATE POLICY "Admins manage aliases" ON public.company_aliases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.featured_companies ADD COLUMN IF NOT EXISTS directory_company_id uuid REFERENCES public.directory_companies(id) ON DELETE SET NULL;