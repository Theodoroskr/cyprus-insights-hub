
-- Banner placements table
CREATE TABLE public.banner_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slot_id TEXT NOT NULL DEFAULT 'leaderboard',
  image_url TEXT,
  click_url TEXT NOT NULL DEFAULT '#',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banner_placements"
  ON public.banner_placements FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active banners"
  ON public.banner_placements FOR SELECT
  TO public
  USING (is_active = true);

CREATE TRIGGER update_banner_placements_updated_at
  BEFORE UPDATE ON public.banner_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true);

CREATE POLICY "Anyone can view banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banner-images');

CREATE POLICY "Admins can update banner images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'banner-images');
