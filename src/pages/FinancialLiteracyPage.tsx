import { useT, periodLabel } from "@/lib/finlitI18n";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FinLitLayout, RelatedModules } from "@/components/finlit/FinLitLayout";
import { StatCard, useFinLitFindings, useFinLitStats } from "@/components/finlit/useFinLitStats";
import { SurveyScores } from "@/components/finlit/SurveyScores";
import { FINLIT_MODULES, LEGACY_ANCHORS } from "@/lib/finlitModules";

export default function FinancialLiteracyPage() {
  const t = useT();
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { const to = LEGACY_ANCHORS[hash.replace("#", "")]; if (to) navigate(to, { replace: true }); }, [hash, navigate]);
  const s = useFinLitStats();
  const f = useFinLitFindings();
  const overall = (f.data ?? []).filter((x) => x.publisher?.startsWith("OECD") && !x.breakdown_dimension).slice(0, 4);
  return (
    <FinLitLayout moduleKey="overview" title={t("Financial Literacy in Cyprus — Survey Results, Household Finances & Free Lessons")}
      description={t("How financially literate are adults in Cyprus? OECD and Central Bank survey results, Eurostat household and price figures, free calculators and lessons.")}
      intro={t("What adults in Cyprus know about money, the household finances behind it, and free tools to learn more. Every figure shows its publisher and year.")}>
      {(lang) => <>
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">{lang === "el" ? "Βασικά στοιχεία" : "Headline figures"}</h2>
          {f.isLoading ? <p className="text-muted-foreground">{t("Loading…")}</p> : overall.length > 0 && <SurveyScores findings={overall} />}
          {!s.isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(["saving_rate", "unexpected_expenses", "hicp_all", "hicp_food"]).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}
        </section>
        <RelatedModules keys={FINLIT_MODULES.slice(1).map((m) => m.key)} lang={lang} title={lang === "el" ? "Ενότητες" : "Explore the sections"} />
      </>}
    </FinLitLayout>
  );
}
