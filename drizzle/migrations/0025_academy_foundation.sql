CREATE TABLE public.academy_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  code text NOT NULL DEFAULT '',
  title_en text NOT NULL, title_el text NOT NULL DEFAULT '',
  summary_en text NOT NULL DEFAULT '', summary_el text NOT NULL DEFAULT '',
  audience_en text NOT NULL DEFAULT '', audience_el text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'beginner',
  objectives_en text[] NOT NULL DEFAULT '{}', objectives_el text[] NOT NULL DEFAULT '{}',
  notice_en text, notice_el text,
  status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES public.academy_programmes(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title_en text NOT NULL, title_el text NOT NULL DEFAULT '',
  summary_en text NOT NULL DEFAULT '', summary_el text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '', body_el text NOT NULL DEFAULT '',
  objectives_en text[] NOT NULL DEFAULT '{}', objectives_el text[] NOT NULL DEFAULT '{}',
  level text NOT NULL DEFAULT 'beginner',
  minutes integer NOT NULL DEFAULT 5,
  calculator text,
  stat_codes text[] NOT NULL DEFAULT '{}',
  resource_url text,
  status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programme_id, slug)
);
CREATE TABLE public.academy_lesson_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.academy_programmes, public.academy_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_programmes, public.academy_lessons TO authenticated;
GRANT SELECT ON public.academy_lesson_revisions TO authenticated;
GRANT ALL ON public.academy_programmes, public.academy_lessons, public.academy_lesson_revisions TO service_role;

ALTER TABLE public.academy_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_revisions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.academy_validate_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','review','published','archived') THEN RAISE EXCEPTION 'Invalid status: %', NEW.status; END IF;
  IF NEW.level NOT IN ('beginner','intermediate','advanced') THEN RAISE EXCEPTION 'Invalid level: %', NEW.level; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.academy_log_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.academy_lesson_revisions(lesson_id, snapshot, changed_by) VALUES (OLD.id, to_jsonb(OLD), auth.uid());
  RETURN NEW;
END $$;

CREATE TRIGGER academy_programmes_validate BEFORE INSERT OR UPDATE ON public.academy_programmes FOR EACH ROW EXECUTE FUNCTION public.academy_validate_status();
CREATE TRIGGER academy_lessons_validate BEFORE INSERT OR UPDATE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.academy_validate_status();
CREATE TRIGGER academy_programmes_updated BEFORE UPDATE ON public.academy_programmes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER academy_lessons_updated BEFORE UPDATE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER academy_lessons_revision AFTER UPDATE ON public.academy_lessons FOR EACH ROW
  WHEN (OLD.body_en IS DISTINCT FROM NEW.body_en OR OLD.body_el IS DISTINCT FROM NEW.body_el OR OLD.title_en IS DISTINCT FROM NEW.title_en OR OLD.title_el IS DISTINCT FROM NEW.title_el OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.academy_log_revision();

CREATE POLICY "Public reads published programmes" ON public.academy_programmes FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (publish_at IS NULL OR publish_at <= now()));
CREATE POLICY "Admins manage programmes" ON public.academy_programmes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public reads published lessons" ON public.academy_lessons FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (publish_at IS NULL OR publish_at <= now())
    AND EXISTS (SELECT 1 FROM public.academy_programmes p WHERE p.id = programme_id AND p.status = 'published' AND (p.publish_at IS NULL OR p.publish_at <= now())));
CREATE POLICY "Admins manage lessons" ON public.academy_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read revisions" ON public.academy_lesson_revisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX academy_lessons_programme_idx ON public.academy_lessons(programme_id, sort_order);