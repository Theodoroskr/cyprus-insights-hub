ALTER TABLE public.gr_procurement_notices
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS authority_name_en text,
  ADD COLUMN IF NOT EXISTS translated_at timestamptz;
ALTER TABLE public.gr_procurement_notices
  ADD COLUMN IF NOT EXISTS search_text_en text GENERATED ALWAYS AS (lower(COALESCE(title_en, ''))) STORED,
  ADD COLUMN IF NOT EXISTS authority_search_en text GENERATED ALWAYS AS (lower(COALESCE(authority_name_en, ''))) STORED;

CREATE OR REPLACE FUNCTION public.gr_procurement_reset_translation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title THEN NEW.title_en := NULL; NEW.translated_at := NULL; END IF;
  IF NEW.authority_name IS DISTINCT FROM OLD.authority_name THEN NEW.authority_name_en := NULL; NEW.translated_at := NULL; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS gr_procurement_reset_translation ON public.gr_procurement_notices;
CREATE TRIGGER gr_procurement_reset_translation BEFORE UPDATE ON public.gr_procurement_notices
  FOR EACH ROW EXECUTE FUNCTION public.gr_procurement_reset_translation();

CREATE INDEX IF NOT EXISTS gr_procurement_untranslated_idx ON public.gr_procurement_notices (kind, deadline_at) WHERE translated_at IS NULL;

CREATE TABLE IF NOT EXISTS public.gr_cpv_labels (
  code text PRIMARY KEY,
  label_el text NOT NULL,
  label_en text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gr_cpv_labels TO anon, authenticated;
GRANT ALL ON public.gr_cpv_labels TO service_role;
ALTER TABLE public.gr_cpv_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CPV labels are public" ON public.gr_cpv_labels;
CREATE POLICY "CPV labels are public" ON public.gr_cpv_labels FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.gr_cpv_labels (code, label_el)
SELECT DISTINCT ON (c.code) c.code, c.label
FROM public.gr_procurement_notices n,
  LATERAL unnest(n.cpv_codes, n.cpv_labels) AS c(code, label)
WHERE c.code IS NOT NULL AND c.label IS NOT NULL
ON CONFLICT (code) DO NOTHING;