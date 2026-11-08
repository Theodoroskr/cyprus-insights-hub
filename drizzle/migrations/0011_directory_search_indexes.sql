CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS idx_directory_companies_registration_no ON public.directory_companies (registration_no);
CREATE INDEX IF NOT EXISTS idx_directory_companies_name_trgm ON public.directory_companies USING gin (company_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_company_aliases_alias_trgm ON public.company_aliases USING gin (alias extensions.gin_trgm_ops);