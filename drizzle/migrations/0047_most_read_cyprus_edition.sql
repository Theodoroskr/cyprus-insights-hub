CREATE OR REPLACE FUNCTION public.get_most_read_articles(_limit integer DEFAULT 5)
 RETURNS TABLE(article_id uuid, title text, vertical text, image_url text, view_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH fresh AS (
    SELECT a.id, a.title, a.vertical::text AS vertical, a.image_url, a.published_at,
           split_part(coalesce(a.source_id, a.id::text), ':', 1) AS publisher
    FROM cna_articles a
    WHERE a.status = 'published' AND a.published_at >= now() - interval '7 days'
      AND a.edition @> '{cy}'
  ), scored AS (
    SELECT f.*, coalesce(sum(power(0.5, extract(epoch FROM now() - v.created_at) / 21600.0)), 0) AS score,
           count(v.id) AS views
    FROM fresh f LEFT JOIN article_views v ON v.article_id = f.id AND v.created_at >= now() - interval '48 hours'
    GROUP BY f.id, f.title, f.vertical, f.image_url, f.published_at, f.publisher
  ), ranked AS (
    SELECT s.*, row_number() OVER (PARTITION BY s.publisher ORDER BY s.score DESC, s.published_at DESC) AS pub_rank
    FROM scored s
  )
  SELECT id, title, vertical, image_url, views
  FROM ranked WHERE pub_rank <= 2
  ORDER BY (score > 0) DESC, score DESC, published_at DESC
  LIMIT _limit;
$function$;