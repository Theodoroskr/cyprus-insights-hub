import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ReferenceLine } from "recharts";
import { TrendingUp, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { InfocreditCta } from "@/components/mastercard/InfocreditCta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EconObs, SERIES_LABELS, annualGdp, latestOf, prettyPeriod } from "@/lib/econMetrics";

const COLORS = ["hsl(var(--re-1))", "hsl(var(--re-2))", "hsl(var(--re-3))", "hsl(var(--re-4))"];
const TABLES = [
  { label: "CPI by main categories (0410070E)", url: "https://cystatdb.cystat.gov.cy/pxweb/en/8.CYSTAT-DB/8.CYSTAT-DB__Price%20Indices__Consumer%20Price%20Index/0410070E.px/" },
  { label: "HICP timeseries (0420034E)", url: "https://cystatdb.cystat.gov.cy/pxweb/en/8.CYSTAT-DB/8.CYSTAT-DB__Price%20Indices__Harmonised%20Index%20of%20Consumer%20Prices/0420034E.px/" },
  { label: "GDP growth rate (0620005E)", url: "https://cystatdb.cystat.gov.cy/pxweb/en/8.CYSTAT-DB/8.CYSTAT-DB__National%20Accounts__Quarterly%20National%20Accounts/0620005E.px/" },
  { label: "GDP production approach (0620010E)", url: "https://cystatdb.cystat.gov.cy/pxweb/en/8.CYSTAT-DB/8.CYSTAT-DB__National%20Accounts__Quarterly%20National%20Accounts/0620010E.px/" },
  { label: "Labour Force Survey (0110010E)", url: "https://cystatdb.cystat.gov.cy/pxweb/en/8.CYSTAT-DB/8.CYSTAT-DB__Labour%20Market__Labour%20Force%20Survey/0110010E.px/" },
];
const pct = (v: number | null | undefined, sign = true) => (v == null ? "—" : `${sign && v > 0 ? "+" : ""}${v.toFixed(1)}%`);
const pp = (a: number | null | undefined, b: number | null | undefined) => (a == null || b == null ? null : a - b);

async function fetchAll(): Promise<EconObs[]> {
  const out: EconObs[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("econ_indicators").select("series_code, period_date, period_label, value")
      .eq("status", "published").order("period_date").range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []).map((r) => ({ ...r, value: r.value == null ? null : Number(r.value) }))));
    if (!data || data.length < 1000) break;
  }
  return out;
}

function csv(rows: EconObs[]) {
  const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const lines = [["Source: Cyprus Statistical Service (CYSTAT), CYSTAT-DB (CC BY 4.0). Blank = not available."], [`Generated ${new Date().toISOString().slice(0, 10)}`], [], ["indicator", "period", "value"],
    ...rows.map((r) => [SERIES_LABELS[r.series_code] ?? r.series_code, r.period_label, r.value])];
  const url = URL.createObjectURL(new Blob([lines.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = "cyprus-economic-indicators.csv"; a.click(); URL.revokeObjectURL(url);
}

export default function EconomyPage() {
  const q = useQuery({ queryKey: ["econ-indicators"], staleTime: 3600_000, queryFn: fetchAll });
  const rows = q.data ?? [];
  const [span, setSpan] = useState(10);

  const infl = latestOf(rows, "cpi_yoy");
  const gdp = latestOf(rows, "gdp_real_yoy");
  const gdpQ = latestOf(rows, "gdp_real_qoq");
  const unemp = latestOf(rows, "unemployment_rate");
  const youth = latestOf(rows, "youth_unemployment_rate");
  const annual = annualGdp(rows);
  const lastYear = Number((infl ?? gdp ?? unemp)?.period_date.slice(0, 4) ?? new Date().getFullYear());
  const fromDate = `${lastYear - span}-01-01`;

  const pivot = (codes: string[]) => {
    const m = new Map<string, Record<string, number | string | null>>();
    for (const r of rows) {
      if (!codes.includes(r.series_code) || r.period_date < fromDate) continue;
      const e = m.get(r.period_date) ?? { period: prettyPeriod(r.period_label) };
      e[r.series_code] = r.value; m.set(r.period_date, e);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  };
  const inflation = useMemo(() => pivot(["hicp_yoy", "cpi_yoy"]), [rows, fromDate]);
  const growth = useMemo(() => pivot(["gdp_real_yoy", "gdp_real_qoq"]), [rows, fromDate]);
  const labour = useMemo(() => pivot(["unemployment_rate", "youth_unemployment_rate"]), [rows, fromDate]);

  const kpis = [
    { l: `Inflation, ${infl ? prettyPeriod(infl.period_label) : ""}`, v: pct(infl?.value), d: pp(infl?.value, infl?.prev?.value), s: "CPI, change vs same month last year" },
    { l: `Real GDP growth, ${gdp ? prettyPeriod(gdp.period_label) : ""}`, v: pct(gdp?.value), d: null, s: `vs same quarter last year · ${pct(gdpQ?.value)} vs previous quarter` },
    { l: `Unemployment rate, ${unemp ? prettyPeriod(unemp.period_label) : ""}`, v: pct(unemp?.value, false), d: pp(unemp?.value, unemp?.yearAgo?.value), s: "Labour Force Survey, ages 15+" },
    { l: `Youth unemployment, ${youth ? prettyPeriod(youth.period_label) : ""}`, v: pct(youth?.value, false), d: pp(youth?.value, youth?.yearAgo?.value), s: "ages 15–24" },
  ];
  const chart = (data: Record<string, unknown>[], codes: string[], zero = false) => (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="period" fontSize={11} minTickGap={24} /><YAxis fontSize={11} tickFormatter={(v) => `${v}%`} />
        {zero && <ReferenceLine y={0} className="stroke-muted-foreground" />}
        <RTooltip formatter={(v: number) => (v == null ? "—" : `${v.toFixed(1)}%`)} /><Legend />
        {codes.map((c, i) => <Line key={c} dataKey={c} name={SERIES_LABELS[c]} stroke={COLORS[i]} dot={false} strokeWidth={2} connectNulls />)}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead
        title="Cyprus Economic Indicators — Inflation, GDP, Unemployment | BusinessHub"
        description="Official Cyprus inflation (CPI and HICP), quarterly GDP growth and Labour Force Survey unemployment from CYSTAT, updated as soon as new figures are released."
        path="/economy"
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Economy", href: "/economy" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Economic Indicators · Οικονομικοί Δείκτες</div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Cyprus Economic Indicators</h1>
          <p className="text-muted-foreground max-w-3xl">Inflation, economic growth and unemployment straight from the Cyprus Statistical Service. New releases load automatically each week; past figures that CYSTAT revises are checked before they change here.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Select value={String(span)} onValueChange={(v) => setSpan(Number(v))}>
              <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{[5, 10, 20, 30].map((n) => <SelectItem key={n} value={String(n)}>Last {n} years</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => csv(rows)} disabled={!rows.length}><Download className="h-4 w-4 mr-1" /> Download CSV</Button>
          </div>
        </header>

        {q.isLoading ? <p className="text-muted-foreground">Loading official figures…</p> : !rows.length ? <p className="text-muted-foreground">No figures available yet.</p> : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k) => (
                <Card key={k.l}><CardContent className="p-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.l}</p>
                  <p className="text-2xl font-semibold font-serif">{k.v}</p>
                  <p className="text-xs text-muted-foreground">{k.d != null && <span className="font-medium text-foreground">{k.d > 0 ? "+" : ""}{k.d.toFixed(1)} pts · </span>}{k.s}</p>
                  <p className="text-[10px] text-muted-foreground">CYSTAT</p>
                </CardContent></Card>
              ))}
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Inflation · Πληθωρισμός</CardTitle></CardHeader>
                <CardContent className="h-72">{chart(inflation, ["hicp_yoy", "cpi_yoy"], true)}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Real GDP growth · Ανάπτυξη ΑΕΠ</CardTitle></CardHeader>
                <CardContent className="h-72">{chart(growth, ["gdp_real_yoy", "gdp_real_qoq"], true)}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Unemployment · Ανεργία</CardTitle></CardHeader>
                <CardContent className="h-72">{chart(labour, ["unemployment_rate", "youth_unemployment_rate"])}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">GDP at current prices, full years (€ billion)</CardTitle></CardHeader>
                <CardContent className="h-72"><ResponsiveContainer>
                  <BarChart data={annual.filter((a) => a.year >= lastYear - span).map((a) => ({ year: a.year, gdp: a.gdp / 1000 }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" fontSize={11} /><YAxis fontSize={11} />
                    <RTooltip formatter={(v: number) => `€${v.toFixed(1)}bn`} />
                    <Bar dataKey="gdp" name="GDP, current prices" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer></CardContent>
              </Card>
            </div>
          </>
        )}

        <InfocreditCta placement="economy" interest="Economic Research" />

        <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          <p>Source: Cyprus Statistical Service (CYSTAT), CYSTAT-DB (CC BY 4.0). GDP growth is seasonally and working-day adjusted; annual GDP is the sum of four published quarters, calculated by BusinessHub. The unemployment rate is from the quarterly Labour Force Survey (not registered unemployment).</p>
          <p>Πηγή: Στατιστική Υπηρεσία Κύπρου (ΚΥΣΤΑΤ).</p>
          <p className="flex flex-wrap gap-3">
            {TABLES.map((t) => <a key={t.url} href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">{t.label} <ExternalLink className="h-3 w-3" /></a>)}
          </p>
          <p>Periods not yet published are left out, never shown as zero.</p>
        </footer>
      </div>
      <Footer />
    </div>
  );
}
