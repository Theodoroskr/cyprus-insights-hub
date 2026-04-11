
-- Table to track article views
CREATE TABLE public.article_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.cna_articles(id) ON DELETE CASCADE,
  viewer_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast aggregation
CREATE INDEX idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX idx_article_views_created_at ON public.article_views(created_at);

-- Enable RLS
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anonymous tracking)
CREATE POLICY "Anyone can record a view"
ON public.article_views
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can read raw view data
CREATE POLICY "Admins can read views"
ON public.article_views
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to get most-read articles (last 30 days)
CREATE OR REPLACE FUNCTION public.get_most_read_articles(_limit integer DEFAULT 5)
RETURNS TABLE (
  article_id uuid,
  title text,
  vertical text,
  view_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id AS article_id,
    a.title,
    a.vertical::text,
    COUNT(v.id) AS view_count
  FROM public.cna_articles a
  JOIN public.article_views v ON v.article_id = a.id
  WHERE a.status = 'published'
    AND v.created_at >= now() - interval '30 days'
  GROUP BY a.id, a.title, a.vertical
  ORDER BY view_count DESC
  LIMIT _limit;
$$;
