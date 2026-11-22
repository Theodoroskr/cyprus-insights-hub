CREATE TABLE public.integrity_source_health (
  slug text PRIMARY KEY,
  url_override text,
  manual_only boolean NOT NULL DEFAULT false,
  last_status text NOT NULL DEFAULT 'unknown',
  last_http_code integer,
  last_error text,
  last_found integer,
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrity_source_health TO authenticated;
GRANT ALL ON public.integrity_source_health TO service_role;
ALTER TABLE public.integrity_source_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage integrity source health" ON public.integrity_source_health
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));