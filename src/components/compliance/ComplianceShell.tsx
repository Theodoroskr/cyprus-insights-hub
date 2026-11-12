import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { HubLayout } from "@/layouts/HubLayout";
import { SectionSponsorStrip } from "@/components/SectionSponsorStrip";
import { LangSwitch } from "@/components/academy/AcademyChrome";
import { useAcademyLang, type Lang } from "@/lib/academy";
import { ct } from "@/lib/compliance";

export const COMPLIANCE_SECTIONS = [
  { to: "/compliance", label: "Overview", end: true },
  { to: "/compliance/regulatory-updates", label: "Regulatory Updates" },
  { to: "/compliance/sanctions", label: "Sanctions & Country Risk" },
  { to: "/compliance/deadlines", label: "Deadlines & Consultations" },
  { to: "/compliance/guidance", label: "Guidance & Resources" },
];

interface Props {
  title: string;
  intro?: string;
  children: (lang: Lang) => ReactNode;
  /** Large masthead on the landing page only. */
  masthead?: boolean;
}

export function ComplianceShell({ title, intro, children, masthead }: Props) {
  const [lang, setLang] = useAcademyLang();
  return (
    <HubLayout brand="compliancehub">
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-[3px] bg-foreground" />
          <div className={`${masthead ? "py-6 text-center" : "py-5"} border-b border-border`}>
            <p className="section-label mb-2 text-secondary">{lang === "el" ? "Ρυθμιστική Πληροφόρηση & Διαχείριση Κινδύνου" : "Regulatory Intelligence & Risk Management"}</p>
            {masthead ? (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-serif tracking-tight">
                ComplianceHub<span className="text-secondary">.cy</span>
              </h1>
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif tracking-tight">{ct(title, lang)}</h1>
            )}
            {intro && <p className={`text-sm text-muted-foreground mt-2 max-w-2xl ${masthead ? "mx-auto" : ""}`}>{ct(intro, lang)}</p>}
            <div className={`mt-3 flex ${masthead ? "justify-center" : ""}`}>
              <LangSwitch lang={lang} setLang={setLang} />
            </div>
          </div>
        </div>
      </section>
      {masthead && <SectionSponsorStrip sectionKey="compliancehub" />}
      <nav aria-label="ComplianceHub sections" className="border-b border-border bg-card sticky top-14 z-40">
        <div className="container mx-auto px-4 flex overflow-x-auto">
          {COMPLIANCE_SECTIONS.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.end}
              className={({ isActive }) => `px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap border-b-2 transition-colors ${isActive ? "border-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {ct(s.label, lang)}
            </NavLink>
          ))}
        </div>
      </nav>
      {children(lang)}
      <section className="py-6 border-t border-border">
        <p className="container mx-auto px-4 text-xs text-muted-foreground text-center">{ct("Information is for monitoring purposes and is not legal advice. Always rely on the official document.", lang)}</p>
      </section>
    </HubLayout>
  );
}
