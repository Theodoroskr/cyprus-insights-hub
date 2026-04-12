
CREATE OR REPLACE FUNCTION public.generate_company_slug(company_name text, city text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  base_slug text;
BEGIN
  base_slug := lower(trim(COALESCE(company_name, '') || ' ' || COALESCE(city, '')));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  base_slug := left(base_slug, 120);
  RETURN base_slug;
END;
$$;
