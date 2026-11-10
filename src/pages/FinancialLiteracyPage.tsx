import { useT } from "@/lib/finlitI18n";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FinLitLayout } from "@/components/finlit/FinLitLayout";
import { MODULE_ICONS } from "@/components/finlit/FinLitNav";
import { StatCard, useFinLitFindings, useFinLitStats } from "@/components/finlit/useFinLitStats";
import { ScoreSnapshot } from "@/components/finlit/ScoreSnapshot";
import { TrendChart, CompareBars } from "@/components/finlit/SnapshotCharts";
import { FINLIT_GROUPS, LEGACY_ANCHORS, moduleByKey } from "@/lib/finlitModules";

export default function FinancialLiteracyPage() {
  const t = useT();
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { const to = LEGACY_ANCHORS[hash.replace("#", "")]; if (to) navigate(to, { replace: true }); }, [hash, navigate]);
  const s = useFinLitStats();
  const f = useFinLitFindings();
  const headline = (f.data ?? []).filter((x) => x.publisher?.startsWith("OECD") && !x.breakdown_dimension);
  const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl md:text-2xl font-serif font-semibold">{children}</h2>;
  return (
    <FinLitLayout moduleKey="overview" title={t("Financial Literacy in Cyprus — Survey Results, Household Finances & Free Lessons")}
      description={t("How financially literate are adults in Cyprus? OECD and Central Bank survey results, Eurostat household and price figures, free calculators and lessons.")}
      intro={t("What adults in Cyprus know about money, the household finances behind it, and free tools to learn more. Every figure shows its publisher and year.")}>
      {(lang) => <>
        <section className="space-y-4">
          <H2>{lang === "el" ? "Πόσο καλά γνωρίζει η Κύπρος τα οικονομικά;" : "How money-savvy is Cyprus?"}</H2>
          {f.isLoading ? <p className="text-muted-foreground">{t("Loading…")}</p> : <ScoreSnapshot findings={headline} />}
        </section>

        <section className="space-y-4">
          <H2>{lang === "el" ? "Τα οικονομικά των νοικοκυριών σήμερα" : "Household finances today"}</H2>
          {!s.isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(["saving_rate", "unexpected_expenses", "hicp_all", "cbc_rate_mortgage"]).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}
        </section>

        {!s.isLoading && <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <H2>{lang === "el" ? "Κύπρος και Ευρώπη με τον χρόνο" : "Cyprus vs Europe over time"}</H2>
            <TrendChart lang={lang} obs={s.obs} datasets={s.pick(["hicp_all", "hicp_food", "cbc_rate_mortgage", "cbc_rate_deposit", "saving_rate"])} />
          </div>
          <div className="space-y-3">
            <H2>{lang === "el" ? "Με μια ματιά" : "At a glance"}</H2>
            <CompareBars lang={lang} obs={s.obs} datasets={s.pick(["saving_rate", "unexpected_expenses", "hicp_all"])} />
          </div>
        </section>}

        <section className="space-y-4">
          <H2>{lang === "el" ? "Εξερευνήστε τις ενότητες" : "Explore the sections"}</H2>
          <div className="grid gap-4 md:grid-cols-3">
            {FINLIT_GROUPS.map((g) => (
              <div key={g.key} className="rounded-2xl border bg-card p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{lang === "el" ? g.el : g.en}</p>
                <ul className="space-y-1">{g.keys.map((k) => { const m = moduleByKey(k); const I = MODULE_ICONS[m.icon]; return (
                  <li key={k}><Link to={m.path} title={lang === "el" ? m.el : m.en} className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><I className="h-4 w-4" aria-hidden /></span>
                    <span className="min-w-0"><span className="block font-medium leading-tight">{lang === "el" ? m.short_el : m.short_en}</span><span className="block text-xs text-muted-foreground line-clamp-1">{t(m.blurb)}</span></span>
                  </Link></li>); })}</ul>
              </div>
            ))}
          </div>
        </section>
      </>}
    </FinLitLayout>
  );
}
