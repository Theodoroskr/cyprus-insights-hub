import { ReactNode, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { HubMasthead } from "@/components/hub/HubMasthead";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { useAcademyLang, type Lang } from "@/lib/academy";
import { EL } from "@/lib/explore";

type Text = string | ((lang: Lang) => string);

/** Explore Cyprus chrome. English/Greek switch; `?lang=el` in a link opens the Greek version and the switch keeps the address in step. */
export function ExploreShell({ title, children, masthead }: { title?: Text; masthead?: boolean; children: (lang: Lang) => ReactNode }) {
  const [lang, setShared] = useAcademyLang();
  const [params, setParams] = useSearchParams();
  const urlLang = params.get("lang");
  useEffect(() => {
    if ((urlLang === "el" || urlLang === "en") && urlLang !== lang) setShared(urlLang);
  }, [urlLang]); // eslint-disable-line react-hooks/exhaustive-deps
  const setLang = (l: Lang) => {
    setShared(l);
    const p = new URLSearchParams(params);
    l === "el" ? p.set("lang", "el") : p.delete("lang");
    setParams(p, { replace: true });
  };
  const heading = typeof title === "function" ? title(lang) : title;
  return (
    <HubLayout brand="tourismhub" landing={masthead}>
      {masthead ? (
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <HubMasthead
              brand="tourismhub"
              kicker={EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}
              intro={EL(lang, "Destinations, attractions and experiences — every practical detail checked against an official source.", "Προορισμοί, αξιοθέατα και εμπειρίες — κάθε πρακτική πληροφορία ελεγμένη από επίσημη πηγή.")}
              links={[
                { label: EL(lang, "Tourism news", "Ειδήσεις τουρισμού"), href: "/explore/news" },
                { label: EL(lang, "Nicosia City & Countryside", "Λευκωσία — Πόλη και Ύπαιθρος"), href: "/explore/nicosia-countryside" },
                { label: EL(lang, "Conference venues", "Χώροι συνεδρίων"), href: "/explore/conference-venues" },
                { label: EL(lang, "Tourism statistics", "Στατιστικά τουρισμού"), href: "/tourism" },
              ]}
              extra={<LangSwitch lang={lang} setLang={setLang} />}
            />
          </div>
        </section>
      ) : (
      <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="h-[3px] bg-foreground" />
            <div className={`${masthead ? "py-8 text-center" : "py-5"}`}>
              <p className="section-label mb-2 text-secondary">
                <Link to="/explore">{EL(lang, "TourismHub.cy · Explore Cyprus", "TourismHub.cy · Εξερευνήστε την Κύπρο")}</Link>
              </p>
              <h1 className={`${masthead ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"} font-bold text-foreground font-serif tracking-tight`}>
                {heading ?? EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}
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
      )}
      {children(lang)}
      <section className="py-6 border-t border-border">
        <p className="container mx-auto px-4 text-xs text-muted-foreground text-center">
          {EL(lang, "Hours and prices can change. Always check the official page before you visit.", "Ωράρια και τιμές μπορεί να αλλάξουν. Ελέγξτε πάντα την επίσημη σελίδα πριν την επίσκεψη.")}
        </p>
      </section>
    </HubLayout>
  );
}
