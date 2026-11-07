DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile or admins" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.protect_profile_tier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.tier := 'free';
  ELSIF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Membership tier can only be changed by an administrator';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_profile_tier ON public.profiles;
CREATE TRIGGER trg_protect_profile_tier BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_tier();

DROP POLICY IF EXISTS "Admins can delete banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banner images" ON storage.objects;
CREATE POLICY "Admins can delete banner images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update banner images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can upload banner images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

REVOKE SELECT (contact_email) ON public.regulated_entities FROM anon, authenticated;