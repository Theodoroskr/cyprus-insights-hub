import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { useAcademyLang, type Lang } from "@/lib/academy";
import { EL } from "@/lib/explore";

export function ExploreShell({ title, children, masthead }: { title?: string; masthead?: boolean; children: (lang: Lang) => ReactNode }) {
  const [lang, setLang] = useAcademyLang();
  return (
    <HubLayout brand="businesshub">
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className={`${masthead ? "py-8 text-center" : "py-5"}`}>
            <p className="section-label mb-2 text-secondary">
              <Link to="/explore">{EL(lang, "TourismHub.cy · Explore Cyprus", "TourismHub.cy · Εξερευνήστε την Κύπρο")}</Link>
            </p>
            <h1 className={`${masthead ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"} font-bold text-foreground font-serif tracking-tight`}>
              {title ?? EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}
            </h1>
            {masthead && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
                {EL(lang, "Destinations, attractions and experiences — every practical detail checked against an official source.", "Προορισμοί, αξιοθέατα και εμπειρίες — κάθε πρακτική πληροφορία ελεγμένη από επίσημη πηγή.")}
              </p>
            )}
            <div className={`mt-3 flex ${masthead ? "justify-center" : ""}`}><LangSwitch lang={lang} setLang={setLang} /></div>
          </div>
        </div>
      </section>
      {children(lang)}
      <section className="py-6 border-t border-border">
        <p className="container mx-auto px-4 text-xs text-muted-foreground text-center">
          {EL(lang, "Hours and prices can change. Always check the official page before you visit.", "Ωράρια και τιμές μπορεί να αλλάξουν. Ελέγξτε πάντα την επίσημη σελίδα πριν την επίσκεψη.")}
        </p>
      </section>
    </HubLayout>
  );
}
