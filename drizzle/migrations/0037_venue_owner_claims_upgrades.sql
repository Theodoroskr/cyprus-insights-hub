ALTER TABLE public.tour_listings
  ADD COLUMN IF NOT EXISTS venue_type text,
  ADD COLUMN IF NOT EXISTS operating_status text,
  ADD COLUMN IF NOT EXISTS verified_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS brochure_url text,
  ADD COLUMN IF NOT EXISTS av_equipment text,
  ADD COLUMN IF NOT EXISTS av_equipment_el text,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS plan_code text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- Import
CREATE TABLE public.venue_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_path text,
  source_date date,
  imported_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by uuid
);
CREATE TABLE public.venue_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.venue_import_batches(id) ON DELETE CASCADE,
  source_page int,
  name text NOT NULL,
  locality text,
  district text,
  address text,
  website text,
  phone text,
  rooms jsonb NOT NULL DEFAULT '[]',
  raw jsonb,
  match_status text NOT NULL DEFAULT 'new',
  matched_listing_id uuid REFERENCES public.tour_listings(id) ON DELETE SET NULL,
  match_note text,
  needs_verification text[] NOT NULL DEFAULT '{}',
  decision text NOT NULL DEFAULT 'pending',
  created_listing_id uuid REFERENCES public.tour_listings(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Owners
CREATE TABLE public.venue_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  request_type text NOT NULL DEFAULT 'claim',
  rep_name text NOT NULL,
  rep_role text,
  organisation text,
  business_email text NOT NULL,
  details text,
  attachments text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received',
  verification_method text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.venue_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  claim_id uuid REFERENCES public.venue_claims(id) ON DELETE SET NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid,
  UNIQUE (listing_id, user_id)
);
CREATE TABLE public.venue_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}',
  note text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.venue_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  user_id uuid,
  kind text NOT NULL DEFAULT 'photo',
  storage_path text NOT NULL,
  public_url text,
  caption text,
  permission_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  sort_order int NOT NULL DEFAULT 0,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.venue_plans (
  code text PRIMARY KEY,
  name_en text NOT NULL,
  name_el text,
  benefits_en text[] NOT NULL DEFAULT '{}',
  benefits_el text[] NOT NULL DEFAULT '{}',
  price_eur numeric,
  billing_interval text,
  photo_limit int NOT NULL DEFAULT 0,
  allows_cover boolean NOT NULL DEFAULT false,
  allows_brochure boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.venue_upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.tour_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  plan_code text NOT NULL REFERENCES public.venue_plans(code),
  message text,
  status text NOT NULL DEFAULT 'received',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text,
  payment_reference text UNIQUE,
  quoted_price_eur numeric,
  term_start date,
  term_end date,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.venue_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  listing_id uuid,
  action text NOT NULL,
  detail jsonb,
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.venue_import_batches, public.venue_import_rows, public.venue_claims, public.venue_representatives,
  public.venue_change_requests, public.venue_media, public.venue_plans, public.venue_upgrade_requests, public.venue_request_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_import_batches, public.venue_import_rows, public.venue_claims, public.venue_representatives,
  public.venue_change_requests, public.venue_media, public.venue_plans, public.venue_upgrade_requests TO authenticated;
GRANT SELECT ON public.venue_request_history TO authenticated;
GRANT SELECT ON public.venue_plans, public.venue_media TO anon;

ALTER TABLE public.venue_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_request_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_venue_rep(_listing uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.venue_representatives WHERE listing_id = _listing AND user_id = auth.uid())
$$;

CREATE POLICY "admins manage import batches" ON public.venue_import_batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage import rows" ON public.venue_import_rows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "users file own claims" ON public.venue_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'received' AND reviewed_by IS NULL);
CREATE POLICY "users read own claims" ON public.venue_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update claims" ON public.venue_claims FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete claims" ON public.venue_claims FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "reps read own" ON public.venue_representatives FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage reps" ON public.venue_representatives FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "reps submit changes" ON public.venue_change_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND public.is_venue_rep(listing_id));
CREATE POLICY "reps read own changes" ON public.venue_change_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update changes" ON public.venue_change_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "public sees approved media" ON public.venue_media FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reps submit media" ON public.venue_media FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND permission_confirmed AND public_url IS NULL
    AND public.is_venue_rep(listing_id) AND kind IN ('logo','photo','cover','brochure'));
CREATE POLICY "admins manage media" ON public.venue_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "anyone reads active plans" ON public.venue_plans FOR SELECT TO anon, authenticated
  USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage plans" ON public.venue_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "reps request upgrades" ON public.venue_upgrade_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'received' AND payment_status = 'unpaid' AND payment_reference IS NULL
    AND term_start IS NULL AND term_end IS NULL AND public.is_venue_rep(listing_id));
CREATE POLICY "reps read own upgrades" ON public.venue_upgrade_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update upgrades" ON public.venue_upgrade_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "history for admins and owners" ON public.venue_request_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR actor = auth.uid() OR public.is_venue_rep(listing_id));

-- Upgrade validation + activation
CREATE OR REPLACE FUNCTION public.venue_upgrade_prepare()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('received','under_review','awaiting_payment','active','declined','expired') THEN
    RAISE EXCEPTION 'invalid upgrade status %', NEW.status;
  END IF;
  IF NEW.payment_status NOT IN ('unpaid','paid','refunded') THEN
    RAISE EXCEPTION 'invalid payment status %', NEW.payment_status;
  END IF;
  IF NEW.status = 'active' AND (NEW.payment_status <> 'paid' OR NEW.term_end IS NULL) THEN
    RAISE EXCEPTION 'an upgrade can only be active once payment is confirmed and a term end is set';
  END IF;
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    UPDATE public.tour_listings SET plan_code = NEW.plan_code, plan_expires_at = (NEW.term_end + 1)::timestamptz
      WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status IN ('expired','declined') THEN
    UPDATE public.tour_listings SET plan_code = 'free', plan_expires_at = NULL
      WHERE id = NEW.listing_id AND plan_code = OLD.plan_code;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER venue_upgrade_prepare BEFORE INSERT OR UPDATE ON public.venue_upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION public.venue_upgrade_prepare();

-- History log for status changes
CREATE OR REPLACE FUNCTION public.venue_log_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.venue_request_history(entity, entity_id, listing_id, action, actor, detail)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.listing_id, 'submitted', auth.uid(), jsonb_build_object('status', NEW.status));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.venue_request_history(entity, entity_id, listing_id, action, actor, detail)
      VALUES (TG_TABLE_NAME, NEW.id, NEW.listing_id, 'status', auth.uid(), jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER venue_claims_history AFTER INSERT OR UPDATE ON public.venue_claims FOR EACH ROW EXECUTE FUNCTION public.venue_log_history();
CREATE TRIGGER venue_changes_history AFTER INSERT OR UPDATE ON public.venue_change_requests FOR EACH ROW EXECUTE FUNCTION public.venue_log_history();
CREATE TRIGGER venue_media_history AFTER INSERT OR UPDATE ON public.venue_media FOR EACH ROW EXECUTE FUNCTION public.venue_log_history();
CREATE TRIGGER venue_upgrades_history AFTER INSERT OR UPDATE ON public.venue_upgrade_requests FOR EACH ROW EXECUTE FUNCTION public.venue_log_history();

-- Private submissions bucket policies (bucket created separately)
CREATE POLICY "venue submitters upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'venue-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "venue submitters read own folder" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'venue-submissions' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "admins manage venue submissions" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'venue-submissions' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'venue-submissions' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "public reads venue media" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'venue-media');
CREATE POLICY "admins write venue media" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'venue-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'venue-media' AND public.has_role(auth.uid(),'admin'));