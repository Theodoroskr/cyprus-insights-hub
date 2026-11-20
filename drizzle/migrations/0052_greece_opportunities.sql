ALTER TABLE public.open_data_sources ADD COLUMN IF NOT EXISTS records_imported integer;

CREATE TABLE public.gr_procurement_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('tender','award')),
  title text NOT NULL,
  authority_name text,
  authority_code text,
  notice_type text,
  procedure_type text,
  contract_type text,
  published_at timestamptz,
  signed_date date,
  deadline_at timestamptz,
  value_without_vat numeric,
  value_with_vat numeric,
  currency text,
  cpv_codes text[] NOT NULL DEFAULT '{}',
  cpv_labels text[] NOT NULL DEFAULT '{}',
  focus text[] NOT NULL DEFAULT '{}',
  nuts_code text,
  nuts_label text,
  cancelled boolean NOT NULL DEFAULT false,
  amends_reference text,
  superseded_by text,
  winners text[] NOT NULL DEFAULT '{}',
  official_url text NOT NULL,
  diavgeia_url text,
  source_updated_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gr_procurement_kind_pub_idx ON public.gr_procurement_notices (kind, published_at DESC);
CREATE INDEX gr_procurement_deadline_idx ON public.gr_procurement_notices (deadline_at);
CREATE INDEX gr_procurement_focus_idx ON public.gr_procurement_notices USING gin (focus);
CREATE INDEX gr_procurement_cpv_idx ON public.gr_procurement_notices USING gin (cpv_codes);

GRANT SELECT ON public.gr_procurement_notices TO anon, authenticated;
GRANT ALL ON public.gr_procurement_notices TO service_role;
ALTER TABLE public.gr_procurement_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Official procurement notices are public" ON public.gr_procurement_notices FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER gr_procurement_updated BEFORE UPDATE ON public.gr_procurement_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gr_procurement_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily_digest boolean NOT NULL DEFAULT false,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gr_procurement_saved_user_idx ON public.gr_procurement_saved_searches (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gr_procurement_saved_searches TO authenticated;
GRANT ALL ON public.gr_procurement_saved_searches TO service_role;
ALTER TABLE public.gr_procurement_saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own saved searches" ON public.gr_procurement_saved_searches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own saved searches" ON public.gr_procurement_saved_searches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users edit own saved searches" ON public.gr_procurement_saved_searches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved searches" ON public.gr_procurement_saved_searches FOR DELETE TO authenticated USING (auth.uid() = user_id);