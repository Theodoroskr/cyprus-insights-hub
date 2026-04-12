CREATE UNIQUE INDEX IF NOT EXISTS idx_regulated_entities_source_name 
ON public.regulated_entities (source, entity_name);