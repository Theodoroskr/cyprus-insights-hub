import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Info, Download, Building2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HubLayout } from "@/layouts/HubLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DISTRICTS, Obs, Frequency, latestPeriod, ytdComparison, momentum, seriesBy, districtShares, ratio, periodLabel, MONTHS, sumField,
} from "@/lib/realEstateMetrics";

const COLORS = ["hsl(var(--re-1))", "hsl(var(--re-2))", "hsl(var(--re-3))", "hsl(var(--re-4))", "hsl(var(--re-5))"];
const ATTRIBUTION = "Source: Department of Lands and Surveys, Republic of Cyprus, via the Cyprus Open Data Portal (CC BY 4.0). Figures aggregated by BusinessHub.";

const fmtInt = (v: number | null) => (v == null ? "—" : Math.round(v).toLocaleString("en-GB"));
const fmtEur = (v: number | null) => {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e9) return `€${(v / 1e9).toFixed(2)}bn`;
  if (Math.abs(v) >= 1e6) return `€${(v / 1e6).toFixed(1)}m`;
  return `€${Math.round(v).toLocaleString("en-GB")}`;
};
const fmtPct = (v: number | null) => (v == null ? "n/a" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
const shortEur = (v: number) => (v >= 1e9 ? `€${(v / 1e9).toFixed(1)}bn` : v >= 1e6 ? `€${(v / 1e6).toFixed(0)}m` : `€${v}`);

async function fetchAll(table: "re_sale_contracts" | "re_transfers") {
  const { data, error } = await supabase.from(table).select("*").eq("status", "published").order("period_date").range(0, 9999);
  if (error) throw error;
  return (data ?? []) as unknown as Obs[];
}

function Kpi({ label, value, period, compare, change, tip }: { label: string; value: string; period: string; compare?: string; change?: number | null; tip: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <Tooltip>
            <TooltipTrigger aria-label={`About ${label}`}><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-2xl font-semibold font-serif">{value}</p>
        <p className="text-xs text-muted-foreground">{period}</p>
        {change !== undefined && (
          <p className={`text-xs font-medium ${change == null ? "text-muted-foreground" : change >= 0 ? "text-primary" : "text-destructive"}`}>
            {fmtPct(change)} {compare && <span className="font-normal text-muted-foreground">vs {compare}</span>}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">Dept. of Lands and Surveys</p>
      </CardContent>
    </Card>
  );
}

function downloadCsv(name: string, header: string[], rows: (string | number | null)[][]) {
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const notes = [
    [ATTRIBUTION],
    ["Sale contracts = deposited property sale contracts. Transfers = completed transfers (cases, parcels, declared and accepted value in EUR). Blank = not yet published."],
    [`Generated ${new Date().toISOString().slice(0, 10)} — licence https://creativecommons.org/licenses/by/4.0/`],
    [],
  ];
  const csv = [...notes, header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RealEstatePage() {
  const { district: districtSlug } = useParams();
  const district = districtSlug ? DISTRICTS.find((d) => d.slug === districtSlug) : undefined;
  const [freq, setFreq] = useState<Frequency>("annual");
  const [fromYear, setFromYear] = useState<string>("2016");
  const [picked, setPicked] = useState<string[]>([]);

  const contractsQ = useQuery({ queryKey: ["re-contracts"], queryFn: () => fetchAll("re_sale_contracts"), staleTime: 3600_000 });
  const transfersQ = useQuery({ queryKey: ["re-transfers"], queryFn: () => fetchAll("re_transfers"), staleTime: 3600_000 });
  const { data: sources } = useQuery({
    queryKey: ["re-sources"],
    queryFn: async () => (await supabase.from("re_sources").select("dataset_type, official_dataset_url, last_successful_import_at, latest_reporting_period")).data ?? [],
  });

  const allContracts = contractsQ.data ?? [];
  const allTransfers = transfersQ.data ?? [];
  const selected = district ? [district.code] : picked;
  const inScope = (r: Obs) => selected.length === 0 || selected.includes(r.district_code);
  const contracts = useMemo(() => allContracts.filter(inScope), [allContracts, selected.join()]);
  const transfers = useMemo(() => allTransfers.filter(inScope), [allTransfers, selected.join()]);

  const lc = latestPeriod(allContracts, "contract_count");
  const lt = latestPeriod(allTransfers, "transfer_cases");

  const kc = lc ? ytdComparison(contracts, "contract_count", lc.year, lc.month) : null;
  const kt = lt ? ytdComparison(transfers, "transfer_cases", lt.year, lt.month) : null;
  const kp = lt ? ytdComparison(transfers, "parcel_count", lt.year, lt.month) : null;
  const kd = lt ? ytdComparison(transfers, "declared_value_eur", lt.year, lt.month) : null;
  const ka = lt ? ytdComparison(transfers, "accepted_value_eur", lt.year, lt.month) : null;
  const ytd = (p: { year: number; month: number } | null) => (p ? `Jan–${MONTHS[p.month - 1]} ${p.year} (year to date)` : "—");
  const prevYtd = (p: { year: number; month: number } | null) => (p ? `Jan–${MONTHS[p.month - 1]} ${p.year - 1}` : "");

  const yearOk = (r: Obs) => r.year >= Number(fromYear);
  const cSeries = seriesBy(contracts.filter(yearOk), ["contract_count"], freq);
  const tSeries = seriesBy(transfers.filter(yearOk), ["transfer_cases", "parcel_count", "declared_value_eur", "accepted_value_eur"], freq)
    .map((e) => ({ ...e, ratio: ratio(Number(e.accepted_value_eur), Number(e.declared_value_eur)) }));
  const compare = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    for (const e of cSeries) m.set(String(e.period), { period: e.period, contracts: e.contract_count, partial: e.partial });
    for (const e of tSeries) m.set(String(e.period), { ...(m.get(String(e.period)) ?? { period: e.period }), transfers: e.transfer_cases });
    return [...m.values()].sort((a, b) => String(a.period).localeCompare(String(b.period)));
  }, [cSeries, tSeries]);
  const xLabel = (p: string) => p + (cSeries.find((e) => e.period === p)?.partial && freq === "annual" ? " YTD" : "");

  const ytdFilter = (p: { year: number; month: number } | null) => (r: Obs) => !!p && r.year === p.year && r.month <= p.month;
  const shareContracts = districtShares(allContracts, "contract_count", ytdFilter(lc));
  const shareTransfers = districtShares(allTransfers, "transfer_cases", ytdFilter(lt));
  const shareValue = districtShares(allTransfers, "accepted_value_eur", ytdFilter(lt));

  const m3 = lt ? momentum(transfers, "transfer_cases", lt.year, lt.month, 3) : null;
  const m12 = lt ? momentum(transfers, "transfer_cases", lt.year, lt.month, 12) : null;
  const mc12 = lc ? momentum(contracts, "contract_count", lc.year, lc.month, 12) : null;
  const perCase = ratio(ka?.current ?? null, kt?.current ?? null);
  const accRatio = ratio(ka?.current ?? null, kd?.current ?? null);

  const nationalPerCase = lt ? ratio(
    sumField(allTransfers, "accepted_value_eur", ytdFilter(lt)), sumField(allTransfers, "transfer_cases", ytdFilter(lt)),
  ) : null;

  const firstTransferYear = allTransfers.length ? Math.min(...allTransfers.map((r) => r.year)) : null;
  const years = Array.from(new Set(allContracts.map((r) => r.year))).sort();

  if (districtSlug && !district) return <Navigate to="/real-estate" replace />;
  const loading = contractsQ.isLoading || transfersQ.isLoading;
  const name = district ? district.en : "Cyprus";
  const title = district ? `${district.en} Real Estate Market Statistics | BusinessHub` : `Cyprus Real Estate Market Statistics ${lc?.year ?? ""} | BusinessHub`;

  const exportData = () => {
    const keyed = new Map<string, (string | number | null)[]>();
    for (const r of contracts) keyed.set(`${r.year}-${r.month}-${r.district_code}`, [r.year, r.month, r.district_code, r.contract_count, null, null, null, null]);
    for (const r of transfers) {
      const k = `${r.year}-${r.month}-${r.district_code}`;
      const row = keyed.get(k) ?? [r.year, r.month, r.district_code, null, null, null, null, null];
      row[4] = r.transfer_cases; row[5] = r.parcel_count; row[6] = r.declared_value_eur; row[7] = r.accepted_value_eur;
      keyed.set(k, row);
    }
    const rows = [...keyed.values()].filter((r) => Number(r[0]) >= Number(fromYear)).sort((a, b) => Number(a[0]) * 13 + Number(a[1]) - (Number(b[0]) * 13 + Number(b[1])));
    downloadCsv(`cyprus-real-estate-${district?.slug ?? "all"}.csv`, ["year", "month", "district", "sale_contracts", "transfer_cases", "parcels", "declared_value_eur", "accepted_value_eur"], rows);
  };

  return (
    <HubLayout brand="businesshub">
      <SEOHead
        title={title}
        description={`Official ${name} property market statistics: deposited sale contracts since 2016, completed transfers, declared and accepted values, district comparisons and trends.`}
        path={district ? `/real-estate/${district.slug}` : "/real-estate"}
        breadcrumbs={[{ name: "Home", href: "/" }, { name: "Real Estate", href: "/real-estate" }, ...(district ? [{ name: district.en, href: `/real-estate/${district.slug}` }] : [])]}
      />
      <TooltipProvider delayDuration={150}>
        <div className="container mx-auto px-4 py-8 space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <Link to="/real-estate" className="hover:underline">Real Estate Intelligence · Αγορά Ακινήτων</Link>
              {district && <span>/ {district.en} · {district.el}</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold">
              {district ? `${district.en} Real Estate Market` : "Cyprus Real Estate Intelligence"}
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              {district
                ? `Official district-level property statistics for ${district.en}: sale contracts, transfers, values and its share of the Cyprus market.`
                : "Official property market statistics, historical trends and district-level insights."}
              <span className="block text-sm italic">Στατιστικά στοιχεία, ιστορικές τάσεις και αναλύσεις της αγοράς ακινήτων στην Κύπρο.</span>
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Latest contracts: {periodLabel(lc)}</Badge>
              <Badge variant="secondary">Latest transfers: {periodLabel(lt)}</Badge>
            </div>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {!district && (
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={picked.length === 0 ? "default" : "outline"} onClick={() => setPicked([])}>All Cyprus</Button>
                {DISTRICTS.map((d) => (
                  <Button key={d.code} size="sm" variant={picked.includes(d.code) ? "default" : "outline"}
                    onClick={() => setPicked((p) => (p.includes(d.code) ? p.filter((x) => x !== d.code) : [...p, d.code]))}>
                    {d.en}
                  </Button>
                ))}
              </div>
            )}
            <Select value={freq} onValueChange={(v) => setFreq(v as Frequency)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fromYear} onValueChange={setFromYear}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>From {y}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportData} disabled={loading}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading official statistics…</p>
          ) : !lc && !lt ? (
            <p className="text-muted-foreground">Statistics are being imported. Please check back shortly.</p>
          ) : (
            <>
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi label="Sale contracts" value={fmtInt(kc?.current ?? null)} period={ytd(lc)} tip="Property sale contracts deposited at the Land Registry. Depositing a contract is not a completed transfer." />
                <Kpi label="Transfer cases" value={fmtInt(kt?.current ?? null)} period={ytd(lt)} tip="Completed property transfer (sale) cases registered by the Department of Lands and Surveys." />
                <Kpi label="Parcels transferred" value={fmtInt(kp?.current ?? null)} period={ytd(lt)} tip="Number of property parcels (τεμάχια) included in the transfer cases. One case can include several parcels." />
                <Kpi label="Declared value" value={fmtEur(kd?.current ?? null)} period={ytd(lt)} tip="Total transaction value declared by the parties for the transfers." />
                <Kpi label="Accepted value" value={fmtEur(ka?.current ?? null)} period={ytd(lt)} tip="Total value accepted by the Department of Lands and Surveys for the transfers." />
                <Kpi label="Contracts YoY" value={fmtPct(kc?.change ?? null)} period={ytd(lc)} compare={prevYtd(lc)} change={kc?.change ?? null} tip="Change in deposited contracts compared with the same months of the previous year." />
                <Kpi label="Transfers YoY" value={fmtPct(kt?.change ?? null)} period={ytd(lt)} compare={prevYtd(lt)} change={kt?.change ?? null} tip="Change in transfer cases compared with the same months of the previous year." />
                <Kpi label="Accepted value YoY" value={fmtPct(ka?.change ?? null)} period={ytd(lt)} compare={prevYtd(lt)} change={ka?.change ?? null} tip="Change in total accepted value compared with the same months of the previous year." />
              </section>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Property sale contracts · Πωλητήρια Έγγραφα</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer>
                      <BarChart data={cSeries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tickFormatter={xLabel} fontSize={11} />
                        <YAxis fontSize={11} />
                        <RTooltip formatter={(v: number) => fmtInt(v)} />
                        <Legend />
                        {(selected.length ? DISTRICTS.filter((d) => selected.includes(d.code)) : DISTRICTS).map((d) => (
                          <Bar key={d.code} dataKey={`contract_count:${d.code}`} name={d.en} stackId="c" fill={COLORS[DISTRICTS.indexOf(d)]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Property transfers · Μεταβιβάσεις Ακινήτων</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer>
                      <BarChart data={tSeries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tickFormatter={xLabel} fontSize={11} />
                        <YAxis fontSize={11} />
                        <RTooltip formatter={(v: number) => fmtInt(v)} />
                        <Legend />
                        <Bar dataKey="transfer_cases" name="Transfer cases" fill={COLORS[0]} />
                        <Bar dataKey="parcel_count" name="Parcels" fill={COLORS[2]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Transaction values · Δηλωθείσα / Αποδεκτή Αξία</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer>
                      <LineChart data={tSeries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tickFormatter={xLabel} fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={shortEur} />
                        <RTooltip formatter={(v: number) => fmtEur(v)} />
                        <Legend />
                        <Line dataKey="declared_value_eur" name="Declared value" stroke={COLORS[3]} dot={false} strokeWidth={2} />
                        <Line dataKey="accepted_value_eur" name="Accepted value" stroke={COLORS[0]} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Contracts vs completed transfers</CardTitle>
                    <p className="text-xs text-muted-foreground">These are separate legal events. A contract deposited in one month is usually transferred months or years later, so the two lines do not refer to the same properties.</p>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer>
                      <LineChart data={compare.filter((e) => e.transfers != null)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tickFormatter={xLabel} fontSize={11} />
                        <YAxis fontSize={11} />
                        <RTooltip formatter={(v: number) => fmtInt(v)} />
                        <Legend />
                        <Line dataKey="contracts" name="Sale contracts" stroke={COLORS[1]} dot={false} strokeWidth={2} />
                        <Line dataKey="transfers" name="Transfer cases" stroke={COLORS[0]} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <section className="grid lg:grid-cols-3 gap-6">
                {[
                  { title: `Share of sale contracts (${ytd(lc)})`, data: shareContracts, fmt: fmtInt },
                  { title: `Share of transfer cases (${ytd(lt)})`, data: shareTransfers, fmt: fmtInt },
                  { title: `Share of accepted value (${ytd(lt)})`, data: shareValue, fmt: fmtEur },
                ].map((s) => (
                  <Card key={s.title}>
                    <CardHeader className="pb-0"><CardTitle className="text-sm">{s.title}</CardTitle></CardHeader>
                    <CardContent className="h-60">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={s.data.map((d) => ({ ...d, value: d.value ?? 0 }))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                            {s.data.map((d, i) => (
                              <Cell key={d.code} fill={COLORS[i]} opacity={district && district.code !== d.code ? 0.3 : 1} />
                            ))}
                          </Pie>
                          <RTooltip formatter={(v: number, _n, p) => `${s.fmt(v)} (${(p.payload.share ?? 0).toFixed(1)}%)`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Market indicators {district ? `· ${district.en}` : selected.length ? "· selected districts" : "· Cyprus"}</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-muted-foreground">3-month transfer momentum</p><p className="text-xl font-semibold">{fmtPct(m3?.change ?? null)}</p><p className="text-xs text-muted-foreground">Last 3 months vs same 3 months a year earlier</p></div>
                  <div><p className="text-muted-foreground">12-month transfer momentum</p><p className="text-xl font-semibold">{fmtPct(m12?.change ?? null)}</p><p className="text-xs text-muted-foreground">Trailing 12 months vs previous 12</p></div>
                  <div><p className="text-muted-foreground">12-month contract momentum</p><p className="text-xl font-semibold">{fmtPct(mc12?.change ?? null)}</p><p className="text-xs text-muted-foreground">Trailing 12 months vs previous 12</p></div>
                  <div><p className="text-muted-foreground">Accepted-to-declared ratio</p><p className="text-xl font-semibold">{accRatio == null ? "n/a" : accRatio.toFixed(2)}</p><p className="text-xs text-muted-foreground">Accepted value ÷ declared value, {ytd(lt)}</p></div>
                  <div>
                    <p className="text-muted-foreground">Accepted value per transfer case</p>
                    <p className="text-xl font-semibold">{fmtEur(perCase)}</p>
                    <p className="text-xs text-muted-foreground">Aggregate value ÷ cases — not an average property price{(district || selected.length > 0) && nationalPerCase ? ` (Cyprus: ${fmtEur(nationalPerCase)})` : ""}</p>
                  </div>
                  {district && (
                    <div><p className="text-muted-foreground">Share of Cyprus transfers</p><p className="text-xl font-semibold">{(shareTransfers.find((s) => s.code === district.code)?.share ?? 0).toFixed(1)}%</p><p className="text-xs text-muted-foreground">{ytd(lt)}</p></div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <nav className="flex flex-wrap gap-2" aria-label="District pages">
            {DISTRICTS.map((d) => (
              <Button key={d.slug} asChild size="sm" variant={district?.slug === d.slug ? "default" : "outline"}>
                <Link to={`/real-estate/${d.slug}`}>{d.en} · {d.el}</Link>
              </Button>
            ))}
            {district && <Button asChild size="sm" variant="ghost"><Link to="/real-estate">All Cyprus</Link></Button>}
          </nav>

          <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
            <p>{ATTRIBUTION}</p>
            <p>Πηγή: Τμήμα Κτηματολογίου και Χωρομετρίας, Κυπριακή Δημοκρατία, μέσω της Πύλης Ανοικτών Δεδομένων.</p>
            <p className="flex flex-wrap gap-3">
              {(sources ?? []).map((s) => (
                <a key={s.dataset_type} href={s.official_dataset_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                  {s.dataset_type === "sale_contracts" ? "Sale contracts dataset" : "Transfers dataset"} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">Licence CC BY 4.0</a>
            </p>
            <p>Changes: monthly district files combined into totals, year-to-date comparisons and ratios calculated by BusinessHub. Statistics are district-level only; no forecasts or price index are implied.{firstTransferYear ? ` Transfers available from ${firstTransferYear}, contracts from 2016.` : ""}</p>
          </footer>
        </div>
      </TooltipProvider>
    </HubLayout>
  );
}
