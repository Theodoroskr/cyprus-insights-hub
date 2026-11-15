CREATE OR REPLACE FUNCTION public.track_banner(_id uuid, _kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _kind = 'impression' THEN
    UPDATE public.banner_placements SET impressions = impressions + 1 WHERE id = _id AND is_active;
  ELSIF _kind = 'click' THEN
    UPDATE public.banner_placements SET clicks = clicks + 1 WHERE id = _id AND is_active;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.track_banner(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_banner(uuid, text) TO anon, authenticated;