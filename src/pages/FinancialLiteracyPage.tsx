import { useT } from "@/lib/finlitI18n";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FinLitLayout } from "@/components/finlit/FinLitLayout";
import { MODULE_ICONS } from "@/components/finlit/FinLitNav";
import { StatCard, useFinLitFindings, useFinLitStats } from "@/components/finlit/useFinLitStats";
import { ScoreSnapshot } from "@/components/finlit/ScoreSnapshot";
import { headlineFindings } from "@/lib/finlitHeadline";
import { TrendChart, CompareBars } from "@/components/finlit/SnapshotCharts";
import { FINLIT_GROUPS, LEGACY_ANCHORS, moduleByKey } from "@/lib/finlitModules";
import { FL_BG, FL_BORDER_SOFT, FL_HOVER_BG, FL_SOFT, FL_TEXT, FL_TINT, groupAccent, moduleAccent, type FlAccent } from "@/lib/finlitPalette";

export default function FinancialLiteracyPage() {
  const t = useT();
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { const to = LEGACY_ANCHORS[hash.replace("#", "")]; if (to) navigate(to, { replace: true }); }, [hash, navigate]);
  const s = useFinLitStats();
  const f = useFinLitFindings();
  const headline = headlineFindings(f.data ?? []);
  const H2 = ({ children, accent = 1, gradient = false }: { children: React.ReactNode; accent?: FlAccent; gradient?: boolean }) => (
    <h2 className="flex items-center gap-2.5 text-xl md:text-2xl font-serif font-semibold"><span aria-hidden className={`h-6 w-1.5 shrink-0 rounded-full ${gradient ? "bg-gradient-to-b from-finlit-1 via-finlit-3 to-finlit-2" : FL_BG[accent]}`} />{children}</h2>
  );
  return (
    <FinLitLayout moduleKey="overview" title={t("Financial Literacy in Cyprus — Survey Results, Household Finances & Free Lessons")}
      description={t("How financially literate are adults in Cyprus? OECD and Central Bank survey results, Eurostat household and price figures, free calculators and lessons.")}
      intro={t("What adults in Cyprus know about money, the household finances behind it, and free tools to learn more. Every figure shows its publisher and year.")}>
      {(lang) => <>
        <section className="space-y-4">
          <H2 accent={1}>{lang === "el" ? "Πόσο καλά γνωρίζει η Κύπρος τα οικονομικά;" : "How money-savvy is Cyprus?"}</H2>
          {f.isLoading ? <p className="text-muted-foreground">{t("Loading…")}</p> : <ScoreSnapshot findings={headline} />}
        </section>

        <section className="space-y-4">
          <H2 accent={5}>{lang === "el" ? "Τα οικονομικά των νοικοκυριών σήμερα" : "Household finances today"}</H2>
          {!s.isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(["saving_rate", "unexpected_expenses", "hicp_all", "cbc_rate_mortgage"]).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}
        </section>

        {!s.isLoading && <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <H2 accent={1}>{lang === "el" ? "Κύπρος και Ευρώπη με τον χρόνο" : "Cyprus vs Europe over time"}</H2>
            <TrendChart lang={lang} obs={s.obs} datasets={s.pick(["hicp_all", "hicp_food", "cbc_rate_mortgage", "cbc_rate_deposit", "saving_rate"])} />
          </div>
          <div className="space-y-3">
            <H2 accent={2}>{lang === "el" ? "Με μια ματιά" : "At a glance"}</H2>
            <CompareBars lang={lang} obs={s.obs} datasets={s.pick(["saving_rate", "unexpected_expenses", "hicp_all"])} />
          </div>
        </section>}

        <section className="space-y-4">
          <H2 gradient>{lang === "el" ? "Εξερευνήστε τις ενότητες" : "Explore the sections"}</H2>
          <div className="grid gap-4 md:grid-cols-3">
            {FINLIT_GROUPS.map((g) => { const ga = groupAccent(g.key); return (
              <div key={g.key} className={`rounded-2xl border ${FL_BORDER_SOFT[ga]} ${FL_TINT[ga]} p-4 space-y-2`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${FL_TEXT[ga]}`}>{lang === "el" ? g.el : g.en}</p>
                <ul className="space-y-1">{g.keys.map((k) => { const m = moduleByKey(k); const I = MODULE_ICONS[m.icon]; const ka = moduleAccent(k); return (
                  <li key={k}><Link to={m.path} title={lang === "el" ? m.el : m.en} className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-background">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${FL_SOFT[ka]} ${FL_TEXT[ka]} transition-colors ${FL_HOVER_BG[ka]} group-hover:text-background`}><I className="h-4 w-4" aria-hidden /></span>
                    <span className="min-w-0"><span className="block font-medium leading-tight">{lang === "el" ? m.short_el : m.short_en}</span><span className="block text-xs text-muted-foreground line-clamp-1">{t(m.blurb)}</span></span>
                  </Link></li>); })}</ul>
              </div>
            ); })}
          </div>
        </section>
      </>}
    </FinLitLayout>
  );
}
