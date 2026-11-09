CREATE TABLE public.facebook_autopost_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  page_id text,
  page_name text,
  enabled boolean NOT NULL DEFAULT false,
  daily_limit integer NOT NULL DEFAULT 20 CHECK (daily_limit BETWEEN 1 AND 50),
  last_run_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.facebook_autopost_settings TO authenticated;
GRANT ALL ON public.facebook_autopost_settings TO service_role;
ALTER TABLE public.facebook_autopost_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage facebook settings" ON public.facebook_autopost_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.facebook_autopost_settings (id) VALUES (true);

CREATE TABLE public.facebook_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  page_id text NOT NULL,
  fb_post_id text,
  status text NOT NULL CHECK (status IN ('posted', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, article_id)
);
GRANT SELECT ON public.facebook_posts TO authenticated;
GRANT ALL ON public.facebook_posts TO service_role;
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read facebook posts" ON public.facebook_posts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX facebook_posts_created_idx ON public.facebook_posts (created_at DESC);