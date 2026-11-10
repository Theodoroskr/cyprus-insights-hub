import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, Clock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Education } from "@/components/finlit/EducationAndMethod";
import { FinLitNav } from "@/components/finlit/FinLitNav";
import { AcademyCrumbs, LangSwitch } from "@/components/academy/AcademyChrome";
import { LessonStats } from "@/components/academy/LessonStats";
import { LEVEL_LABEL, T, pick, useAcademyLang, type Lesson, type Programme } from "@/lib/academy";

export default function AcademyPage() {
  const [lang, setLang] = useAcademyLang();
  const q = useQuery({
    queryKey: ["academy-public"],
    queryFn: async () => {
      const [p, l] = await Promise.all([
        supabase.from("academy_programmes").select("*").eq("status", "published").order("sort_order"),
        supabase.from("academy_lessons").select("id, programme_id, minutes").eq("status", "published"),
      ]);
      if (p.error) throw p.error; if (l.error) throw l.error;
      return { programmes: (p.data ?? []) as Programme[], lessons: (l.data ?? []) as Pick<Lesson, "id" | "programme_id" | "minutes">[] };
    },
  });
  const programmes = q.data?.programmes ?? [];
  const levels = ["beginner", "intermediate", "advanced"].filter((lv) => programmes.some((p) => p.level === lv));
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <FinLitNav lang={lang} />
      <SEOHead title="Financial Literacy Academy — Free Financial Education Cyprus | BusinessHub"
        description="Free financial literacy courses in Cyprus, in English and Greek: money management, responsible borrowing, digital safety, saving and investing, and finance for SMEs. Δωρεάν χρηματοοικονομική εκπαίδευση."
        path="/financial-literacy/academy"
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Financial Literacy", href: "/financial-literacy" }, { name: "Academy", href: "/financial-literacy/academy" }]}
        jsonLd={{ "@context": "https://schema.org", "@type": "ItemList", name: "Financial Literacy Academy", alternateName: "Ακαδημία Χρηματοοικονομικού Αλφαβητισμού",
          itemListElement: programmes.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "Course", name: p.title_en, description: p.summary_en, inLanguage: ["en", "el"], isAccessibleForFree: true,
            url: `https://businesshub.cy/financial-literacy/academy/${p.slug}`, provider: { "@type": "Organization", name: "BusinessHub.cy", url: "https://businesshub.cy" } } })) }} />
      <main className="container mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3"><AcademyCrumbs lang={lang} items={[]} /><LangSwitch lang={lang} setLang={setLang} /></div>
        <header className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10 space-y-3">
          <Badge variant="secondary">{T.free[lang]}</Badge>
          <h1 className="text-3xl md:text-5xl font-serif font-bold">{T.academy[lang]}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{lang === "el"
            ? "Σύντομα, πρακτικά μαθήματα για τα χρήματα της καθημερινότητας, τον δανεισμό, την ψηφιακή ασφάλεια, την αποταμίευση και τα οικονομικά των επιχειρήσεων — με επίσημα στοιχεία για την Κύπρο."
            : "Short, practical lessons on everyday money, borrowing, staying safe online, saving and investing, and business finance — with official Cyprus figures alongside."}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" aria-hidden />{lang === "el"
            ? "Πρωτότυπο εκπαιδευτικό υλικό του BusinessHub. Δεν αποτελεί οικονομική συμβουλή ούτε επαγγελματική πιστοποίηση."
            : "Original BusinessHub educational content. Not financial advice and not a professional qualification."}</p>
        </header>

        {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : !programmes.length ? (
          <Card><CardContent className="p-6 text-muted-foreground">{T.empty[lang]}</CardContent></Card>
        ) : levels.map((lv) => (
          <section key={lv} className="space-y-3" aria-labelledby={`lv-${lv}`}>
            <h2 id={`lv-${lv}`} className="text-2xl font-serif font-semibold">{LEVEL_LABEL[lv][lang]}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programmes.filter((p) => p.level === lv).map((p) => {
                const ls = (q.data?.lessons ?? []).filter((l) => l.programme_id === p.id);
                const mins = ls.reduce((a, l) => a + l.minutes, 0);
                return (
                  <Link key={p.id} to={`/financial-literacy/academy/${p.slug}`} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                    <Card className="h-full transition-shadow group-hover:shadow-lg"><CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2"><span className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-serif font-bold">{p.code}</span>
                        <Badge variant="outline">{LEVEL_LABEL[p.level]?.[lang]}</Badge></div>
                      <h3 className="text-xl font-serif font-semibold group-hover:underline">{pick(p, "title", lang)}</h3>
                      <p className="text-sm text-muted-foreground">{pick(p, "summary", lang)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-3"><span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden />{ls.length} {T.lessons[lang]}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />~{mins} {T.minutes[lang]}</span></p>
                      <p className="text-xs"><span className="text-muted-foreground">{T.audience[lang]}:</span> {pick(p, "audience", lang)}</p>
                    </CardContent></Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-semibold">{lang === "el" ? "Βασικές γνώσεις" : "Money basics"}</h2>
          <Education />
        </section>

        <LessonStats codes={["hicp_all", "saving_rate", "unexpected_expenses"]} title={lang === "el" ? "Τα οικονομικά των νοικοκυριών στην Κύπρο" : "Cyprus household finances in numbers"} />
      </main>
      <Footer />
    </div>
  );
}
