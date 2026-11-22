ALTER TABLE public.compliance_sources ADD COLUMN IF NOT EXISTS auto_publish boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.compliance_sources.auto_publish IS 'New records from this source publish automatically once their draft summary exists (labelled as not yet editor-reviewed).';
ALTER TABLE public.compliance_items ADD COLUMN IF NOT EXISTS auto_published boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.compliance_items.auto_published IS 'Published automatically from a trusted source and not yet reviewed by an editor; cleared when an editor saves the record.';

CREATE TABLE IF NOT EXISTS public.social_compliance_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.compliance_items(id) ON DELETE CASCADE,
  slot text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook','linkedin','x')),
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','failed')),
  post_id text,
  message text,
  image_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_compliance_posts_created_idx ON public.social_compliance_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS social_compliance_posts_item_idx ON public.social_compliance_posts (item_id);
CREATE UNIQUE INDEX IF NOT EXISTS social_compliance_posts_once ON public.social_compliance_posts (item_id, platform) WHERE status = 'posted';
ALTER TABLE public.social_compliance_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_compliance_posts FROM anon;
GRANT SELECT ON public.social_compliance_posts TO authenticated;
GRANT ALL ON public.social_compliance_posts TO service_role;
CREATE POLICY "Admins can view compliance social posts" ON public.social_compliance_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));