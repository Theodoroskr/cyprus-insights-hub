CREATE OR REPLACE FUNCTION public.merge_directory_duplicate(_dup uuid, _keep uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _dup = _keep THEN RAISE EXCEPTION 'Same company'; END IF;
  IF (SELECT registration_no FROM directory_companies WHERE id=_dup) IS NOT NULL THEN
    RAISE EXCEPTION 'Only unregistered entries can be merged away'; END IF;
  UPDATE directory_companies k SET
    cysec_licensed=coalesce(k.cysec_licensed,d.cysec_licensed), cysec_license_type=coalesce(k.cysec_license_type,d.cysec_license_type),
    cysec_license_number=coalesce(k.cysec_license_number,d.cysec_license_number), cysec_status=coalesce(k.cysec_status,d.cysec_status),
    cbc_supervised=coalesce(k.cbc_supervised,d.cbc_supervised), icpac_registered=coalesce(k.icpac_registered,d.icpac_registered),
    bar_member=coalesce(k.bar_member,d.bar_member), cifa_member=coalesce(k.cifa_member,d.cifa_member)
  FROM directory_companies d WHERE d.id=_dup AND k.id=_keep;
  UPDATE regulated_entities SET matched_company_id=_keep WHERE matched_company_id=_dup;
  UPDATE regulatory_records SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE companies SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE company_events SET directory_company_id=_keep WHERE directory_company_id=_dup;
  UPDATE kyb_reports SET company_id=_keep WHERE company_id=_dup;
  UPDATE news_entity_links SET entity_id=_keep WHERE entity_id=_dup;
  DELETE FROM match_review_queue WHERE candidate_id=_dup AND status='pending';
  DELETE FROM directory_companies WHERE id=_dup;
END $$;
REVOKE ALL ON FUNCTION public.merge_directory_duplicate(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.merge_directory_duplicate(uuid, uuid) TO authenticated;