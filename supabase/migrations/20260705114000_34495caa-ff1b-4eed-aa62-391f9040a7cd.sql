
CREATE TABLE public.market_quotes (
  symbol text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'equity',
  value numeric NOT NULL,
  change_pct numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  source text,
  display_order int NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.market_quotes TO anon, authenticated;
GRANT ALL ON public.market_quotes TO service_role;

ALTER TABLE public.market_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market quotes are public"
  ON public.market_quotes FOR SELECT
  USING (true);

CREATE TRIGGER update_market_quotes_updated_at
  BEFORE UPDATE ON public.market_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the tickers we want to display (values will be overwritten by the scheduled job)
INSERT INTO public.market_quotes (symbol, name, category, value, currency, display_order) VALUES
  ('BOCH',    'Bank of Cyprus',            'equity',    0, 'EUR', 10),
  ('DEM',     'Demetra Holdings',          'equity',    0, 'EUR', 20),
  ('EUROBCY', 'Eurobank Cyprus',           'equity',    0, 'EUR', 30),
  ('ATL',     'Atlantic Insurance',        'equity',    0, 'EUR', 40),
  ('LUI',     'Louis PLC',                 'equity',    0, 'EUR', 50),
  ('KEO',     'KEO PLC',                   'equity',    0, 'EUR', 60),
  ('LOG',     'Logicom',                   'equity',    0, 'EUR', 70),
  ('CCC',     'CCC Tourist Enterprises',   'equity',    0, 'EUR', 80),
  ('EURUSD',  'EUR/USD',                   'fx',        0, 'USD', 200),
  ('BRENT',   'Brent Crude',               'commodity', 0, 'USD', 300),
  ('GOLD',    'Gold',                      'commodity', 0, 'USD', 310)
ON CONFLICT (symbol) DO NOTHING;
