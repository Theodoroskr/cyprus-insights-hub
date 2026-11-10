import { useT, periodLabel, sourceLabel } from "@/lib/finlitI18n";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinLitLayout } from "@/components/finlit/FinLitLayout";
import { SurveyScores } from "@/components/finlit/SurveyScores";
import { StatChart } from "@/components/finlit/StatChart";
import { Calculators, CALCULATOR_KEYS, type CalculatorKey } from "@/components/finlit/Calculators";
import { Methodology } from "@/components/finlit/EducationAndMethod";
import { BANKING, COST, CREDIT, HOUSEHOLD, StatCard, useFinLitFindings, useFinLitStats } from "@/components/finlit/useFinLitStats";
import { datasetSource, prettyStatPeriod } from "@/lib/eurostatView";

const Loading = () => { const t = useT(); return <p className="text-muted-foreground">{t("Loading…")}</p>; };
const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-serif font-semibold">{children}</h2>;

const DIM_LABEL: Record<string, string> = { gender: "By gender", age: "By age", income: "By income" };

function Breakdowns({ findings }: { findings: import("@/components/finlit/useFinLitStats").Finding[] }) {
  const t = useT();
  const rows = findings.filter((x) => x.breakdown_dimension);
  if (!rows.length) return null;
  const inds = [...new Set(rows.map((r) => r.indicator))];
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {inds.map((ind) => (
        <Card key={ind}><CardContent className="p-4 space-y-3">
          <p className="font-serif font-semibold">{t(ind)}</p>
          {["gender", "age", "income"].map((dim) => {
            const g = rows.filter((r) => r.indicator === ind && r.breakdown_dimension === dim);
            if (!g.length) return null;
            return (
              <div key={dim} className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(DIM_LABEL[dim])}</p>
                {g.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="w-28 shrink-0">{t(r.breakdown_group)}</span>
                    <div className="h-2 flex-1 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, Number(r.value))}%` }} /></div>
                    <span className="w-8 text-right font-semibold">{r.value}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground">{t("Score out of 100")} · {t("OECD")}, {rows.find((r) => r.indicator === ind)?.page_ref}</p>
        </CardContent></Card>
      ))}
    </div>
  );
}

export function ObservatoryPage() {
  const t = useT();
  const f = useFinLitFindings();
  const s = useFinLitStats();
  const main = (f.data ?? []).filter((x) => !x.breakdown_dimension);
  return (
    <FinLitLayout moduleKey="observatory" title={t("Cyprus Financial Literacy Observatory — OECD & Central Bank Survey Results")}
      description={t("How financially literate are adults in Cyprus? OECD/INFE 2023 and Central Bank of Cyprus 2018 survey scores for knowledge, behaviour and attitudes.")}
      intro={t("Survey results on what adults in Cyprus know about money and how they manage it. Each figure shows its publisher, survey year and page reference.")}
      related={["research", "academy", "methodology"]}>
      {() => <>
        <section className="space-y-4">
          <H2>{t("A · Financial literacy survey results")}</H2>
          {f.isLoading ? <Loading /> : !main.length ? <p className="text-muted-foreground">{t("Data not available yet.")}</p> : <SurveyScores findings={main} />}
          <p className="text-xs text-muted-foreground">{t("The OECD (2023) and Central Bank of Cyprus (2018) surveys use different questions and scales, so their scores cannot be compared with each other.")}</p>
          {f.data && <Breakdowns findings={f.data} />}
        </section>
        <section className="space-y-4">
          <H2>{t("B · Household banking statistics")}</H2>
          <p className="text-sm text-muted-foreground">{t("Monthly figures compiled by the Central Bank of Cyprus and published through the ECB Data Portal. Interest rates are compared with the euro area; loan and deposit totals are Cyprus only.")}</p>
          {s.isLoading ? <Loading /> : <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(BANKING).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>
            <StatChart datasets={s.pick(BANKING)} obs={s.obs} />
          </>}
          <div className="rounded-md border border-dashed p-4 text-sm" role="status">
            <p className="font-medium">{t("Household debt-to-income ratio · Not yet available")}</p>
            <p className="text-muted-foreground">{t("No verified monthly official series has been confirmed yet, so no figure is shown. It will be added once an official source is checked.")}</p>
          </div>
        </section>
        <section className="space-y-4">
          <H2>{t("C · Cyprus financial conditions")}</H2>
          {s.isLoading ? <Loading /> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(["hicp_all", "disposable_income", "saving_rate", "price_level", "unexpected_expenses"]).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}
          <p className="text-sm">{t("Charts and history:")} <Link to="/financial-literacy/household" className="underline">{t("Household Financial Health")}</Link> · <Link to="/financial-literacy/cost-of-living" className="underline">{t("Cost of Living")}</Link> · <Link to="/economy" className="underline">{t("Economy")}</Link></p>
        </section>
      </>}
    </FinLitLayout>
  );
}

function StatModule({ moduleKey, codes, title, description, intro, related, cols, extra }: { moduleKey: string; codes: string[]; title: string; description: string; intro: string; related: string[]; cols: string; extra?: React.ReactNode }) {
  const t = useT();
  const s = useFinLitStats();
  return (
    <FinLitLayout moduleKey={moduleKey} title={title} description={description} intro={intro} related={related}>
      {() => <>
        <section className="space-y-4">{s.isLoading ? <Loading /> : <div className={`grid grid-cols-2 ${cols} gap-3`}>{s.pick(codes).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>}</section>
        <section className="space-y-4"><H2>{t("Explore the figures")}</H2>{s.isLoading ? <Loading /> : <StatChart datasets={s.pick(codes)} obs={s.obs} />}</section>
        {extra}
      </>}
    </FinLitLayout>
  );
}

export function HouseholdPage() {
  const t = useT();
  return <StatModule moduleKey="household" codes={HOUSEHOLD} cols="lg:grid-cols-3" related={["cost", "calculators", "observatory"]}
    title={t("Household Financial Health in Cyprus — Income, Saving & Poverty vs EU")}
    description={t("Official Eurostat figures for Cyprus households: disposable income, saving rate, earnings, unexpected expenses and poverty, compared with the EU.")}
    intro={t("Official Eurostat figures on household income, saving and financial strain in Cyprus, compared with the EU. Updated automatically when Eurostat publishes.")} />;
}

export function CostOfLivingPage() {
  const t = useT();
  return <StatModule moduleKey="cost" codes={COST} cols="lg:grid-cols-4" related={["household", "calculators", "methodology"]}
    title={t("Cost of Living in Cyprus — Inflation, Food Prices & Price Levels")}
    description={t("Eurostat figures for Cyprus: overall and food inflation (HICP), price levels and household consumption, compared with the EU.")}
    intro={t("How prices in Cyprus are changing, from official Eurostat figures. National CPI, GDP and unemployment from CYSTAT are on the Economy page.")}
    extra={<p className="text-sm">{t("More official figures:")} <Link to="/economy" className="underline">{t("Cyprus Economic Indicators")}</Link></p>} />;
}

export function CreditPage() {
  const t = useT();
  const s = useFinLitStats();
  return (
    <FinLitLayout moduleKey="credit" title={t("Credit & Borrowing in Cyprus — Loan Costs and Responsible Borrowing")}
      description={t("Understand what borrowing really costs: loan repayment calculator, APR explained, and free lessons on credit and debt for people in Cyprus.")}
      intro={t("What borrowing really costs and how to borrow responsibly. Use the loan calculator, then follow the free credit lessons in the Academy.")}
      related={["academy", "calculators", "household"]}>
      {() => <>
        <section className="space-y-4">
          <H2>{t("Household borrowing in Cyprus")}</H2>
          {s.isLoading ? <Loading /> : <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{s.pick(CREDIT).map((d) => <StatCard key={d.code} ds={d} obs={s.obs} />)}</div>
            <StatChart datasets={s.pick(CREDIT)} obs={s.obs} />
          </>}
        </section>
        <section className="space-y-4"><Calculators only="loan" /></section>
        <section className="grid md:grid-cols-2 gap-3">
          <Card><CardContent className="p-5 space-y-2">
            <p className="font-serif font-semibold text-lg">{t("Learn: Credit & Responsible Borrowing")}</p>
            <p className="text-sm text-muted-foreground">{t("Short lessons on APR, credit reports, overdrafts, buy-now-pay-later and managing debt.")}</p>
            <Button asChild size="sm"><Link to="/financial-literacy/academy/credit-and-responsible-borrowing">{t("Open the programme")}</Link></Button>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-2">
            <p className="font-serif font-semibold text-lg">{t("About these figures")}</p>
            <p className="text-sm text-muted-foreground">{t("Monthly Central Bank of Cyprus statistics via the ECB Data Portal, updated on the 5th of each month. Rates are for new loans; totals are outstanding balances at month end.")}</p>
            <Link to="/financial-literacy/observatory" className="text-sm underline">{t("All household banking figures")}</Link>
          </CardContent></Card>
        </section>
      </>}
    </FinLitLayout>
  );
}

export function CalculatorsPage() {
  const t = useT();
  const { hash } = useLocation();
  const h = hash.replace("#", "") as CalculatorKey;
  const initial = CALCULATOR_KEYS.includes(h) ? h : undefined;
  return (
    <FinLitLayout moduleKey="calculators" title={t("Free Financial Calculators — Budget, Savings, Loan, Inflation")}
      description={t("Six free money calculators: 50/30/20 budget, savings goal, compound interest, loan repayment, inflation and emergency fund. Nothing you enter is saved.")}
      intro={t("Six calculators for everyday money decisions. Everything is worked out in your browser and nothing you type is saved.")}
      related={["academy", "credit", "cost"]}>
      {() => <section><Calculators key={initial ?? "x"} initial={initial} /></section>}
    </FinLitLayout>
  );
}

export function ResearchPage() {
  const t = useT();
  const f = useFinLitFindings();
  const reports = [...new Map((f.data ?? []).map((x) => [x.source_url, x])).values()];
  return (
    <FinLitLayout moduleKey="research" title={t("Financial Literacy Research & Publications — Cyprus")}
      description={t("The OECD and Central Bank of Cyprus reports behind BusinessHub's financial literacy figures, plus practical guides from the Resource Hub.")}
      intro={t("The official reports behind the figures on these pages, with links to the original documents.")}
      related={["observatory", "methodology", "academy"]}>
      {() => <>
        <section className="space-y-3"><H2>{t("Survey reports")}</H2>
          {f.isLoading ? <Loading /> : !reports.length ? <p className="text-muted-foreground">{t("No reports listed yet.")}</p> :
            <div className="grid md:grid-cols-2 gap-3">{reports.map((r) => (
              <Card key={r.source_url}><CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">{t(r.publisher)} · {t("survey")} {r.survey_year}{r.published_year ? ` · ${t("published")} ${r.published_year}` : ""}</p>
                <p className="font-serif font-semibold">{t(r.survey)}</p>
                <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm underline">{t("Read the report")} <ExternalLink className="h-3 w-3" /></a>
              </CardContent></Card>))}</div>}
        </section>
        <section className="space-y-2"><H2>{t("Guides")}</H2>
          <p className="text-sm">{t("Practical guides and glossaries are in the")} <Link to="/resources" className="underline">{t("Resource Hub")}</Link>. {t("Economic figures are on the")} <Link to="/economy" className="underline">{t("Economy page")}</Link>.</p>
        </section>
      </>}
    </FinLitLayout>
  );
}

export function CampaignsPage() {
  const t = useT();
  const themes = [[t("Know your interest rate"), t("Understanding APR and the true cost of credit.")], [t("Stop the scam"), t("Spotting investment and phone fraud, and checking CySEC warnings.")], [t("Save a little, often"), t("Building an emergency fund, one month at a time.")]];
  return (
    <FinLitLayout moduleKey="campaigns" title={t("Financial Literacy Campaigns — Cyprus")}
      description={t("Upcoming BusinessHub public awareness campaigns on borrowing costs, fraud prevention and saving.")}
      intro={t("Public awareness campaigns are being prepared. The first planned themes are below.")}
      related={["academy", "calculators", "observatory"]}>
      {() => <section className="grid md:grid-cols-3 gap-3">{themes.map(([name, d]) => (
        <Card key={name}><CardContent className="p-5 space-y-1"><p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Coming soon")}</p><p className="font-serif font-semibold text-lg">{name}</p><p className="text-sm text-muted-foreground">{d}</p></CardContent></Card>))}</section>}
    </FinLitLayout>
  );
}

export function MethodologyPage() {
  const t = useT();
  const s = useFinLitStats();
  return (
    <FinLitLayout moduleKey="methodology" title={t("Financial Literacy Sources & Methodology")}
      description={t("Where BusinessHub's financial literacy figures come from: OECD, Central Bank of Cyprus, Eurostat and CYSTAT, with definitions and update schedules.")}
      intro={t("Where every figure comes from, how often it updates and how to read it.")}
      related={["research", "observatory", "household"]}>
      {() => <>
        <section className="space-y-2"><h2 className="text-base font-semibold">{t("How the figures work")}</h2><Methodology /></section>
        <section className="space-y-2"><H2>{t("Datasets")}</H2>
          {s.isLoading ? <Loading /> : <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b"><th className="py-2 pr-3">{t("Indicator")}</th><th className="pr-3">{t("Source")}</th><th className="pr-3">{t("Latest period")}</th><th>{t("Last checked")}</th></tr></thead>
            <tbody>{s.datasets.map((d) => <tr key={d.id} className="border-b">
              <td className="py-2 pr-3">{t.lang === "el" && d.title_el ? d.title_el : d.title_en}</td>
              <td className="pr-3"><a className="underline" href={datasetSource(d).href} target="_blank" rel="noopener noreferrer">{sourceLabel(datasetSource(d).label, t.lang)}</a></td>
              <td className="pr-3">{d.latest_period ? periodLabel(d.latest_period, t.lang) : "—"}</td>
              <td>{d.last_success_at ? new Date(d.last_success_at).toLocaleDateString(t.lang === "el" ? "el-GR" : "en-GB") : "—"}</td></tr>)}</tbody>
          </table></div>}
          <p className="text-xs text-muted-foreground">{t("Survey figures: OECD and Central Bank of Cyprus, reviewed by an editor before publication. Eurostat data reused with attribution.")}</p>
        </section>
      </>}
    </FinLitLayout>
  );
}
