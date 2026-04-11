
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  resource_type TEXT NOT NULL DEFAULT 'guide',
  category TEXT NOT NULL DEFAULT 'general',
  cover_image TEXT,
  download_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published resources"
ON public.resources FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage resources"
ON public.resources FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_resources_type ON public.resources(resource_type);
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_slug ON public.resources(slug);
