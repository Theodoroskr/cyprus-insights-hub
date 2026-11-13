CREATE TABLE public.tour_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.tour_destinations(id) ON DELETE SET NULL,
  name_en text NOT NULL,
  name_el text,
  aliases text[] NOT NULL DEFAULT '{}',
  kind text NOT NULL DEFAULT 'district',
  districts text[] NOT NULL DEFAULT '{}',
  intro_en text,
  intro_el text,
  image_url text,
  image_credit text,
  image_rights text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tour_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  scope text,
  status text NOT NULL DEFAULT 'pending_validation',
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tour_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_el text,
  aliases text[] NOT NULL DEFAULT '{}',
  summary_en text,
  summary_el text,
  category text NOT NULL,
  district text,
  locality text,
  address text,
  lat double precision,
  lng double precision,
  coords_verified boolean NOT NULL DEFAULT false,
  opening_hours text,
  admission text,
  booking_url text,
  accessibility text,
  parking text,
  official_url text,
  source_id uuid REFERENCES public.tour_sources(id) ON DELETE SET NULL,
  source_url text,
  last_verified_at date,
  status text NOT NULL DEFAULT 'draft',
  editor_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tour_listing_destinations (
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES public.tour_destinations(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, destination_id)
);
CREATE TABLE public.tour_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  credit text NOT NULL,
  rights text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tour_listing_destinations(destination_id);
CREATE INDEX ON public.tour_listings(status, category);

GRANT SELECT ON public.tour_destinations, public.tour_listings, public.tour_listing_destinations, public.tour_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_destinations, public.tour_listings, public.tour_listing_destinations, public.tour_photos, public.tour_sources TO authenticated;
GRANT ALL ON public.tour_destinations, public.tour_listings, public.tour_listing_destinations, public.tour_photos, public.tour_sources TO service_role;

ALTER TABLE public.tour_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_listing_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published destinations" ON public.tour_destinations FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins manage destinations" ON public.tour_destinations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public reads published listings" ON public.tour_listings FOR SELECT TO anon, authenticated USING (status = 'published' AND last_verified_at IS NOT NULL AND (source_url IS NOT NULL OR official_url IS NOT NULL));
CREATE POLICY "Admins manage listings" ON public.tour_listings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public reads links of published" ON public.tour_listing_destinations FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.tour_listings l WHERE l.id = listing_id AND l.status='published'));
CREATE POLICY "Admins manage links" ON public.tour_listing_destinations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public reads photos of published" ON public.tour_photos FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.tour_listings l WHERE l.id = listing_id AND l.status='published'));
CREATE POLICY "Admins manage photos" ON public.tour_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage tour sources" ON public.tour_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER tour_destinations_updated BEFORE UPDATE ON public.tour_destinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tour_listings_updated BEFORE UPDATE ON public.tour_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();