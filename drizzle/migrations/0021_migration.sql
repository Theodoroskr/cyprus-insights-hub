CREATE TABLE public.indexnow_submissions (
  url text PRIMARY KEY,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status_code integer
);
GRANT SELECT ON public.indexnow_submissions TO authenticated;
GRANT ALL ON public.indexnow_submissions TO service_role;
ALTER TABLE public.indexnow_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read IndexNow submissions" ON public.indexnow_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX indexnow_submissions_submitted_at_idx ON public.indexnow_submissions (submitted_at DESC);