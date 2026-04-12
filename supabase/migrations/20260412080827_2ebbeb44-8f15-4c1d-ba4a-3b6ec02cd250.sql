CREATE TABLE public.kyb_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.directory_companies(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  company_reg_number text,
  buyer_email text NOT NULL,
  buyer_name text,
  buyer_company text,
  stripe_payment_intent_id text UNIQUE,
  stripe_session_id text UNIQUE,
  amount_eur numeric(10,2) DEFAULT 45.00,
  status text NOT NULL DEFAULT 'pending',
  report_url text,
  report_data jsonb,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  generated_at timestamptz,
  user_id uuid
);

CREATE INDEX ON public.kyb_reports(buyer_email);
CREATE INDEX ON public.kyb_reports(company_id);
CREATE INDEX ON public.kyb_reports(status);
CREATE INDEX ON public.kyb_reports(stripe_session_id);

ALTER TABLE public.kyb_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports" ON public.kyb_reports
  FOR SELECT USING (
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anyone can insert pending report" ON public.kyb_reports
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Admins manage all reports" ON public.kyb_reports
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Validation trigger instead of CHECK constraint for status
CREATE OR REPLACE FUNCTION public.validate_kyb_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','paid','generated','failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_kyb_status
  BEFORE INSERT OR UPDATE ON public.kyb_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_kyb_status();