-- Table 1: directory_companies (the main 54K+ dataset)
CREATE TABLE public.directory_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  registration_no TEXT,
  organisation_status TEXT,
  registration_date DATE,
  organisation_type TEXT,
  organisation_sub_type TEXT,
  nace_code TEXT,
  activity_description TEXT,
  city TEXT,
  city_slug TEXT,
  address TEXT,
  map_lat DOUBLE PRECISION,
  map_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for search and city pages
CREATE INDEX idx_directory_companies_city_slug ON public.directory_companies (city_slug);
CREATE INDEX idx_directory_companies_name ON public.directory_companies USING gin (to_tsvector('simple', company_name));
CREATE INDEX idx_directory_companies_status ON public.directory_companies (organisation_status);

-- Enable RLS
ALTER TABLE public.directory_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view directory companies"
  ON public.directory_companies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage directory companies"
  ON public.directory_companies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Table 2: featured_companies
CREATE TABLE public.featured_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  city TEXT,
  featured_city_rank INTEGER,
  featured_reason TEXT,
  website TEXT,
  linkedin TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view featured companies"
  ON public.featured_companies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage featured companies"
  ON public.featured_companies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));