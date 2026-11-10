import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AcademyCrumbs, LangSwitch } from "@/components/academy/AcademyChrome";
import { LEVEL_LABEL, T, pick, useAcademyLang, type Lesson, type Programme } from "@/lib/academy";

export default function ProgrammePage() {
  const { programme: slug } = useParams();
  const [lang, setLang] = useAcademyLang();
  const q = useQuery({
    queryKey: ["academy-programme", slug],
    queryFn: async () => {
      const { data: p, error } = await supabase.from("academy_programmes").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      if (!p) return null;
      const { data: ls, error: e } = await supabase.from("academy_lessons").select("id, slug, title_en, title_el, summary_en, summary_el, minutes, sort_order").eq("programme_id", p.id).order("sort_order");
      if (e) throw e;
      return { p: p as Programme, lessons: (ls ?? []) as Lesson[] };
    },
  });
  const p = q.data?.p;
  const objectives = p ? (lang === "el" && p.objectives_el.length ? p.objectives_el : p.objectives_en) : [];
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      {p && <SEOHead title={`${p.title_en} — Free Course | Financial Literacy Academy`} description={`${p.summary_en} ${p.title_el}.`}
        path={`/financial-literacy/academy/${p.slug}`}
        jsonLd={{ "@context": "https://schema.org", "@type": "Course", name: p.title_en, alternateName: p.title_el, description: p.summary_en, inLanguage: ["en", "el"], isAccessibleForFree: true,
          educationalLevel: p.level, provider: { "@type": "Organization", name: "BusinessHub.cy", url: "https://businesshub.cy" },
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${(q.data?.lessons ?? []).reduce((a, l) => a + l.minutes, 0)}M` } }} />}
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3"><AcademyCrumbs lang={lang} items={p ? [{ label: pick(p, "title", lang) }] : []} /><LangSwitch lang={lang} setLang={setLang} /></div>
        {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : !p ? (
          <Card><CardContent className="p-6 space-y-3"><p>{lang === "el" ? "Το πρόγραμμα δεν βρέθηκε." : "This programme isn't available."}</p><Button asChild variant="outline"><Link to="/financial-literacy/academy">{T.back[lang]}</Link></Button></CardContent></Card>
        ) : <>
          <header className="space-y-3">
            <div className="flex items-center gap-2"><span className="h-10 w-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-serif font-bold text-lg">{p.code}</span><Badge variant="outline">{LEVEL_LABEL[p.level]?.[lang]}</Badge>
              {p.status !== "published" && <Badge variant="destructive">{p.status}</Badge>}</div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold">{pick(p, "title", lang)}</h1>
            <p className="text-lg text-muted-foreground">{pick(p, "summary", lang)}</p>
            <p className="text-sm"><span className="text-muted-foreground">{T.audience[lang]}:</span> {pick(p, "audience", lang)}</p>
          </header>
          {(p.notice_en || p.notice_el) && <p className="rounded-md border border-l-4 border-l-primary bg-muted/40 p-3 text-sm flex gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />{pick(p, "notice", lang)}</p>}
          {objectives.length > 0 && <section className="space-y-2"><h2 className="text-lg font-serif font-semibold">{T.objectives[lang]}</h2>
            <ul className="grid sm:grid-cols-2 gap-2">{objectives.map((o) => <li key={o} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden />{o}</li>)}</ul></section>}
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold">{q.data!.lessons.length} {T.lessons[lang]}</h2>
            <ol className="space-y-2">
              {q.data!.lessons.map((l, i) => (
                <li key={l.id}><Link to={`/financial-literacy/academy/${p.slug}/${l.slug}`} className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="h-8 w-8 rounded-full bg-muted grid place-items-center text-sm font-semibold shrink-0">{i + 1}</span>
                  <span className="flex-1"><span className="font-medium block">{pick(l, "title", lang)}</span><span className="text-sm text-muted-foreground">{pick(l, "summary", lang)}</span></span>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1 shrink-0"><Clock className="h-3.5 w-3.5" aria-hidden />{l.minutes} {T.minutes[lang]}</span>
                </Link></li>
              ))}
            </ol>
          </section>
          {q.data!.lessons[0] && <Button asChild size="lg"><Link to={`/financial-literacy/academy/${p.slug}/${q.data!.lessons[0].slug}`}>{T.start[lang]}</Link></Button>}
        </>}
      </main>
      <Footer />
    </div>
  );
}
