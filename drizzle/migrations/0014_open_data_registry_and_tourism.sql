CREATE TABLE public.open_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_el text,
  publisher text NOT NULL,
  portal_url text,
  upstream_url text,
  format text,
  licence text,
  check_frequency text NOT NULL DEFAULT 'monthly',
  module text NOT NULL DEFAULT 'catalog',
  dashboard_path text,
  enabled boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  latest_period date,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  discovered_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.open_data_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.open_data_sources TO authenticated;
GRANT ALL ON public.open_data_sources TO service_role;
ALTER TABLE public.open_data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open data sources public read" ON public.open_data_sources FOR SELECT USING (true);
CREATE POLICY "Open data sources admin write" ON public.open_data_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER open_data_sources_updated BEFORE UPDATE ON public.open_data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tourism_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid,
  total_rows integer NOT NULL DEFAULT 0,
  new_rows integer NOT NULL DEFAULT 0,
  unchanged_rows integer NOT NULL DEFAULT 0,
  changed_rows integer NOT NULL DEFAULT 0,
  rejected_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  validation_report jsonb
);
GRANT SELECT ON public.tourism_import_batches TO authenticated;
GRANT ALL ON public.tourism_import_batches TO service_role;
ALTER TABLE public.tourism_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tourism batches admin read" ON public.tourism_import_batches FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.tourism_arrivals_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_date date NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  country_code text NOT NULL,
  country_label text NOT NULL,
  kind text NOT NULL DEFAULT 'country',
  region text,
  arrivals integer,
  status text NOT NULL DEFAULT 'published',
  import_batch_id uuid REFERENCES public.tourism_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, period_date)
);
GRANT SELECT ON public.tourism_arrivals_monthly TO anon, authenticated;
GRANT ALL ON public.tourism_arrivals_monthly TO service_role;
ALTER TABLE public.tourism_arrivals_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tourism published read" ON public.tourism_arrivals_monthly FOR SELECT USING (status='published' OR public.has_role(auth.uid(),'admin'));
CREATE INDEX tourism_arrivals_period ON public.tourism_arrivals_monthly(period_date);
CREATE INDEX tourism_arrivals_kind ON public.tourism_arrivals_monthly(kind, country_code);
CREATE TRIGGER tourism_arrivals_updated BEFORE UPDATE ON public.tourism_arrivals_monthly FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tourism_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  period_date date NOT NULL,
  previous_value integer,
  replacement_value integer,
  source_batch_id uuid REFERENCES public.tourism_import_batches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT ON public.tourism_revisions TO authenticated;
GRANT ALL ON public.tourism_revisions TO service_role;
ALTER TABLE public.tourism_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tourism revisions admin read" ON public.tourism_revisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.open_data_sources (slug,title_en,title_el,publisher,portal_url,upstream_url,format,licence,check_frequency,module,dashboard_path,enabled,status) VALUES
('dls-sale-contracts','Property Sale Contract Statistics','Στατιστικά Στοιχεία Πωλητήριων Εγγράφων Ακινήτων','Department of Lands and Surveys','https://data.gov.cy/en/dataset/1007',NULL,'CSV','CC BY 4.0','monthly (20th)','real_estate','/real-estate',true,'ok'),
('dls-transfers','Property Sales and Transfers Statistics','Στατιστικά Πωλήσεων (Μεταβιβάσεων) Ακινήτων','Department of Lands and Surveys','https://data.gov.cy/en/dataset/1005',NULL,'CSV','CC BY 4.0','monthly (20th)','real_estate','/real-estate',true,'ok'),
('cystat-tourist-arrivals-monthly','Arrivals of Tourists by Country of Usual Residence, Monthly','Αφίξεις Τουριστών κατά Χώρα Συνήθους Διαμονής, Μηνιαία','Cyprus Statistical Service (CYSTAT)','https://data.gov.cy/en/dataset/2274','https://cystatdb.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/Tourism/Tourists/Monthly/2021010E.px','PxWeb API (JSON)','CC BY 4.0','monthly (22nd)','tourism','/tourism',true,'pending'),
('cystat-external-trade','External Trade — Imports','Εξωτερικό Εμπόριο — Εισαγωγές','Cyprus Statistical Service (CYSTAT)',NULL,'https://cystatdb.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/8.CYSTAT-DB__External%20Trade','PxWeb API (JSON)',NULL,'monthly (15th)','trade','/trade',true,'ok'),
('cysec-registers','CySEC Registers of Regulated Entities','Μητρώα Εποπτευόμενων Οντοτήτων ΕΚΚ','Cyprus Securities and Exchange Commission','https://www.cysec.gov.cy/en-GB/entities/',NULL,'HTML',NULL,'weekly (Sunday)','directory','/directory',true,'ok'),
('cbc-registers','Central Bank of Cyprus Registers','Μητρώα Κεντρικής Τράπεζας Κύπρου','Central Bank of Cyprus','https://www.centralbank.cy/',NULL,'HTML / XLSX',NULL,'weekly (Sunday)','directory','/directory',true,'ok');