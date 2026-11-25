CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT (_user_id = auth.uid() OR auth.uid() IS NULL AND coalesce(auth.role(), '') NOT IN ('anon','authenticated'))
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE IF NOT EXISTS public.banner_track_events (
  banner_id uuid NOT NULL,
  kind text NOT NULL,
  viewer_hash text NOT NULL,
  hour_bucket timestamptz NOT NULL,
  PRIMARY KEY (banner_id, kind, viewer_hash, hour_bucket)
);
GRANT ALL ON public.banner_track_events TO service_role;
ALTER TABLE public.banner_track_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS banner_track_events_hour_idx ON public.banner_track_events (hour_bucket);

CREATE OR REPLACE FUNCTION public.track_banner(_id uuid, _kind text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _hdrs json := nullif(current_setting('request.headers', true), '')::json;
  _ip text := coalesce(split_part(_hdrs->>'x-forwarded-for', ',', 1), _hdrs->>'x-real-ip', 'unknown');
  _viewer text := md5(_ip || '|' || coalesce(_hdrs->>'user-agent', ''));
  _n int;
BEGIN
  IF _kind NOT IN ('impression','click') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.banner_placements WHERE id = _id AND is_active) THEN RETURN; END IF;
  INSERT INTO public.banner_track_events(banner_id, kind, viewer_hash, hour_bucket)
  VALUES (_id, _kind, _viewer, date_trunc('hour', now()))
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT;
  IF _n = 0 THEN RETURN; END IF; -- same visitor already counted this hour
  IF _kind = 'impression' THEN
    UPDATE public.banner_placements SET impressions = impressions + 1 WHERE id = _id;
  ELSE
    UPDATE public.banner_placements SET clicks = clicks + 1 WHERE id = _id;
  END IF;
  DELETE FROM public.banner_track_events WHERE hour_bucket < now() - interval '2 days' AND random() < 0.01;
END $$;