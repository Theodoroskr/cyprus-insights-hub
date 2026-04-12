
-- Add slug column
ALTER TABLE public.directory_companies ADD COLUMN IF NOT EXISTS slug text;

-- Function to generate a slug from text
CREATE OR REPLACE FUNCTION public.generate_company_slug(company_name text, city text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base_slug text;
BEGIN
  -- Combine name + city, lowercase, replace non-alphanum with hyphens, trim
  base_slug := lower(trim(COALESCE(company_name, '') || ' ' || COALESCE(city, '')));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  -- Truncate to reasonable length
  base_slug := left(base_slug, 120);
  RETURN base_slug;
END;
$$;

-- Populate slugs for all existing rows
UPDATE public.directory_companies
SET slug = public.generate_company_slug(company_name, city)
WHERE slug IS NULL;

-- Handle duplicates by appending row_number suffix
WITH dupes AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.directory_companies
)
UPDATE public.directory_companies dc
SET slug = dc.slug || '-' || dupes.rn
FROM dupes
WHERE dc.id = dupes.id AND dupes.rn > 1;

-- Make slug NOT NULL and add unique index
ALTER TABLE public.directory_companies ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_directory_companies_slug ON public.directory_companies (slug);

-- Trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.set_directory_company_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_company_slug(NEW.company_name, NEW.city);
    final_slug := base_slug;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.directory_companies WHERE slug = final_slug AND id != NEW.id);
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_directory_company_slug
BEFORE INSERT ON public.directory_companies
FOR EACH ROW
EXECUTE FUNCTION public.set_directory_company_slug();
