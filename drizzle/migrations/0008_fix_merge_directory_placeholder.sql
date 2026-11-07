CREATE OR REPLACE FUNCTION public.merge_directory_placeholder(_dup uuid, _keep uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE d record;
BEGIN
  IF _dup = _keep THEN RAISE EXCEPTION 'Same company'; END IF;
  SELECT * INTO d FROM directory_companies WHERE id=_dup;
  IF d.id IS NULL THEN RETURN; END IF;
  IF d.registration_no IS NOT NULL THEN RAISE EXCEPTION 'Only unregistered entries can be merged away'; END IF;
  UPDATE directory_companies k SET
    cysec_licensed=coalesce(k.cysec_licensed,d.cysec_licensed), cysec_license_type=coalesce(k.cysec_license_type,d.cysec_license_type),
    cysec_license_number=coalesce(k.cysec_license_number,d.cysec_license_number), cysec_status=coalesce(k.cysec_status,d.cysec_status),
    cbc_supervised=coalesce(k.cbc_supervised,d.cbc_supervised), cbc_license_type=coalesce(k.cbc_license_type,d.cbc_license_type),
    cbc_license_number=coalesce(k.cbc_license_number,d.cbc_license_number), cbc_status=coalesce(k.cbc_status,d.cbc_status),
    icpac_registered=coalesce(k.icpac_registered,d.icpac_registered),
    bar_member=coalesce(k.bar_member,d.bar_member), cifa_member=coalesce(k.cifa_member,d.cifa_member)
  WHERE k.id=_keep;
  UPDATE regulated_entities SET matched_company_id=_keep WHERE matched_company_id=_dup;
  UPDATE regulatory_records SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE companies SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE company_events SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE kyb_reports SET company_id=_keep WHERE company_id=_dup;
  UPDATE news_entity_links SET entity_id=_keep WHERE entity_id=_dup AND entity_type='directory_company'
    AND NOT EXISTS (SELECT 1 FROM news_entity_links x WHERE x.article_id=news_entity_links.article_id AND x.entity_type='directory_company' AND x.entity_id=_keep);
  DELETE FROM news_entity_links WHERE entity_id=_dup AND entity_type='directory_company';
  UPDATE featured_companies SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE company_aliases SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE company_watchlist SET company_id=_keep WHERE company_id=_dup;
  DELETE FROM match_review_queue WHERE (candidate_id=_dup OR source_id=_dup) AND status='pending';
  DELETE FROM directory_companies WHERE id=_dup;
END $function$;

REVOKE ALL ON FUNCTION public.merge_directory_placeholder(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_directory_placeholder(uuid, uuid) TO service_role;