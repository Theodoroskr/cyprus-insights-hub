CREATE OR REPLACE FUNCTION public.compliance_item_prepare()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE base text;
BEGIN
  IF NEW.status NOT IN ('review','published','rejected','merged','archived') THEN RAISE EXCEPTION 'Invalid status: %', NEW.status; END IF;
  IF NOT (NEW.sections <@ ARRAY['updates','eu_sanctions','cy_sanctions','deadlines']::text[]) THEN RAISE EXCEPTION 'Invalid section'; END IF;
  IF NEW.document_type NOT IN ('consultation','draft_standard','adopted_legislation','circular','guidance','announcement','decision','report','notice','corrigendum') THEN
    RAISE EXCEPTION 'Invalid document type: %', NEW.document_type; END IF;
  IF NOT (NEW.topics <@ ARRAY['aml_cft','sanctions','mica','dora','licensing','regulatory_reporting','payments','prudential','markets','governance','consumer_protection','other']::text[]) THEN RAISE EXCEPTION 'Invalid topic'; END IF;
  IF NEW.deadline_type IS NOT NULL AND NEW.deadline_type NOT IN ('consultation_close','filing','application','effective','other') THEN RAISE EXCEPTION 'Invalid deadline type'; END IF;
  IF NEW.measure_type IS NOT NULL AND NEW.measure_type NOT IN ('new_regime','listings','delistings','amendment','extension','sectoral','implementing','exemption','corrigendum','guidance','other') THEN RAISE EXCEPTION 'Invalid measure type'; END IF;
  IF NEW.jurisdiction NOT IN ('CY','EU','INT') THEN RAISE EXCEPTION 'Invalid jurisdiction'; END IF;
  IF NEW.source_language NOT IN ('en','el') THEN RAISE EXCEPTION 'Invalid language'; END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(coalesce(NEW.authority,'') || ' ' || coalesce(NEW.title_en, NEW.official_title, ''));
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := left(regexp_replace(base, '^-+|-+$', '', 'g'), 90);
    NEW.slug := base || '-' || left(replace(NEW.id::text,'-',''), 6);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $function$;