
DROP FUNCTION IF EXISTS public.get_most_read_articles(integer);

CREATE OR REPLACE FUNCTION public.get_most_read_articles(_limit integer DEFAULT 5)
RETURNS TABLE (
  article_id uuid,
  title text,
  vertical text,
  image_url text,
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
    a.image_url,
    COUNT(v.id) AS view_count
  FROM public.cna_articles a
  JOIN public.article_views v ON v.article_id = a.id
  WHERE a.status = 'published'
    AND v.created_at >= now() - interval '30 days'
  GROUP BY a.id, a.title, a.vertical, a.image_url
  ORDER BY view_count DESC
  LIMIT _limit;
$$;
