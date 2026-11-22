CREATE OR REPLACE FUNCTION public.publish_cpi_edition(_year integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cpi_results WHERE edition_year=_year AND status='staged') THEN
    RAISE EXCEPTION 'nothing staged for %', _year;
  END IF;
  DELETE FROM cpi_results WHERE edition_year=_year AND status='published';
  UPDATE cpi_results SET status='published' WHERE edition_year=_year AND status='staged';
  DELETE FROM cpi_benchmarks WHERE edition_year=_year AND status='published';
  UPDATE cpi_benchmarks SET status='published' WHERE edition_year=_year AND status='staged';
  UPDATE cpi_editions e SET status='published', verified_at=now(), updated_at=now(),
    countries_covered = CASE WHEN c.n >= 100 THEN c.n ELSE e.countries_covered END,
    below_50 = CASE WHEN c.n >= 100 THEN c.b ELSE e.below_50 END
  FROM (SELECT count(*)::int n, count(*) FILTER (WHERE score < 50)::int b FROM cpi_results WHERE edition_year=_year AND status='published') c
  WHERE e.edition_year=_year;
END $function$;