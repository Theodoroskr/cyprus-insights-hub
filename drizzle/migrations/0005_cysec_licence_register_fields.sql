ALTER TABLE public.regulated_entities
  ADD COLUMN IF NOT EXISTS registration_no text,
  ADD COLUMN IF NOT EXISTS lei text,
  ADD COLUMN IF NOT EXISTS license_date date,
  ADD COLUMN IF NOT EXISTS source_list text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS match_method text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- A firm can hold several CySEC licences (e.g. CIF + former AIFM), so uniqueness is per licence type
ALTER TABLE public.regulated_entities DROP CONSTRAINT IF EXISTS regulated_entities_source_entity_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS regulated_entities_source_type_name_key
  ON public.regulated_entities (source, coalesce(license_type, ''), entity_name);
CREATE INDEX IF NOT EXISTS regulated_entities_registration_no_idx ON public.regulated_entities (registration_no);
CREATE INDEX IF NOT EXISTS regulated_entities_matched_company_idx ON public.regulated_entities (matched_company_id);