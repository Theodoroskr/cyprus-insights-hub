CREATE TABLE public.regulatory_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label text NOT NULL,
  event text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  source_url text,
  sort_date date,
  active boolean NOT NULL DEFAULT true,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.regulatory_calendar TO anon;
GRANT SELECT ON public.regulatory_calendar TO authenticated;
GRANT ALL ON public.regulatory_calendar TO service_role;

ALTER TABLE public.regulatory_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active calendar entries"
  ON public.regulatory_calendar FOR SELECT
  TO anon, authenticated
  USING (active = true);

INSERT INTO public.regulatory_calendar (date_label, event, category, sort_date) VALUES
  ('Q2 2026', 'CySEC AML/CFT supervisory priorities update', 'AML', '2026-04-01'),
  ('Jul 2026', 'DORA — full compliance deadline for ICT third-party risk', 'DORA', '2026-07-01'),
  ('Sep 2026', 'MiCA — transitional period ends for existing CASPs', 'MiCA', '2026-09-01'),
  ('Oct 2026', 'CBC Annual Compliance Conference', 'General', '2026-10-01'),
  ('Q4 2026', 'NIS2 Directive — national transposition deadline', 'Cyber', '2026-10-01'),
  ('Jan 2027', 'EU AML Authority (AMLA) — operational start', 'AML', '2027-01-01');