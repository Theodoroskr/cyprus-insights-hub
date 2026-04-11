
-- Create content_sources table
CREATE TABLE public.content_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  scrape_path TEXT NOT NULL DEFAULT '/',
  category TEXT NOT NULL DEFAULT 'cyprus',
  trust_level TEXT NOT NULL DEFAULT 'standard',
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  target_vertical TEXT NOT NULL DEFAULT 'general',
  target_section TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_interval_hours INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content sources"
ON public.content_sources FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage content sources"
ON public.content_sources FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_content_sources_updated_at
BEFORE UPDATE ON public.content_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the sources
INSERT INTO public.content_sources (name, slug, url, scrape_path, category, trust_level, auto_publish, target_vertical, target_section) VALUES
  ('Invest Cyprus', 'invest-cyprus', 'https://www.investcyprus.org.cy', '/news', 'cyprus', 'trusted', true, 'general', 'news,industry,companies'),
  ('CySEC', 'cysec', 'https://www.cysec.gov.cy', '/en-GB/public-info/announcements', 'cyprus', 'trusted', true, 'compliance', 'compliance,news,alerts'),
  ('Research and Innovation Foundation', 'rif-cy', 'https://www.research.org.cy', '/en/news', 'cyprus', 'trusted', true, 'fintech', 'fintech,funding,startups'),
  ('Deputy Ministry Digital Policy', 'dmrid', 'https://www.dmrid.gov.cy', '/en/news', 'cyprus', 'trusted', true, 'general', 'news,digital'),
  ('European Commission', 'eu-commission', 'https://ec.europa.eu', '/commission/presscorner/home/en', 'eu', 'trusted', true, 'compliance', 'compliance,news'),
  ('European Central Bank', 'ecb', 'https://www.ecb.europa.eu', '/press/pr/html/index.en.html', 'eu', 'trusted', true, 'fintech', 'fintech,banking'),
  ('European Banking Authority', 'eba', 'https://www.eba.europa.eu', '/news-press/news', 'eu', 'trusted', true, 'compliance', 'compliance,aml'),
  ('ESMA', 'esma', 'https://www.esma.europa.eu', '/press-news/esma-news', 'eu', 'trusted', true, 'compliance', 'compliance,regulation'),
  ('EU Startups', 'eu-startups', 'https://www.eu-startups.com', '/latest', 'eu', 'standard', false, 'fintech', 'fintech,startups');
