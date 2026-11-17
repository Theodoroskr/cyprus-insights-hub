
DROP POLICY IF EXISTS "Story links are public ids" ON public.article_funding_links;
CREATE POLICY "Story links visible with their story and call" ON public.article_funding_links FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (EXISTS (SELECT 1 FROM public.cna_articles a WHERE a.id = article_funding_links.article_id AND a.status = 'published')
        AND EXISTS (SELECT 1 FROM public.funding_calls c WHERE c.id = article_funding_links.call_id))
  );

DROP POLICY IF EXISTS "Programmes are public reference" ON public.funding_programmes;
CREATE POLICY "Programmes visible when they have a visible call" ON public.funding_programmes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.funding_calls c WHERE c.programme_id = funding_programmes.id)
  );

ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "Public read organisations" ON public.organisations;
CREATE POLICY "Public read published organisations" ON public.organisations FOR SELECT
  USING (is_public OR public.has_role(auth.uid(), 'admin'));
