-- The district reference table is admin-only, so the rankings use a fixed list of the five districts.
CREATE OR REPLACE FUNCTION public.get_rankings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
WITH
dist(code, slug, name_en, name_el) AS (
  VALUES ('NICOSIA', 'nicosia', 'Nicosia', 'Λευκωσία'),
         ('LIMASSOL', 'limassol', 'Limassol', 'Λεμεσός'),
         ('LARNACA', 'larnaca', 'Larnaca', 'Λάρνακα'),
         ('PAPHOS', 'paphos', 'Paphos', 'Πάφος'),
         ('FAMAGUSTA', 'famagusta', 'Famagusta', 'Αμμόχωστος')
),
oldest AS (
  SELECT slug, company_name AS name, registration_date, city
  FROM directory_companies
  WHERE organisation_status = 'Active' AND organisation_type = 'Company'
    AND registration_date IS NOT NULL AND registration_no IS NOT NULL
  ORDER BY registration_date ASC, company_name ASC
  LIMIT 25
),
districts AS (
  SELECT d.slug, d.name_en, d.name_el, count(c.id) AS companies
  FROM dist d
  LEFT JOIN directory_companies c
    ON c.city_slug = d.slug AND c.organisation_status = 'Active' AND c.organisation_type = 'Company'
  GROUP BY d.slug, d.name_en, d.name_el
),
licences AS (
  SELECT source,
    CASE
      WHEN license_type ~* '^investment firm \(cif\)$' THEN 'Cyprus Investment Firm (CIF)'
      WHEN license_type ~* '^small aifm$' THEN 'Alternative Investment Fund Manager (AIFM)'
      ELSE coalesce(nullif(trim(license_type), ''), 'Other')
    END AS licence_type,
    count(*) AS firms,
    max(last_seen_at) AS last_seen_at
  FROM regulated_entities
  WHERE source IN ('cysec', 'cbc') AND lower(trim(status)) = 'active'
  GROUP BY 1, 2
),
re_end AS (SELECT max(period_date) AS p FROM re_sale_contracts WHERE status = 'published'),
property AS (
  SELECT d.slug, d.name_en, d.name_el,
    sum(s.contract_count) FILTER (WHERE s.period_date > (re_end.p - interval '12 months')) AS last12,
    sum(s.contract_count) FILTER (WHERE s.period_date <= (re_end.p - interval '12 months')
                                    AND s.period_date > (re_end.p - interval '24 months')) AS prev12,
    count(s.contract_count) FILTER (WHERE s.period_date > (re_end.p - interval '12 months')) AS months12,
    count(s.contract_count) FILTER (WHERE s.period_date <= (re_end.p - interval '12 months')
                                    AND s.period_date > (re_end.p - interval '24 months')) AS months_prev
  FROM dist d
  CROSS JOIN re_end
  LEFT JOIN re_sale_contracts s ON s.district_code = d.code AND s.status = 'published'
  GROUP BY d.slug, d.name_en, d.name_el
),
news AS (
  SELECT l.entity_type, l.entity_id, max(l.entity_label) AS label,
    count(DISTINCT l.article_id) AS stories,
    max(a.published_at) AS latest
  FROM news_entity_links l
  JOIN cna_articles a ON a.id = l.article_id
  WHERE l.status = 'approved' AND l.entity_type IN ('company', 'directory_company')
    AND a.status = 'published' AND a.published_at > now() - interval '30 days'
  GROUP BY l.entity_type, l.entity_id
  ORDER BY stories DESC, latest DESC
  LIMIT 10
),
news_slugs AS (
  SELECT n.*,
    CASE WHEN n.entity_type = 'directory_company' THEN dc.slug ELSE dc2.slug END AS directory_slug,
    CASE WHEN n.entity_type = 'company' THEN co.slug END AS company_slug
  FROM news n
  LEFT JOIN directory_companies dc ON n.entity_type = 'directory_company' AND dc.id = n.entity_id
  LEFT JOIN companies co ON n.entity_type = 'company' AND co.id = n.entity_id
  LEFT JOIN directory_companies dc2 ON dc2.id = co.directory_company_id
)
SELECT jsonb_build_object(
  'generated_at', now(),
  'oldest', coalesce((SELECT jsonb_agg(to_jsonb(o) ORDER BY o.registration_date, o.name) FROM oldest o), '[]'::jsonb),
  'districts', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.companies DESC) FROM districts d), '[]'::jsonb),
  'licences', coalesce((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.firms DESC, l.licence_type) FROM licences l), '[]'::jsonb),
  'property_period_end', (SELECT p FROM re_end),
  'property', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.last12 DESC NULLS LAST) FROM property p), '[]'::jsonb),
  'in_news', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'entity_type', s.entity_type, 'entity_id', s.entity_id, 'label', s.label, 'stories', s.stories,
      'latest', s.latest, 'directory_slug', s.directory_slug, 'company_slug', s.company_slug)
      ORDER BY s.stories DESC, s.latest DESC) FROM news_slugs s), '[]'::jsonb)
);
$$;

REVOKE ALL ON FUNCTION public.get_rankings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rankings() TO anon, authenticated, service_role;