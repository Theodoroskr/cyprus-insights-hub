
CREATE TABLE public.country_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name text NOT NULL,
  country_code text NOT NULL,
  risk_score numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'medium',
  fatf_status text DEFAULT 'Compliant',
  key_concerns text[] DEFAULT '{}',
  region text,
  last_updated date DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code)
);

ALTER TABLE public.country_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active country risk scores"
ON public.country_risk_scores FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage country risk scores"
ON public.country_risk_scores FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_country_risk_scores_updated_at
BEFORE UPDATE ON public.country_risk_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data (Basel AML Index inspired)
INSERT INTO public.country_risk_scores (country_name, country_code, risk_score, risk_level, fatf_status, key_concerns, region) VALUES
('Myanmar', 'MM', 8.60, 'very_high', 'FATF Blacklist', ARRAY['Lack of AML framework', 'Military governance', 'Sanctions risk'], 'Asia'),
('Haiti', 'HT', 8.15, 'very_high', 'FATF Greylist', ARRAY['Weak governance', 'Corruption', 'Limited enforcement'], 'Caribbean'),
('Democratic Republic of Congo', 'CD', 7.89, 'high', 'Monitored', ARRAY['Conflict minerals', 'Weak institutions', 'Corruption'], 'Africa'),
('Mozambique', 'MZ', 7.72, 'high', 'FATF Greylist', ARRAY['Terrorism financing', 'Weak AML controls', 'Illicit flows'], 'Africa'),
('Madagascar', 'MG', 7.55, 'high', 'Monitored', ARRAY['Weak governance', 'Limited AML enforcement', 'Corruption'], 'Africa'),
('Cambodia', 'KH', 7.36, 'high', 'FATF Greylist', ARRAY['Casino sector risks', 'Human trafficking', 'Weak enforcement'], 'Asia'),
('Senegal', 'SN', 7.20, 'high', 'Monitored', ARRAY['Terrorism financing', 'Informal economy', 'Cross-border risks'], 'Africa'),
('Tanzania', 'TZ', 7.10, 'high', 'Monitored', ARRAY['Informal economy', 'Cross-border flows', 'Limited capacity'], 'Africa'),
('Nigeria', 'NG', 6.95, 'high', 'FATF Greylist', ARRAY['Terrorism financing', 'Fraud', 'Oil sector corruption'], 'Africa'),
('Pakistan', 'PK', 6.80, 'high', 'FATF Greylist', ARRAY['Terrorism financing', 'Informal hawala', 'Border risks'], 'Asia'),
('Turkey', 'TR', 6.50, 'medium_high', 'FATF Greylist', ARRAY['Terrorism financing', 'Sanctions evasion', 'Trade-based ML'], 'Europe/Asia'),
('UAE', 'AE', 6.10, 'medium_high', 'FATF Greylist', ARRAY['Free trade zones', 'Real estate ML', 'Gold trade'], 'Middle East'),
('Russia', 'RU', 6.30, 'medium_high', 'Sanctioned', ARRAY['Sanctions', 'State corruption', 'Capital flight'], 'Europe/Asia'),
('South Africa', 'ZA', 5.80, 'medium', 'FATF Greylist', ARRAY['State capture legacy', 'Cross-border flows', 'Crypto risks'], 'Africa'),
('China', 'CN', 5.50, 'medium', 'Monitored', ARRAY['Capital controls evasion', 'Trade-based ML', 'State opacity'], 'Asia'),
('India', 'IN', 5.20, 'medium', 'Compliant', ARRAY['Informal economy', 'Shell companies', 'Cash intensity'], 'Asia'),
('Brazil', 'BR', 5.00, 'medium', 'Compliant', ARRAY['Corruption', 'Cross-border flows', 'Informal economy'], 'South America'),
('Cyprus', 'CY', 3.80, 'low', 'Compliant', ARRAY['Improved AML framework', 'EU-regulated', 'Moneyval assessed'], 'Europe'),
('United Kingdom', 'GB', 3.50, 'low', 'Compliant', ARRAY['Beneficial ownership gaps', 'London property ML', 'Crypto adoption'], 'Europe'),
('Germany', 'DE', 3.30, 'low', 'Compliant', ARRAY['Real estate sector', 'Cash intensity', 'Regulatory gaps'], 'Europe'),
('United States', 'US', 3.20, 'low', 'Compliant', ARRAY['Shell companies', 'Real estate ML', 'Complex structures'], 'North America'),
('Luxembourg', 'LU', 2.80, 'low', 'Compliant', ARRAY['Investment fund risks', 'Cross-border flows', 'Tax structures'], 'Europe'),
('Singapore', 'SG', 2.50, 'low', 'Compliant', ARRAY['Regional hub risks', 'Trade-based ML', 'Fintech growth'], 'Asia'),
('Finland', 'FI', 1.90, 'very_low', 'Compliant', ARRAY['Low risk overall', 'Strong AML framework', 'Transparent governance'], 'Europe'),
('Estonia', 'EE', 2.20, 'very_low', 'Compliant', ARRAY['Crypto licensing reforms', 'E-residency oversight', 'Nordic cooperation'], 'Europe');
