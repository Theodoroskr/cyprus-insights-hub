
CREATE TABLE public.sponsored_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Sponsored',
  sponsor_name TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '#',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sponsored content"
ON public.sponsored_content
FOR SELECT
TO public
USING (active = true);

CREATE POLICY "Admins can manage sponsored content"
ON public.sponsored_content
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sponsored_content_updated_at
BEFORE UPDATE ON public.sponsored_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
