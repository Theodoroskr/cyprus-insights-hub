CREATE TABLE public.social_data_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  fingerprint text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook','linkedin','x')),
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','failed')),
  post_id text,
  message text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_data_posts TO authenticated;
GRANT ALL ON public.social_data_posts TO service_role;
ALTER TABLE public.social_data_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view data posts" ON public.social_data_posts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX social_data_posts_created_idx ON public.social_data_posts (created_at DESC);