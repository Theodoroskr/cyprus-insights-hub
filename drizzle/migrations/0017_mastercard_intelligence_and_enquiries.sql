CREATE TABLE public.mastercard_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'research' CHECK (kind IN ('source','research','product')),
  title text NOT NULL,
  title_el text,
  publisher text NOT NULL DEFAULT 'Mastercard Economics Institute',
  published_on date,
  geography text,
  category text NOT NULL DEFAULT 'Market Research',
  summary text,
  summary_el text,
  applications text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  source_url text NOT NULL,
  attribution text,
  licence_note text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mastercard_resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mastercard_resources TO authenticated;
GRANT ALL ON public.mastercard_resources TO service_role;
ALTER TABLE public.mastercard_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mastercard resources public read" ON public.mastercard_resources FOR SELECT USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Mastercard resources admin write" ON public.mastercard_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER mastercard_resources_updated BEFORE UPDATE ON public.mastercard_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.commercial_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner text NOT NULL DEFAULT 'infocredit',
  full_name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text,
  country text NOT NULL,
  industry text NOT NULL,
  interest text NOT NULL,
  message text,
  language text NOT NULL DEFAULT 'en',
  privacy_ack boolean NOT NULL DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  origin_path text,
  placement text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','under_review','contacted','qualified','proposal_requested','converted','closed')),
  assigned_to uuid,
  admin_notes text,
  client_hash text,
  external_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.commercial_enquiries TO authenticated;
GRANT ALL ON public.commercial_enquiries TO service_role;
ALTER TABLE public.commercial_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enquiries admin read" ON public.commercial_enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Enquiries admin update" ON public.commercial_enquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Enquiries admin delete" ON public.commercial_enquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX commercial_enquiries_created ON public.commercial_enquiries(created_at DESC);
CREATE INDEX commercial_enquiries_rate ON public.commercial_enquiries(client_hash, created_at);
CREATE TRIGGER commercial_enquiries_updated BEFORE UPDATE ON public.commercial_enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cta_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN ('view','open','submit','outbound')),
  placement text NOT NULL CHECK (char_length(placement) <= 60),
  path text CHECK (char_length(path) <= 200),
  interest text CHECK (char_length(interest) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.cta_events TO anon, authenticated;
GRANT SELECT ON public.cta_events TO authenticated;
GRANT ALL ON public.cta_events TO service_role;
ALTER TABLE public.cta_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CTA events insert" ON public.cta_events FOR INSERT TO anon, authenticated WITH CHECK (event IN ('view','open','outbound'));
CREATE POLICY "CTA events admin read" ON public.cta_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX cta_events_created ON public.cta_events(created_at DESC);

CREATE TABLE public.data_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  provider text NOT NULL,
  description text,
  auth_type text NOT NULL DEFAULT 'api_key',
  schedule text,
  usage_limit text,
  access_scope text NOT NULL DEFAULT 'admin',
  licence_confirmed boolean NOT NULL DEFAULT false,
  licence_reference text,
  docs_url text,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_connectors TO authenticated;
GRANT ALL ON public.data_connectors TO service_role;
ALTER TABLE public.data_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Connectors admin all" ON public.data_connectors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER data_connectors_updated BEFORE UPDATE ON public.data_connectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.guard_data_connector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.enabled AND (NOT NEW.licence_confirmed OR coalesce(NEW.licence_reference,'') = '') THEN
    RAISE EXCEPTION 'A connector can only be enabled once its licence is confirmed and referenced';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER data_connectors_guard BEFORE INSERT OR UPDATE ON public.data_connectors FOR EACH ROW EXECUTE FUNCTION public.guard_data_connector();

CREATE TABLE public.data_connector_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id uuid REFERENCES public.data_connectors(id) ON DELETE CASCADE,
  changed_by uuid,
  change jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.data_connector_audit TO authenticated;
GRANT ALL ON public.data_connector_audit TO service_role;
ALTER TABLE public.data_connector_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Connector audit admin read" ON public.data_connector_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_data_connector_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.data_connector_audit(connector_id, changed_by, change)
  VALUES (NEW.id, auth.uid(), jsonb_build_object('op', TG_OP, 'enabled', NEW.enabled, 'licence_confirmed', NEW.licence_confirmed, 'licence_reference', NEW.licence_reference));
  RETURN NEW;
END $$;
CREATE TRIGGER data_connectors_audit AFTER INSERT OR UPDATE ON public.data_connectors FOR EACH ROW EXECUTE FUNCTION public.log_data_connector_change();