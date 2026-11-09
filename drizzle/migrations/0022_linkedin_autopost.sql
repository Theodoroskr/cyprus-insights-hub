CREATE TABLE public.linkedin_autopost_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  organization_urn text,
  organization_name text,
  daily_limit integer NOT NULL DEFAULT 5 CHECK (daily_limit BETWEEN 0 AND 50),
  last_run_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.linkedin_autopost_settings TO authenticated;
GRANT ALL ON public.linkedin_autopost_settings TO service_role;
ALTER TABLE public.linkedin_autopost_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read linkedin settings" ON public.linkedin_autopost_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update linkedin settings" ON public.linkedin_autopost_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.linkedin_autopost_settings (id) VALUES (true);

CREATE TABLE public.linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  organization_urn text NOT NULL,
  li_post_id text,
  status text NOT NULL DEFAULT 'posted',
  image_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX linkedin_posts_once ON public.linkedin_posts (article_id, organization_urn) WHERE status = 'posted';
CREATE INDEX linkedin_posts_created ON public.linkedin_posts (created_at DESC);
GRANT SELECT ON public.linkedin_posts TO authenticated;
GRANT ALL ON public.linkedin_posts TO service_role;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read linkedin posts" ON public.linkedin_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));