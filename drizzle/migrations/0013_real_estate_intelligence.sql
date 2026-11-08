CREATE TABLE public.re_districts (
  code text PRIMARY KEY,
  name_en text NOT NULL,
  name_el text NOT NULL,
  slug text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}'
);
GRANT SELECT ON public.re_districts TO anon, authenticated;
GRANT ALL ON public.re_districts TO service_role;
ALTER TABLE public.re_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Districts public" ON public.re_districts FOR SELECT USING (true);
INSERT INTO public.re_districts VALUES
 ('NICOSIA','Nicosia','Λευκωσία','nicosia','{NICOSIA,LEFKOSIA,ΛΕΥΚΩΣΙΑ}'),
 ('LIMASSOL','Limassol','Λεμεσός','limassol','{LIMASSOL,LEMESOS,ΛΕΜΕΣΟΣ}'),
 ('LARNACA','Larnaca','Λάρνακα','larnaca','{LARNACA,LARNAKA,ΛΑΡΝΑΚΑ}'),
 ('PAPHOS','Paphos','Πάφος','paphos','{PAPHOS,PAFOS,ΠΑΦΟΣ}'),
 ('FAMAGUSTA','Famagusta','Αμμόχωστος','famagusta','{FAMAGUSTA,AMMOCHOSTOS,ΑΜΜΟΧΩΣΤΟΣ}');

CREATE TABLE public.re_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_type text NOT NULL UNIQUE,
  source_name_en text NOT NULL,
  source_name_el text NOT NULL,
  publisher text NOT NULL,
  official_dataset_url text NOT NULL,
  licence text,
  update_frequency text NOT NULL DEFAULT 'monthly check',
  resource_urls jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz,
  last_successful_import_at timestamptz,
  latest_reporting_period date,
  next_check_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.re_sources TO anon, authenticated;
GRANT UPDATE ON public.re_sources TO authenticated;
GRANT ALL ON public.re_sources TO service_role;
ALTER TABLE public.re_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sources public read" ON public.re_sources FOR SELECT USING (true);
CREATE POLICY "Sources admin update" ON public.re_sources FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.re_sources (dataset_type, source_name_en, source_name_el, publisher, official_dataset_url, licence) VALUES
 ('sale_contracts','Property Sale Contract Statistics','Στατιστικά Στοιχεία Πωλητήριων Εγγράφων Ακινήτων','Department of Lands and Surveys','https://data.gov.cy/en/dataset/1007','CC BY 4.0'),
 ('transfers','Property Sales and Transfers Statistics','Στατιστικά Πωλήσεων (Μεταβιβάσεων) Ακινήτων','Department of Lands and Surveys','https://data.gov.cy/en/dataset/1005','CC BY 4.0');

CREATE TABLE public.re_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.re_sources(id),
  filename text,
  file_checksum text,
  imported_by uuid,
  imported_at timestamptz NOT NULL DEFAULT now(),
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  rejected_rows integer NOT NULL DEFAULT 0,
  new_rows integer NOT NULL DEFAULT 0,
  unchanged_rows integer NOT NULL DEFAULT 0,
  changed_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  validation_report jsonb
);
GRANT SELECT ON public.re_import_batches TO authenticated;
GRANT ALL ON public.re_import_batches TO service_role;
ALTER TABLE public.re_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Batches admin read" ON public.re_import_batches FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX re_import_batches_checksum ON public.re_import_batches(file_checksum);

CREATE TABLE public.re_sale_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_date date NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  district_code text NOT NULL REFERENCES public.re_districts(code),
  contract_count integer,
  status text NOT NULL DEFAULT 'published',
  source_id uuid REFERENCES public.re_sources(id),
  import_batch_id uuid REFERENCES public.re_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (district_code, period_date)
);
CREATE TABLE public.re_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_date date NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  district_code text NOT NULL REFERENCES public.re_districts(code),
  transfer_cases integer,
  parcel_count integer,
  declared_value_eur numeric(16,2),
  accepted_value_eur numeric(16,2),
  status text NOT NULL DEFAULT 'published',
  source_id uuid REFERENCES public.re_sources(id),
  import_batch_id uuid REFERENCES public.re_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (district_code, period_date)
);
GRANT SELECT ON public.re_sale_contracts, public.re_transfers TO anon, authenticated;
GRANT ALL ON public.re_sale_contracts, public.re_transfers TO service_role;
ALTER TABLE public.re_sale_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contracts published read" ON public.re_sale_contracts FOR SELECT USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Transfers published read" ON public.re_transfers FOR SELECT USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE INDEX re_sale_contracts_period ON public.re_sale_contracts(period_date);
CREATE INDEX re_transfers_period ON public.re_transfers(period_date);
CREATE TRIGGER re_sale_contracts_updated BEFORE UPDATE ON public.re_sale_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER re_transfers_updated BEFORE UPDATE ON public.re_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER re_sources_updated BEFORE UPDATE ON public.re_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.re_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_type text NOT NULL,
  district_code text NOT NULL,
  period_date date NOT NULL,
  previous_values jsonb,
  replacement_values jsonb NOT NULL,
  source_batch_id uuid REFERENCES public.re_import_batches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  changed_by uuid,
  approved_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  reason text
);
GRANT SELECT ON public.re_revisions TO authenticated;
GRANT ALL ON public.re_revisions TO service_role;
ALTER TABLE public.re_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Revisions admin read" ON public.re_revisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX re_revisions_status ON public.re_revisions(status);