-- Venue + reuse fields on listings
ALTER TABLE public.tour_listings
  ADD COLUMN IF NOT EXISTS facilities text,
  ADD COLUMN IF NOT EXISTS facilities_el text,
  ADD COLUMN IF NOT EXISTS catering text,
  ADD COLUMN IF NOT EXISTS catering_el text,
  ADD COLUMN IF NOT EXISTS directory_company_id uuid,
  ADD COLUMN IF NOT EXISTS quote_enabled boolean NOT NULL DEFAULT false;

-- Listing-to-listing links (village -> heritage/stay/event/route)
CREATE TABLE public.tour_listing_links (
  from_listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  to_listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  relation text NOT NULL DEFAULT 'related',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_listing_id, to_listing_id),
  CHECK (from_listing_id <> to_listing_id),
  CHECK (relation IN ('heritage','stay','event','route','related'))
);
GRANT SELECT ON public.tour_listing_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_listing_links TO authenticated;
GRANT ALL ON public.tour_listing_links TO service_role;
ALTER TABLE public.tour_listing_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads links between published listings" ON public.tour_listing_links FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tour_listings a WHERE a.id = from_listing_id AND a.status = 'published')
     AND EXISTS (SELECT 1 FROM public.tour_listings b WHERE b.id = to_listing_id AND b.status = 'published'));
CREATE POLICY "Admins manage listing links" ON public.tour_listing_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Event editions
CREATE TABLE public.tour_event_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  label text NOT NULL,
  label_el text,
  start_date date,
  end_date date,
  opening_hours text, opening_hours_el text,
  programme text, programme_el text,
  visitor_info text, visitor_info_el text,
  source_url text,
  last_verified_at date,
  status text NOT NULL DEFAULT 'draft',
  editor_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft','published')),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
GRANT SELECT ON public.tour_event_editions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_event_editions TO authenticated;
GRANT ALL ON public.tour_event_editions TO service_role;
ALTER TABLE public.tour_event_editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads confirmed editions" ON public.tour_event_editions FOR SELECT
  USING (status = 'published' AND source_url IS NOT NULL AND last_verified_at IS NOT NULL AND start_date IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.tour_listings l WHERE l.id = listing_id AND l.status = 'published'));
CREATE POLICY "Admins manage editions" ON public.tour_event_editions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tour_event_editions_updated BEFORE UPDATE ON public.tour_event_editions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Venue rooms with capacity by layout
CREATE TABLE public.tour_venue_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_el text,
  theatre integer, classroom integer, banquet integer, cocktail integer, boardroom integer, u_shape integer,
  area_sqm numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tour_venue_rooms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_venue_rooms TO authenticated;
GRANT ALL ON public.tour_venue_rooms TO service_role;
ALTER TABLE public.tour_venue_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads rooms of published venues" ON public.tour_venue_rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tour_listings l WHERE l.id = listing_id AND l.status = 'published'));
CREATE POLICY "Admins manage rooms" ON public.tour_venue_rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Verified venue business email (staff only, never public)
CREATE TABLE public.tour_venue_contacts (
  listing_id uuid PRIMARY KEY REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  email text NOT NULL,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_venue_contacts TO authenticated;
GRANT ALL ON public.tour_venue_contacts TO service_role;
ALTER TABLE public.tour_venue_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage venue contacts" ON public.tour_venue_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sync_venue_quote_enabled()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid := COALESCE(NEW.listing_id, OLD.listing_id);
BEGIN
  IF TG_OP <> 'DELETE' THEN NEW.updated_at := now(); END IF;
  UPDATE public.tour_listings SET quote_enabled = (TG_OP <> 'DELETE' AND NEW.verified_at IS NOT NULL AND NEW.email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
   WHERE id = _id;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER tour_venue_contacts_sync BEFORE INSERT OR UPDATE OR DELETE ON public.tour_venue_contacts FOR EACH ROW EXECUTE FUNCTION public.sync_venue_quote_enabled();

-- Quote requests (staff only)
CREATE TABLE public.venue_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE RESTRICT,
  venue_name text NOT NULL,
  request_key uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  organisation text NOT NULL,
  email text NOT NULL,
  event_type text NOT NULL,
  preferred_dates text NOT NULL,
  delegate_count integer NOT NULL,
  room_layout text NOT NULL,
  catering text,
  av_requirements text,
  details text,
  language text NOT NULL DEFAULT 'en',
  client_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venue_quote_requests TO authenticated;
GRANT ALL ON public.venue_quote_requests TO service_role;
ALTER TABLE public.venue_quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read quote requests" ON public.venue_quote_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX venue_quote_requests_client_idx ON public.venue_quote_requests (client_hash, created_at);
CREATE INDEX venue_quote_requests_email_idx ON public.venue_quote_requests (lower(email), created_at);

-- One delivery record per request (prevents duplicate sends)
CREATE TABLE public.venue_quote_deliveries (
  request_id uuid PRIMARY KEY REFERENCES public.venue_quote_requests(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('pending','sending','sent','failed','not_configured'))
);
GRANT SELECT ON public.venue_quote_deliveries TO authenticated;
GRANT ALL ON public.venue_quote_deliveries TO service_role;
ALTER TABLE public.venue_quote_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read quote deliveries" ON public.venue_quote_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER venue_quote_deliveries_updated BEFORE UPDATE ON public.venue_quote_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();