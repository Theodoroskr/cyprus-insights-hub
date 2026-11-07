DROP INDEX IF EXISTS public.regulated_entities_source_type_name_key;
-- One row per licence: the same firm can hold an old (revoked) and a new licence of the same type
CREATE UNIQUE INDEX IF NOT EXISTS regulated_entities_source_type_name_lic_key
  ON public.regulated_entities (source, coalesce(license_type, ''), entity_name, coalesce(license_number, ''));