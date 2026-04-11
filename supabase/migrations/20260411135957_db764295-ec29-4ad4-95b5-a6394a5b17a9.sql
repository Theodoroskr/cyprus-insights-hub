
-- Industries taxonomy
CREATE TABLE public.industries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view industries" ON public.industries FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage industries" ON public.industries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Locations taxonomy
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL DEFAULT 'Cyprus',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage locations" ON public.locations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Companies directory
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  industry_id UUID REFERENCES public.industries(id),
  location_id UUID REFERENCES public.locations(id),
  description TEXT,
  website TEXT,
  size TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage companies" ON public.companies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- People directory
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  photo TEXT,
  title TEXT,
  bio TEXT,
  is_whoiswho BOOLEAN NOT NULL DEFAULT false,
  whoiswho_quote TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view people" ON public.people FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage people" ON public.people FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Relationships (people <-> companies)
CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, person_id, role)
);
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view relationships" ON public.relationships FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage relationships" ON public.relationships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Directory articles (news, interviews, insights, whoiswho)
CREATE TYPE public.directory_article_type AS ENUM ('news', 'interview', 'insight', 'whoiswho');

CREATE TABLE public.directory_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  article_type public.directory_article_type NOT NULL DEFAULT 'news',
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.directory_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published directory articles" ON public.directory_articles FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admins can manage directory articles" ON public.directory_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Junction: articles <-> companies
CREATE TABLE public.article_companies (
  article_id UUID NOT NULL REFERENCES public.directory_articles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, company_id)
);
ALTER TABLE public.article_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view article_companies" ON public.article_companies FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage article_companies" ON public.article_companies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Junction: articles <-> people
CREATE TABLE public.article_people (
  article_id UUID NOT NULL REFERENCES public.directory_articles(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, person_id)
);
ALTER TABLE public.article_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view article_people" ON public.article_people FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage article_people" ON public.article_people FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Junction: articles <-> industries
CREATE TABLE public.article_industries (
  article_id UUID NOT NULL REFERENCES public.directory_articles(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, industry_id)
);
ALTER TABLE public.article_industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view article_industries" ON public.article_industries FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage article_industries" ON public.article_industries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reports (pay-per-report monetisation)
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'full',
  price NUMERIC(10,2) NOT NULL DEFAULT 49.99,
  api_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_companies_industry ON public.companies(industry_id);
CREATE INDEX idx_companies_location ON public.companies(location_id);
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_people_slug ON public.people(slug);
CREATE INDEX idx_directory_articles_type ON public.directory_articles(article_type);
CREATE INDEX idx_directory_articles_slug ON public.directory_articles(slug);
CREATE INDEX idx_relationships_company ON public.relationships(company_id);
CREATE INDEX idx_relationships_person ON public.relationships(person_id);
CREATE INDEX idx_reports_company ON public.reports(company_id);
