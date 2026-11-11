
-- Source registry for listed-company disclosures and deal discovery
CREATE TABLE public.announcement_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'issuer',          -- exchange | issuer | discovery
  section text NOT NULL DEFAULT 'listed',       -- listed | deals
  method text NOT NULL DEFAULT 'page',          -- cse_oam | page | search | manual
  url text NOT NULL,
  company_name text,
  oam_company_id integer,
  directory_company_id uuid,
  status text NOT NULL DEFAULT 'pending_setup', -- active | pending_setup | unavailable | disabled
  auto_publish boolean NOT NULL DEFAULT false,
  check_interval_hours integer NOT NULL DEFAULT 24,
  search_query text,
  notes text,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_found_items integer NOT NULL DEFAULT 0,
  last_new_items integer NOT NULL DEFAULT 0,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_sources TO authenticated;
GRANT ALL ON public.announcement_sources TO service_role;
ALTER TABLE public.announcement_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcement sources" ON public.announcement_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER announcement_sources_updated BEFORE UPDATE ON public.announcement_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- One row per event (a disclosure or a deal)
CREATE TABLE public.company_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  section text NOT NULL,                         -- listed | deals
  announcement_type text NOT NULL,
  status text NOT NULL DEFAULT 'review',         -- review | published | rejected | merged
  company_name text NOT NULL,
  directory_company_id uuid,                     -- set only once the match is confirmed
  suggested_company_id uuid,
  company_match_status text NOT NULL DEFAULT 'unmatched', -- unmatched | suggested | confirmed
  title text NOT NULL,
  original_title text,
  summary text,
  sector text,
  source_language text,
  source_published_at timestamptz,
  event_date date,
  canonical_url text,
  primary_source_url text,
  discovery_url text,
  primary_verified boolean NOT NULL DEFAULT false,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid REFERENCES public.announcement_sources(id) ON DELETE SET NULL,
  external_ids text[] NOT NULL DEFAULT '{}',
  publish_when_ready boolean NOT NULL DEFAULT false,
  amount numeric,
  currency text,
  investors text[] NOT NULL DEFAULT '{}',
  buyer text,
  deal_stage text,                               -- announced | signed | completed | cancelled
  cyprus_location text,
  cyprus_tags text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  routing_note text,
  merged_into uuid REFERENCES public.company_announcements(id) ON DELETE SET NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_announcements_public_idx ON public.company_announcements (section, status, source_published_at DESC);
CREATE INDEX company_announcements_company_idx ON public.company_announcements (directory_company_id) WHERE directory_company_id IS NOT NULL;
CREATE INDEX company_announcements_external_idx ON public.company_announcements USING gin (external_ids);
GRANT SELECT ON public.company_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_announcements TO authenticated;
GRANT ALL ON public.company_announcements TO service_role;
ALTER TABLE public.company_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published announcements are public" ON public.company_announcements FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Admins manage announcements" ON public.company_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Every source link attached to an event (primary filing, issuer page, Greek/English versions, discovery article)
CREATE TABLE public.company_announcement_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.company_announcements(id) ON DELETE CASCADE,
  url text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'supporting',       -- primary | supporting | discovery
  language text,
  source_name text,
  title text,
  published_at timestamptz,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_announcement_sources_ann_idx ON public.company_announcement_sources (announcement_id);
GRANT SELECT ON public.company_announcement_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_announcement_sources TO authenticated;
GRANT ALL ON public.company_announcement_sources TO service_role;
ALTER TABLE public.company_announcement_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sources of published announcements are public" ON public.company_announcement_sources FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.company_announcements a WHERE a.id = announcement_id AND a.status = 'published'));
CREATE POLICY "Admins manage announcement links" ON public.company_announcement_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Later developments on a deal (signing, completion, integration milestones)
CREATE TABLE public.company_announcement_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.company_announcements(id) ON DELETE CASCADE,
  entry_date date,
  stage text,
  title text NOT NULL,
  summary text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_announcement_timeline_ann_idx ON public.company_announcement_timeline (announcement_id, entry_date);
GRANT SELECT ON public.company_announcement_timeline TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_announcement_timeline TO authenticated;
GRANT ALL ON public.company_announcement_timeline TO service_role;
ALTER TABLE public.company_announcement_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timeline of published announcements is public" ON public.company_announcement_timeline FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.company_announcements a WHERE a.id = announcement_id AND a.status = 'published'));
CREATE POLICY "Admins manage announcement timeline" ON public.company_announcement_timeline FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Validation + slug
CREATE OR REPLACE FUNCTION public.company_announcement_prepare()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE base text;
BEGIN
  IF NEW.section NOT IN ('listed','deals') THEN RAISE EXCEPTION 'Invalid section: %', NEW.section; END IF;
  IF NEW.status NOT IN ('review','published','rejected','merged') THEN RAISE EXCEPTION 'Invalid status: %', NEW.status; END IF;
  IF NEW.announcement_type NOT IN ('financial_results','dividend','buyback','shareholding','acquisition','board','funding_round','strategic_investment','project_expansion','other') THEN
    RAISE EXCEPTION 'Invalid announcement type: %', NEW.announcement_type; END IF;
  IF NEW.deal_stage IS NOT NULL AND NEW.deal_stage NOT IN ('announced','signed','completed','cancelled') THEN RAISE EXCEPTION 'Invalid deal stage: %', NEW.deal_stage; END IF;
  IF NOT (NEW.cyprus_tags <@ ARRAY['listed_in_cyprus','based_in_cyprus','founded_in_cyprus','investing_in_cyprus']::text[]) THEN RAISE EXCEPTION 'Invalid Cyprus connection tag'; END IF;
  IF NEW.company_match_status NOT IN ('unmatched','suggested','confirmed') THEN RAISE EXCEPTION 'Invalid match status'; END IF;
  IF NEW.directory_company_id IS NOT NULL THEN NEW.company_match_status := 'confirmed'; END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(coalesce(NEW.company_name,'') || ' ' || coalesce(NEW.title,''));
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := left(regexp_replace(base, '^-+|-+$', '', 'g'), 90);
    NEW.slug := base || '-' || left(replace(NEW.id::text,'-',''), 6);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER company_announcements_prepare BEFORE INSERT OR UPDATE ON public.company_announcements
  FOR EACH ROW EXECUTE FUNCTION public.company_announcement_prepare();

-- Per-item routing rules for association news sources
ALTER TABLE public.content_sources ADD COLUMN IF NOT EXISTS routing_profile text;
