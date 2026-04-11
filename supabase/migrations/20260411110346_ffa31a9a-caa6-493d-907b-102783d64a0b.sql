
-- Create article vertical enum
CREATE TYPE public.article_vertical AS ENUM ('compliance', 'fintech', 'sme', 'general');

-- Create article status enum
CREATE TYPE public.article_status AS ENUM ('draft', 'published', 'archived');

-- Create CNA articles table
CREATE TABLE public.cna_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT UNIQUE,
  source_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT,
  image_url TEXT,
  vertical article_vertical NOT NULL DEFAULT 'general',
  what_happened TEXT,
  why_it_matters TEXT,
  what_to_do TEXT,
  tags TEXT[] DEFAULT '{}',
  status article_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cna_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can view published articles"
ON public.cna_articles
FOR SELECT
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage articles"
ON public.cna_articles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for vertical filtering and status
CREATE INDEX idx_cna_articles_vertical ON public.cna_articles (vertical);
CREATE INDEX idx_cna_articles_status ON public.cna_articles (status);
CREATE INDEX idx_cna_articles_published_at ON public.cna_articles (published_at DESC);
CREATE INDEX idx_cna_articles_source_id ON public.cna_articles (source_id);

-- Updated_at trigger
CREATE TRIGGER update_cna_articles_updated_at
BEFORE UPDATE ON public.cna_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.cna_articles;
