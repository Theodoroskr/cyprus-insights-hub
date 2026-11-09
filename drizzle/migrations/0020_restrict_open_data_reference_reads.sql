-- open_data_sources: remove blanket public read; expose only catalogue fields of enabled sources via RPC
DROP POLICY IF EXISTS "Open data sources public read" ON public.open_data_sources;

CREATE OR REPLACE FUNCTION public.get_public_open_data_sources()
RETURNS TABLE (
  id uuid, module text, title_en text, title_el text, format text, publisher text,
  licence text, check_frequency text, latest_period date, dashboard_path text,
  portal_url text, upstream_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.module, s.title_en, s.title_el, s.format, s.publisher,
         s.licence, s.check_frequency, s.latest_period::date, s.dashboard_path,
         s.portal_url, s.upstream_url
  FROM public.open_data_sources s
  WHERE s.enabled = true
  ORDER BY s.module, s.title_en
$$;
REVOKE ALL ON FUNCTION public.get_public_open_data_sources() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_open_data_sources() TO anon, authenticated, service_role;

-- re_sources: admins read everything; visitors get only the public provenance fields via RPC
DROP POLICY IF EXISTS "Sources public read" ON public.re_sources;
CREATE POLICY "Sources admin read" ON public.re_sources
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_public_re_sources()
RETURNS TABLE (
  dataset_type text, official_dataset_url text,
  last_successful_import_at timestamptz, latest_reporting_period date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.dataset_type::text, r.official_dataset_url::text,
         r.last_successful_import_at::timestamptz, r.latest_reporting_period::date
  FROM public.re_sources r
$$;
REVOKE ALL ON FUNCTION public.get_public_re_sources() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_re_sources() TO anon, authenticated, service_role;

-- re_districts: not read by the website (district list is built in); restrict to admins
DROP POLICY IF EXISTS "Districts public" ON public.re_districts;
CREATE POLICY "Districts admin read" ON public.re_districts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));