import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
} from "recharts";
import { Plane, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS, periodLabel } from "@/lib/realEstateMetrics";
import { TourismObs, tourismHeadline, annualTotals, topCountries } from "@/lib/tourismMetrics";

const COLORS = ["hsl(var(--re-1))", "hsl(var(--re-2))", "hsl(var(--re-3))", "hsl(var(--re-4))", "hsl(var(--re-5))"];
const FOCUS = [
  { code: "united-kingdom", label: "United Kingdom" },
  { code: "israel", label: "Israel" },
  { code: "germany", label: "Germany" },
  { code: "poland", label: "Poland" },
];
const SOURCE_URL = "https://cystatdb.cystat.gov.cy/pxweb/en/8.CYSTAT-DB/8.CYSTAT-DB__Tourism__Tourists__Monthly/2021010E.px/";
const fmt = (v: number | null | undefined) => (v == null ? "—" : Math.round(v).toLocaleString("en-GB"));
const pct = (v: number | null | undefined) => (v == null ? "n/a" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
const short = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}m` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(v));

async function fetchRows(build: (q: any) => any): Promise<TourismObs[]> {
  const out: TourismObs[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(
      supabase.from("tourism_arrivals_monthly").select("year, month, country_code, country_label, kind, region, arrivals").eq("status", "published"),
    ).order("period_date").range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as TourismObs[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

function csv(name: string, header: string[], rows: (string | number | null)[][]) {
  const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const notes = [["Source: Cyprus Statistical Service (CYSTAT), Arrivals of Tourists by Country of Usual Residence, Monthly (CC BY 4.0). Blank = not yet published."], [`Generated ${new Date().toISOString().slice(0, 10)}`], []];
  const blob = new Blob([[...notes, header, ...rows].map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export default function TourismPage() {
  const totalsQ = useQuery({ queryKey: ["tourism-totals"], staleTime: 3600_000, queryFn: () => fetchRows((q) => q.in("kind", ["total", "region"])) });
  const totals = (totalsQ.data ?? []).filter((r) => r.kind === "total");
  const h = tourismHeadline(totals);
  const latestYear = h?.latest.year;

  const countriesQ = useQuery({
    queryKey: ["tourism-countries", latestYear], enabled: !!latestYear, staleTime: 3600_000,
    queryFn: () => fetchRows((q) => q.eq("kind", "country").gte("year", latestYear! - 1)),
  });
  const focusQ = useQuery({
    queryKey: ["tourism-focus"], staleTime: 3600_000,
    queryFn: () => fetchRows((q) => q.in("country_code", FOCUS.map((f) => f.code)).gte("year", 2015)),
  });

  const years = useMemo(() => [...new Set(totals.map((r) => r.year))].sort((a, b) => b - a), [totals]);
  const [seasonYears, setSeasonYears] = useState<number>(4);
  const annual = annualTotals(totals);
  const top = h ? topCountries(countriesQ.data ?? [], h.latest.year, h.latest.month, 10) : [];
  const ytdTotal = h?.ytd.current ?? null;

  const monthly = totals.filter((r) => latestYear && r.year >= latestYear - 4 && r.arrivals != null)
    .map((r) => ({ period: `${MONTHS[r.month - 1]} ${String(r.year).slice(2)}`, arrivals: r.arrivals }));
  const seasonal = MONTHS.map((m, i) => {
    const row: Record<string, number | string | null> = { month: m };
    for (const y of years.slice(0, seasonYears)) row[String(y)] = totals.find((r) => r.year === y && r.month === i + 1)?.arrivals ?? null;
    return row;
  });
  const focusAnnual = useMemo(() => {
    const m = new Map<number, Record<string, number>>();
    for (const r of focusQ.data ?? []) {
      if (r.arrivals == null || (h && r.month > h.latest.month && r.year === h.latest.year)) continue;
      const e = m.get(r.year) ?? { year: r.year };
      e[r.country_code] = (e[r.country_code] ?? 0) + r.arrivals;
      m.set(r.year, e);
    }
    return [...m.values()].sort((a, b) => a.year - b.year);
  }, [focusQ.data, h]);

  const exportCsv = () => csv("cyprus-tourist-arrivals.csv", ["year", "month", "series", "type", "arrivals"],
    [...(totalsQ.data ?? []), ...(countriesQ.data ?? [])].map((r) => [r.year, r.month, r.country_label, r.kind, r.arrivals]));

  const loading = totalsQ.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <SEOHead
        title={`Cyprus Tourism Statistics ${latestYear ?? ""} — Tourist Arrivals | BusinessHub`}
        description="Official monthly tourist arrivals to Cyprus by country of residence from CYSTAT: year-to-date totals, seasonality, top source markets and long-term trends."
        path="/tourism"
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Tourism", href: "/tourism" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Plane className="h-4 w-4" /> Tourism Intelligence · Τουρισμός</div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Cyprus Tourism Intelligence</h1>
          <p className="text-muted-foreground max-w-3xl">
            Official tourist arrivals, seasonality and source markets.
            <span className="block text-sm italic">Αφίξεις τουριστών, εποχικότητα και αγορές προέλευσης.</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Latest month: {periodLabel(h?.latest ?? null)}</Badge>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={loading}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          </div>
        </header>

        {loading ? <p className="text-muted-foreground">Loading official statistics…</p> : !h ? (
          <p className="text-muted-foreground">Statistics are being imported. Please check back shortly.</p>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { l: `Arrivals, ${periodLabel(h.latest)}`, v: fmt(h.month), c: h.monthChange, s: `vs ${MONTHS[h.latest.month - 1]} ${h.latest.year - 1}` },
                { l: `Year to date (Jan–${MONTHS[h.latest.month - 1]} ${h.latest.year})`, v: fmt(h.ytd.current), c: h.ytd.change, s: `vs Jan–${MONTHS[h.latest.month - 1]} ${h.latest.year - 1}` },
                { l: "Last 12 months", v: fmt(h.m12.current), c: h.m12.change, s: "vs previous 12 months" },
                { l: "Top source market (YTD)", v: top[0]?.label ?? "—", c: top[0]?.change ?? null, s: top[0] ? `${fmt(top[0].value)} arrivals, ${((top[0].value / (ytdTotal || 1)) * 100).toFixed(1)}% share` : "" },
              ].map((k) => (
                <Card key={k.l}><CardContent className="p-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.l}</p>
                  <p className="text-2xl font-semibold font-serif">{k.v}</p>
                  <p className={`text-xs font-medium ${k.c == null ? "text-muted-foreground" : k.c >= 0 ? "text-primary" : "text-destructive"}`}>{pct(k.c)} <span className="font-normal text-muted-foreground">{k.s}</span></p>
                  <p className="text-[10px] text-muted-foreground">CYSTAT</p>
                </CardContent></Card>
              ))}
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Monthly arrivals (last 5 years)</CardTitle></CardHeader>
                <CardContent className="h-72"><ResponsiveContainer>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" fontSize={11} interval={5} /><YAxis fontSize={11} tickFormatter={short} />
                    <RTooltip formatter={(v: number) => fmt(v)} />
                    <Line dataKey="arrivals" name="Tourist arrivals" stroke={COLORS[0]} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer></CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">Seasonality · Εποχικότητα</CardTitle>
                  <Select value={String(seasonYears)} onValueChange={(v) => setSeasonYears(Number(v))}>
                    <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{[2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>Last {n} years</SelectItem>)}</SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="h-72"><ResponsiveContainer>
                  <BarChart data={seasonal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} tickFormatter={short} />
                    <RTooltip formatter={(v: number) => fmt(v)} /><Legend />
                    {years.slice(0, seasonYears).reverse().map((y, i) => <Bar key={y} dataKey={String(y)} fill={COLORS[i % COLORS.length]} />)}
                  </BarChart>
                </ResponsiveContainer></CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Annual arrivals since {annual[0]?.year}</CardTitle></CardHeader>
                <CardContent className="h-72"><ResponsiveContainer>
                  <BarChart data={annual.map((a) => ({ ...a, label: a.partial ? `${a.year} YTD` : String(a.year) }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" fontSize={10} /><YAxis fontSize={11} tickFormatter={short} />
                    <RTooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="arrivals" name="Tourist arrivals" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer></CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Key markets, annual (current year to {MONTHS[h.latest.month - 1]})</CardTitle></CardHeader>
                <CardContent className="h-72"><ResponsiveContainer>
                  <LineChart data={focusAnnual}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" fontSize={11} /><YAxis fontSize={11} tickFormatter={short} />
                    <RTooltip formatter={(v: number) => fmt(v)} /><Legend />
                    {FOCUS.map((f, i) => <Line key={f.code} dataKey={f.code} name={f.label} stroke={COLORS[i]} dot={false} strokeWidth={2} />)}
                  </LineChart>
                </ResponsiveContainer></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 source countries, Jan–{MONTHS[h.latest.month - 1]} {h.latest.year}</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground text-xs"><tr><th className="py-1">#</th><th>Country of residence</th><th className="text-right">Arrivals</th><th className="text-right">Share</th><th className="text-right">vs {h.latest.year - 1}</th></tr></thead>
                  <tbody>{top.map((c, i) => (
                    <tr key={c.code} className="border-t">
                      <td className="py-1.5">{i + 1}</td><td>{c.label}</td><td className="text-right">{fmt(c.value)}</td>
                      <td className="text-right">{ytdTotal ? ((c.value / ytdTotal) * 100).toFixed(1) : "—"}%</td>
                      <td className={`text-right ${c.change == null ? "" : c.change >= 0 ? "text-primary" : "text-destructive"}`}>{pct(c.change)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}

        <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          <p>Source: Cyprus Statistical Service (CYSTAT), "Arrivals of Tourists by Country of Usual Residence, Monthly", via the Cyprus Open Data Portal (CC BY 4.0). Totals, year-to-date comparisons and shares calculated by BusinessHub.</p>
          <p>Πηγή: Στατιστική Υπηρεσία Κύπρου (ΚΥΣΤΑΤ), μέσω της Πύλης Ανοικτών Δεδομένων.</p>
          <p className="flex flex-wrap gap-3">
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">CYSTAT table <ExternalLink className="h-3 w-3" /></a>
            <a href="https://data.gov.cy/en/dataset/2274" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">data.gov.cy dataset <ExternalLink className="h-3 w-3" /></a>
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">Licence CC BY 4.0</a>
          </p>
          <p>Some countries are only reported for certain years (CYSTAT notes these). Months not yet published are left out, never counted as zero.</p>
        </footer>
      </div>
      <Footer />
    </div>
  );
}
