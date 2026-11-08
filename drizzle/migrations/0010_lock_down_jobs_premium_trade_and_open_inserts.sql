-- Private store for the shared secret scheduled jobs send to backend functions
CREATE TABLE IF NOT EXISTS public.internal_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.internal_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_secrets TO service_role;
ALTER TABLE public.internal_secrets ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.internal_secrets IS 'Service-only secrets (e.g. scheduled-job secret). No client policies by design.';

-- Premium entitlement check for the signed-in caller
CREATE OR REPLACE FUNCTION public.has_premium_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND tier = 'premium')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_premium_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_premium_access() TO authenticated, service_role;

-- Premium trade data: only premium members and admins
DROP POLICY IF EXISTS "Anyone can view trade_country_monthly" ON public.trade_country_monthly;
CREATE POLICY "Premium members can view trade_country_monthly" ON public.trade_country_monthly
  FOR SELECT TO authenticated USING (public.has_premium_access());

DROP POLICY IF EXISTS "Anyone can view trade_sector_monthly" ON public.trade_sector_monthly;
CREATE POLICY "Premium members can view trade_sector_monthly" ON public.trade_sector_monthly
  FOR SELECT TO authenticated USING (public.has_premium_access());

DROP POLICY IF EXISTS "Anyone can view published trade_ai_insights" ON public.trade_ai_insights;
CREATE POLICY "Premium members can view published trade_ai_insights" ON public.trade_ai_insights
  FOR SELECT TO authenticated USING (is_published = true AND public.has_premium_access());

-- Line-level import data is not shown publicly; admins only (admin ALL policy remains)
DROP POLICY IF EXISTS "Anyone can view trade_imports_clean" ON public.trade_imports_clean;

-- Internal/admin-only tables
DROP POLICY IF EXISTS "Anyone can view content sources" ON public.content_sources;
DROP POLICY IF EXISTS "Anyone can view dashboard_settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Status history is public" ON public.cysec_status_history;
CREATE POLICY "Admins can view status history" ON public.cysec_status_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Article views: only for published articles, with a bounded hash and a current timestamp
DROP POLICY IF EXISTS "Anyone can record a view" ON public.article_views;
CREATE POLICY "Anyone can record a view of a published article" ON public.article_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (viewer_hash IS NULL OR length(viewer_hash) <= 64)
    AND created_at BETWEEN now() - interval '5 minutes' AND now() + interval '5 minutes'
    AND EXISTS (SELECT 1 FROM public.cna_articles a WHERE a.id = article_id AND a.status = 'published')
  );

-- Newsletter sign-ups: well-formed, unconfirmed, bounded fields only
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with a valid sign-up" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    is_active = true
    AND confirmed_at IS NULL
    AND length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    AND (name IS NULL OR length(name) <= 120)
    AND (company IS NULL OR length(company) <= 160)
    AND (job_title IS NULL OR length(job_title) <= 120)
    AND frequency IN ('daily', 'weekly')
    AND coalesce(array_length(verticals, 1), 0) <= 10
  );

-- Banner images: public URLs keep working (public bucket); listing is admin-only
DROP POLICY IF EXISTS "Anyone can view banner images" ON storage.objects;
CREATE POLICY "Admins can list banner images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));