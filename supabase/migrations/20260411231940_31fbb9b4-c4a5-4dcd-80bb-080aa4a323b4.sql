
CREATE TABLE public.regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'FileText',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'In Force',
  status_color text NOT NULL DEFAULT 'emerald',
  effective_date text NOT NULL,
  impact text NOT NULL,
  applies_to text[] NOT NULL DEFAULT '{}',
  key_body text NOT NULL,
  hub_section text NOT NULL DEFAULT 'fintech',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active regulations"
ON public.regulations FOR SELECT TO public
USING (active = true);

CREATE POLICY "Admins can manage regulations"
ON public.regulations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_regulations_updated_at
BEFORE UPDATE ON public.regulations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.regulations (name, icon, description, status, status_color, effective_date, impact, applies_to, key_body, hub_section, sort_order) VALUES
('MiCA', 'FileText', 'Markets in Crypto-Assets Regulation', 'In Force', 'emerald', '30 Dec 2024', 'CASPs must obtain CySEC authorisation. Stablecoin issuers face reserve and disclosure requirements. Transitional period ends June 2025.', ARRAY['Crypto Exchanges', 'Wallet Providers', 'Token Issuers', 'Stablecoin Issuers'], 'CySEC / ESMA', 'fintech', 1),
('EU AML Package', 'Shield', '6th Anti-Money Laundering Directive + AMLA', 'Transposing', 'amber', 'Jul 2025 (AMLA operational)', 'New EU-wide AML Authority (AMLA) in Frankfurt. Harmonised CDD rules, beneficial ownership registers, and €10K cash payment cap across the EU.', ARRAY['Banks', 'Payment Firms', 'CASPs', 'Lawyers & Accountants'], 'AMLA / CBC / MOKAS', 'fintech', 2),
('DORA', 'Server', 'Digital Operational Resilience Act', 'In Force', 'emerald', '17 Jan 2025', 'Financial entities must implement ICT risk management frameworks, incident reporting, digital resilience testing, and third-party risk oversight for critical ICT providers.', ARRAY['Banks', 'Insurers', 'Investment Firms', 'ICT Providers'], 'CySEC / CBC / EBA', 'fintech', 3),
('NIS2', 'Scale', 'Network and Information Security Directive', 'Transposing', 'amber', '17 Oct 2024 (deadline passed)', 'Expanded scope covers financial services, cloud providers, and digital infrastructure. Mandatory incident reporting within 24h, board-level accountability for cybersecurity.', ARRAY['Essential Services', 'Digital Infrastructure', 'Cloud/DNS Providers', 'Financial Sector'], 'DIPA / DSA Cyprus', 'fintech', 4);
