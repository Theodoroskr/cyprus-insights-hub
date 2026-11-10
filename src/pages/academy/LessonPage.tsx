import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Clock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculators, type CalculatorKey } from "@/components/finlit/Calculators";
import { FinLitNav } from "@/components/finlit/FinLitNav";
import { AcademyCrumbs, LangSwitch } from "@/components/academy/AcademyChrome";
import { LessonStats } from "@/components/academy/LessonStats";
import { T, hasGreek, pick, useAcademyLang, type Lesson, type Programme } from "@/lib/academy";

const CALCS: CalculatorKey[] = ["budget", "goal", "compound", "loan", "inflation", "emergency"];

export default function LessonPage() {
  const { programme: pslug, lesson: lslug } = useParams();
  const [lang, setLang] = useAcademyLang();
  const q = useQuery({
    queryKey: ["academy-lesson", pslug, lslug],
    queryFn: async () => {
      const { data: p, error } = await supabase.from("academy_programmes").select("*").eq("slug", pslug!).maybeSingle();
      if (error) throw error; if (!p) return null;
      const { data: ls, error: e } = await supabase.from("academy_lessons").select("*").eq("programme_id", p.id).order("sort_order");
      if (e) throw e;
      return { p: p as Programme, lessons: (ls ?? []) as Lesson[] };
    },
  });
  const lessons = q.data?.lessons ?? [];
  const idx = lessons.findIndex((l) => l.slug === lslug);
  const l = lessons[idx]; const p = q.data?.p;
  const prev = lessons[idx - 1]; const next = lessons[idx + 1];
  const greekMissing = lang === "el" && l && !hasGreek(l, "body");
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <FinLitNav lang={lang} />
      {p && l && <SEOHead title={`${l.title_en} — ${p.title_en} | Financial Literacy Academy`} description={`${l.summary_en} ${l.title_el}.`}
        path={`/financial-literacy/academy/${p.slug}/${l.slug}`}
        jsonLd={{ "@context": "https://schema.org", "@type": "LearningResource", name: l.title_en, alternateName: l.title_el, description: l.summary_en, inLanguage: ["en", "el"], isAccessibleForFree: true,
          timeRequired: `PT${l.minutes}M`, learningResourceType: "Lesson", isPartOf: { "@type": "Course", name: p.title_en, url: `https://businesshub.cy/financial-literacy/academy/${p.slug}` },
          provider: { "@type": "Organization", name: "BusinessHub.cy" } }} />}
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AcademyCrumbs lang={lang} items={p ? [{ label: pick(p, "title", lang), to: `/financial-literacy/academy/${p.slug}` }, ...(l ? [{ label: pick(l, "title", lang) }] : [])] : []} />
          <LangSwitch lang={lang} setLang={setLang} />
        </div>
        {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : !p || !l ? (
          <Card><CardContent className="p-6 space-y-3"><p>{lang === "el" ? "Το μάθημα δεν βρέθηκε." : "This lesson isn't available."}</p><Button asChild variant="outline"><Link to="/financial-literacy/academy">{T.back[lang]}</Link></Button></CardContent></Card>
        ) : <>
          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">{lang === "el" ? "Μάθημα" : "Lesson"} {idx + 1} / {lessons.length} · <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{l.minutes} {T.minutes[lang]}</span>
              {l.status !== "published" && <Badge variant="destructive" className="ml-2">{l.status}</Badge>}</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold">{pick(l, "title", lang)}</h1>
            <p className="text-lg text-muted-foreground">{pick(l, "summary", lang)}</p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden><div className="h-full bg-primary" style={{ width: `${((idx + 1) / lessons.length) * 100}%` }} /></div>
          </header>
          {greekMissing && <p className="rounded-md bg-muted p-3 text-sm flex gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />{T.greekPending.el}</p>}
          {(p.notice_en || p.notice_el) && <p className="rounded-md border border-l-4 border-l-primary bg-muted/40 p-3 text-sm">{pick(p, "notice", lang)}</p>}
          <article className="prose max-w-none text-foreground prose-headings:font-serif prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary" lang={greekMissing ? "en" : lang}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{pick(l, "body", lang)}</ReactMarkdown>
          </article>
          {l.calculator && CALCS.includes(l.calculator as CalculatorKey) && <><Calculators only={l.calculator as CalculatorKey} /><p className="text-sm"><Link to="/financial-literacy/calculators" className="underline">{lang === "el" ? "Όλοι οι υπολογιστές" : "See all calculators"}</Link></p></>}
          <LessonStats codes={l.stat_codes ?? []} title={T.official[lang]} />
          {l.resource_url && <p className="text-sm"><a className="underline" href={l.resource_url} target="_blank" rel="noopener noreferrer">{lang === "el" ? "Υποστηρικτικό υλικό" : "Supporting resource"}</a></p>}
          <nav className="flex justify-between gap-3 pt-4 border-t" aria-label="Lesson navigation">
            {prev ? <Button asChild variant="outline"><Link to={`/financial-literacy/academy/${p.slug}/${prev.slug}`}><ArrowLeft className="h-4 w-4 mr-1" />{T.prev[lang]}</Link></Button> : <span />}
            {next ? <Button asChild><Link to={`/financial-literacy/academy/${p.slug}/${next.slug}`}>{T.next[lang]}<ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
              : <Button asChild variant="secondary"><Link to="/financial-literacy/academy">{T.back[lang]}</Link></Button>}
          </nav>
        </>}
      </main>
      <Footer />
    </div>
  );
}
