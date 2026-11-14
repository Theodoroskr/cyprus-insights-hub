CREATE TABLE public.x_autopost_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  daily_limit integer NOT NULL DEFAULT 15,
  last_run_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.x_autopost_settings TO service_role;
GRANT SELECT, UPDATE ON public.x_autopost_settings TO authenticated;
ALTER TABLE public.x_autopost_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage X settings" ON public.x_autopost_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.x_autopost_settings (id) VALUES (true);

CREATE TABLE public.x_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  tweet_id text,
  status text NOT NULL DEFAULT 'posted',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX x_posts_one_success ON public.x_posts (article_id) WHERE status = 'posted';
CREATE INDEX x_posts_created ON public.x_posts (created_at DESC);
GRANT ALL ON public.x_posts TO service_role;
GRANT SELECT ON public.x_posts TO authenticated;
ALTER TABLE public.x_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read X posts" ON public.x_posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));