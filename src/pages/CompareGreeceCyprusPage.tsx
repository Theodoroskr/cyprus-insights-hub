import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from "recharts";
import { ExternalLink } from "lucide-react";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { databrowserUrl } from "@/lib/eurostatView";
import { GEO_NAMES, formatValue, latestCommonPeriod, periodLabel, type Lang, type PulseObs } from "@/lib/greecePulse";
import { flagLabel, useStatSeries } from "@/hooks/useStatSeries";
import { grHref } from "@/lib/edition";

type Bi = { en: string; el: string };
const INDICATORS: { code: string; title: Bi; unit: Bi; note: Bi }[] = [
  { code: "gdp_growth", title: { en: "Real GDP growth", el: "Πραγματική αύξηση ΑΕΠ" }, unit: { en: "% vs same quarter last year", el: "% σε ετήσια βάση (τρίμηνο)" },
    note: { en: "Quarterly, chain-linked volumes, seasonally and calendar adjusted.", el: "Τριμηνιαία, αλυσωτοί όγκοι, εποχικά και ημερολογιακά προσαρμοσμένα." } },
  { code: "hicp_all", title: { en: "HICP inflation", el: "Πληθωρισμός (ΕνΔΤΚ)" }, unit: { en: "% vs same month last year", el: "% σε ετήσια βάση" },
    note: { en: "Monthly harmonised index of consumer prices, annual rate of change.", el: "Μηνιαίος εναρμονισμένος δείκτης τιμών καταναλωτή, ετήσια μεταβολή." } },
  { code: "unemployment", title: { en: "Unemployment rate", el: "Ποσοστό ανεργίας" }, unit: { en: "% of labour force", el: "% του εργατικού δυναμικού" },
    note: { en: "Monthly, seasonally adjusted, all ages.", el: "Μηνιαίο, εποχικά προσαρμοσμένο, όλες οι ηλικίες." } },
];
const COLORS: Record<string, string> = { EL: "hsl(var(--re-1))", CY: "hsl(var(--re-2))", EU27_2020: "hsl(var(--re-3))" };

function Indicator({ ind, ds, obs, lang, showEu }: { ind: (typeof INDICATORS)[number]; ds: { decimals: number; unit_label: string; dataset_code: string; geos: string[] } | undefined; obs: PulseObs[]; lang: Lang; showEu: boolean }) {
  const el = lang === "el";
  const euAvailable = !!ds?.geos.includes("EU27_2020");
  const geos = ["EL", "CY", ...(showEu && euAvailable ? ["EU27_2020"] : [])];
  const common = latestCommonPeriod(obs.filter((o) => o.geo === "EL" || o.geo === "CY"), ["EL", "CY"]);
  // One row per period; a country without a value for that period is left empty, so gaps show in the chart.
  const rows = useMemo(() => {
    const m = new Map<string, Record<string, number | string | null>>();
    for (const o of obs) {
      if (!geos.includes(o.geo)) continue;
      const r = m.get(o.period_date) ?? { label: periodLabel(o.period, lang), EL: null, CY: null, EU27_2020: null };
      r[o.geo] = o.value; m.set(o.period_date, r);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [obs, geos.join(","), lang]);
  const at = (geo: string) => obs.find((o) => o.geo === geo && o.period === common) ?? null;
  const latestOwn = (geo: string) => obs.filter((o) => o.geo === geo).sort((a, b) => b.period_date.localeCompare(a.period_date))[0] ?? null;
  return <Card>
    <CardHeader className="pb-2"><CardTitle className="text-lg font-serif">{ind.title[lang]}</CardTitle><p className="text-xs text-muted-foreground">{ind.note[lang]} {el ? "Μονάδα" : "Unit"}: {ind.unit[lang]}.</p></CardHeader>
    <CardContent className="space-y-4">
      {!ds || !common ? <p className="text-sm text-muted-foreground">{el ? "Μη διαθέσιμα δεδομένα" : "Data unavailable"}</p> : <>
        <p className="text-xs text-muted-foreground">{el ? "Τελευταία κοινή περίοδος" : "Latest common period"}: <span className="font-medium text-foreground">{periodLabel(common, lang)}</span></p>
        <div className={`grid gap-3 ${geos.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {geos.map((g) => { const o = at(g); const own = latestOwn(g); const flag = flagLabel(o?.status_flag, lang); return (
            <div key={g} className="border border-border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{GEO_NAMES[g][lang]}</p>
              <p className="text-2xl font-serif font-semibold">{formatValue(o?.value, ds.unit_label, ds.decimals, lang) ?? (el ? "Δεν έχει δημοσιευτεί" : "Not yet published")}</p>
              {flag && <p className="text-[11px] text-muted-foreground">{flag}</p>}
              {own && own.period !== common && <p className="text-[11px] text-muted-foreground">{el ? "Νεότερο" : "Newer"}: {formatValue(own.value, ds.unit_label, ds.decimals, lang)} ({periodLabel(own.period, lang)})</p>}
            </div>); })}
        </div>
        <div className="h-64" role="img" aria-label={`${ind.title[lang]}: ${geos.map((g) => GEO_NAMES[g][lang]).join(", ")}`}>
          <ResponsiveContainer><LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" fontSize={11} minTickGap={24} /><YAxis fontSize={11} />
            <RTooltip formatter={(v: number) => formatValue(v, ds.unit_label, ds.decimals, lang)} /><Legend />
            {geos.map((g) => <Line key={g} dataKey={g} name={GEO_NAMES[g][lang]} stroke={COLORS[g]} strokeWidth={g === "EU27_2020" ? 1.5 : 2.5} strokeDasharray={g === "EU27_2020" ? "4 3" : undefined} dot={false} connectNulls={false} isAnimationActive={false} />)}
          </LineChart></ResponsiveContainer>
        </div>
        <a href={databrowserUrl(ds.dataset_code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline">Eurostat {ds.dataset_code}<ExternalLink className="h-3 w-3" /></a>
      </>}
    </CardContent>
  </Card>;
}

export default function CompareGreeceCyprusPage() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("gr-lang") === "el" ? "el" : "en"));
  const change = (l: Lang) => { localStorage.setItem("gr-lang", l); setLang(l); };
  const [showEu, setShowEu] = useState(true);
  const q = useStatSeries(INDICATORS.map((i) => i.code));
  const el = lang === "el";
  return <div className="min-h-screen bg-background">
    <SEOHead title={el ? "Ελλάδα και Κύπρος: σύγκριση οικονομικών δεικτών | BusinessHub" : "Greece vs Cyprus: economic comparison | BusinessHub"}
      description={el ? "ΑΕΠ, πληθωρισμός και ανεργία σε Ελλάδα και Κύπρο, με τα ίδια στοιχεία Eurostat και την ίδια περίοδο αναφοράς." : "Real GDP growth, HICP inflation and unemployment in Greece and Cyprus, from the same Eurostat series and matching periods."}
      path="/compare/greece-cyprus" />
    <TopNavigation onSearch={() => {}} />
    <main className="container mx-auto px-4 py-8" lang={lang}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{el ? "Ελλάδα – Κύπρος" : "Greece – Cyprus"}</p>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => change("el")} className={el ? "font-bold" : "text-muted-foreground"}>EL</button>
          <button onClick={() => change("en")} className={!el ? "font-bold" : "text-muted-foreground"}>EN</button>
        </div>
      </div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1">{el ? "Σύγκριση οικονομικών δεικτών Ελλάδας – Κύπρου" : "Greece–Cyprus economic comparison"}</h1>
      <p className="text-muted-foreground mt-2 max-w-3xl">{el
        ? "Τα ίδια στοιχεία Eurostat, με την ίδια μεθοδολογία και μονάδες για τις δύο χώρες. Οι κύριες τιμές αφορούν την τελευταία περίοδο που έχει δημοσιευτεί και για τις δύο."
        : "The same Eurostat series, methodology and units for both countries. Headline figures use the latest period published for both."}</p>
      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
        <label className="flex items-center gap-2"><Switch checked={showEu} onCheckedChange={setShowEu} aria-label={el ? "Μέσος όρος ΕΕ" : "EU average"} />{el ? "Σύγκριση με τον μέσο όρο της ΕΕ-27" : "Show EU-27 benchmark"}</label>
        <Link to={grHref("/greece/business-pulse")} className="underline">{el ? "Οικονομικοί Δείκτες Ελλάδας" : "Greece Business Pulse"}</Link>
        <Link to="/economy" className="underline">{el ? "Οικονομία Κύπρου" : "Cyprus economy dashboard"}</Link>
      </div>
      {q.isError && <p className="text-sm text-muted-foreground mt-4">{el ? "Τα στοιχεία δεν φορτώθηκαν." : "Figures could not be loaded right now."}</p>}
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        {INDICATORS.map((ind) => <Indicator key={ind.code} ind={ind} ds={q.data?.datasets[ind.code]} obs={q.data?.obs[ind.code] ?? []} lang={lang} showEu={showEu} />)}
      </div>
      <p className="text-xs text-muted-foreground mt-6 max-w-4xl">{el
        ? "Πηγή: Eurostat (CC BY 4.0). Τα στοιχεία μητρώου επιχειρήσεων και τουρισμού παραμένουν στις σελίδες κάθε χώρας μέχρι να επαληθευτεί ότι οι ορισμοί τους είναι συγκρίσιμοι."
        : "Source: Eurostat (CC BY 4.0). Business-register and tourism figures stay on each country's own dashboard until their definitions are verified as comparable."}</p>
    </main>
    <Footer />
  </div>;
}
