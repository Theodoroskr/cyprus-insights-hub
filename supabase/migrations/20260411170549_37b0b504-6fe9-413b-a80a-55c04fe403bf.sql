
-- 1) raw_trade_imports
CREATE TABLE public.raw_trade_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dataset_code text,
  source_dataset_name text,
  year integer NOT NULL,
  month integer NOT NULL,
  period_label text,
  country_code text,
  country_name text,
  hs_code text,
  hs_description text,
  import_value_eur numeric NOT NULL DEFAULT 0,
  quantity numeric,
  unit text,
  source_url text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  batch_id text
);
ALTER TABLE public.raw_trade_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage raw_trade_imports" ON public.raw_trade_imports FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) hs_sector_mapping
CREATE TABLE public.hs_sector_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_prefix text NOT NULL,
  sector_name text NOT NULL,
  sector_group text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.hs_sector_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage hs_sector_mapping" ON public.hs_sector_mapping FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view hs_sector_mapping" ON public.hs_sector_mapping FOR SELECT TO public USING (true);

-- 3) trade_countries (separate from existing companies-related countries)
CREATE TABLE public.trade_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text UNIQUE NOT NULL,
  country_name text NOT NULL,
  region_name text,
  eu_member boolean NOT NULL DEFAULT false,
  priority_country boolean NOT NULL DEFAULT false,
  slug text NOT NULL
);
ALTER TABLE public.trade_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_countries" ON public.trade_countries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view trade_countries" ON public.trade_countries FOR SELECT TO public USING (true);

-- 4) trade_imports_clean
CREATE TABLE public.trade_imports_clean (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_id uuid REFERENCES public.raw_trade_imports(id) ON DELETE SET NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  date_month date NOT NULL,
  period_label text,
  country_id uuid REFERENCES public.trade_countries(id),
  hs_code text,
  hs_description text,
  sector_name text,
  sector_group text,
  import_value_eur numeric NOT NULL DEFAULT 0,
  quantity numeric,
  unit text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_imports_clean ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_imports_clean" ON public.trade_imports_clean FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view trade_imports_clean" ON public.trade_imports_clean FOR SELECT TO public USING (true);

CREATE INDEX idx_trade_imports_clean_date ON public.trade_imports_clean(date_month);
CREATE INDEX idx_trade_imports_clean_country ON public.trade_imports_clean(country_id);
CREATE INDEX idx_trade_imports_clean_sector ON public.trade_imports_clean(sector_name);

-- 5) trade_monthly_totals
CREATE TABLE public.trade_monthly_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  date_month date UNIQUE NOT NULL,
  total_imports_eur numeric NOT NULL DEFAULT 0,
  mom_growth_pct numeric,
  yoy_growth_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_monthly_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_monthly_totals" ON public.trade_monthly_totals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view trade_monthly_totals" ON public.trade_monthly_totals FOR SELECT TO public USING (true);

-- 6) trade_country_monthly
CREATE TABLE public.trade_country_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  date_month date NOT NULL,
  country_id uuid REFERENCES public.trade_countries(id),
  total_imports_eur numeric NOT NULL DEFAULT 0,
  country_share_pct numeric,
  rank_position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_country_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_country_monthly" ON public.trade_country_monthly FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view trade_country_monthly" ON public.trade_country_monthly FOR SELECT TO public USING (true);

CREATE INDEX idx_trade_country_monthly_date ON public.trade_country_monthly(date_month);

-- 7) trade_sector_monthly
CREATE TABLE public.trade_sector_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  date_month date NOT NULL,
  sector_name text NOT NULL,
  sector_group text,
  total_imports_eur numeric NOT NULL DEFAULT 0,
  sector_share_pct numeric,
  rank_position integer,
  mom_growth_pct numeric,
  yoy_growth_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_sector_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_sector_monthly" ON public.trade_sector_monthly FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view trade_sector_monthly" ON public.trade_sector_monthly FOR SELECT TO public USING (true);

CREATE INDEX idx_trade_sector_monthly_date ON public.trade_sector_monthly(date_month);

-- 8) trade_kpi_snapshots
CREATE TABLE public.trade_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_month date UNIQUE NOT NULL,
  total_imports_eur numeric NOT NULL DEFAULT 0,
  mom_growth_pct numeric,
  yoy_growth_pct numeric,
  top_import_country_id uuid REFERENCES public.trade_countries(id),
  top_import_country_value_eur numeric,
  top_import_sector text,
  top_import_sector_value_eur numeric,
  top_5_countries_share_pct numeric,
  top_3_sectors_share_pct numeric,
  eu_share_pct numeric,
  non_eu_share_pct numeric,
  import_concentration_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_kpi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_kpi_snapshots" ON public.trade_kpi_snapshots FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view trade_kpi_snapshots" ON public.trade_kpi_snapshots FOR SELECT TO public USING (true);

-- 9) trade_ai_insights
CREATE TABLE public.trade_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_month date NOT NULL,
  insight_type text NOT NULL,
  title text NOT NULL,
  summary_text text NOT NULL,
  supporting_metrics_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT false
);
ALTER TABLE public.trade_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_ai_insights" ON public.trade_ai_insights FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view published trade_ai_insights" ON public.trade_ai_insights FOR SELECT TO public USING (is_published = true);

-- 10) data_import_batches
CREATE TABLE public.data_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text UNIQUE NOT NULL,
  source_name text NOT NULL,
  source_url text,
  import_type text NOT NULL DEFAULT 'raw_import',
  records_received integer NOT NULL DEFAULT 0,
  records_inserted integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_log text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
ALTER TABLE public.data_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage data_import_batches" ON public.data_import_batches FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 11) dashboard_settings
CREATE TABLE public.dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage dashboard_settings" ON public.dashboard_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view dashboard_settings" ON public.dashboard_settings FOR SELECT TO public USING (true);

-- Seed HS sector mappings
INSERT INTO public.hs_sector_mapping (hs_code_prefix, sector_name, sector_group, display_order) VALUES
('27', 'Energy', 'Primary', 1),
('84', 'Machinery & Equipment', 'Industrial', 2),
('85', 'Technology & Electronics', 'Industrial', 3),
('87', 'Vehicles', 'Transport', 4),
('28', 'Chemicals', 'Chemical', 5),
('29', 'Chemicals', 'Chemical', 5),
('30', 'Pharmaceuticals', 'Health', 6),
('01', 'Food & Beverages', 'Consumer', 7),
('02', 'Food & Beverages', 'Consumer', 7),
('03', 'Food & Beverages', 'Consumer', 7),
('04', 'Food & Beverages', 'Consumer', 7),
('16', 'Food & Beverages', 'Consumer', 7),
('17', 'Food & Beverages', 'Consumer', 7),
('18', 'Food & Beverages', 'Consumer', 7),
('19', 'Food & Beverages', 'Consumer', 7),
('20', 'Food & Beverages', 'Consumer', 7),
('21', 'Food & Beverages', 'Consumer', 7),
('22', 'Food & Beverages', 'Consumer', 7),
('68', 'Construction Materials', 'Construction', 8),
('69', 'Construction Materials', 'Construction', 8),
('70', 'Construction Materials', 'Construction', 8),
('72', 'Construction Materials', 'Construction', 8),
('73', 'Construction Materials', 'Construction', 8),
('61', 'Consumer Goods', 'Consumer', 9),
('62', 'Consumer Goods', 'Consumer', 9),
('63', 'Consumer Goods', 'Consumer', 9),
('64', 'Consumer Goods', 'Consumer', 9),
('94', 'Consumer Goods', 'Consumer', 9),
('95', 'Consumer Goods', 'Consumer', 9);

-- Seed key trade countries
INSERT INTO public.trade_countries (country_code, country_name, region_name, eu_member, priority_country, slug) VALUES
('GR', 'Greece', 'EU', true, true, 'greece'),
('IT', 'Italy', 'EU', true, true, 'italy'),
('DE', 'Germany', 'EU', true, true, 'germany'),
('GB', 'United Kingdom', 'Europe', false, true, 'united-kingdom'),
('CN', 'China', 'Asia', false, true, 'china'),
('IL', 'Israel', 'Middle East', false, true, 'israel'),
('NL', 'Netherlands', 'EU', true, true, 'netherlands'),
('FR', 'France', 'EU', true, false, 'france'),
('ES', 'Spain', 'EU', true, false, 'spain'),
('US', 'United States', 'Americas', false, true, 'united-states'),
('RU', 'Russia', 'Europe', false, false, 'russia'),
('TR', 'Turkey', 'Middle East', false, false, 'turkey'),
('KR', 'South Korea', 'Asia', false, false, 'south-korea'),
('JP', 'Japan', 'Asia', false, false, 'japan'),
('EG', 'Egypt', 'Africa', false, false, 'egypt'),
('LB', 'Lebanon', 'Middle East', false, false, 'lebanon'),
('RO', 'Romania', 'EU', true, false, 'romania'),
('BG', 'Bulgaria', 'EU', true, false, 'bulgaria'),
('PL', 'Poland', 'EU', true, false, 'poland'),
('BE', 'Belgium', 'EU', true, false, 'belgium');

-- Seed dashboard settings
INSERT INTO public.dashboard_settings (key, value_json) VALUES
('featured_countries', '["GR","IT","DE","GB","CN","US","IL","NL"]'::jsonb),
('featured_sectors', '["Energy","Machinery & Equipment","Vehicles","Technology & Electronics","Food & Beverages"]'::jsonb),
('default_reporting_month', '{"year":2025,"month":12}'::jsonb),
('homepage_kpi_labels', '{"total_imports":"Total Imports","mom_growth":"MoM Growth","yoy_growth":"YoY Growth","top_country":"Top Partner","top_sector":"Top Sector"}'::jsonb),
('chart_visibility', '{"trend_line":true,"country_table":true,"sector_bars":true,"eu_donut":true,"insight_block":true}'::jsonb);
