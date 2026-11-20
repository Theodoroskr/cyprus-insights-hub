import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, Tooltip as RTooltip, YAxis } from "recharts";
import { ArrowRightLeft, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { databrowserUrl } from "@/lib/eurostatView";
import { formatValue, isStale, latestWithYoy, periodLabel, seriesFor, tradeBalance, type Lang, type PulseObs } from "@/lib/greecePulse";
import { flagLabel, useStatSeries } from "@/hooks/useStatSeries";
import { grHref } from "@/lib/edition";

type Bi = { en: string; el: string };
type PulseCard =
  | { id: string; title: Bi; code: string; unit: Bi; yoy: "points" | "percent"; source: { label: string; href: string }[]; emptyNote?: Bi }
  | { id: string; title: Bi; balance: true; source: { label: string; href: string }[] };

const ELSTAT = { label: "ELSTAT", href: "https://www.statistics.gr/en/home/" };
const EUROSTAT = (code: string) => ({ label: `Eurostat ${code}`, href: databrowserUrl(code) });
const GEMI = { label: "GEMI", href: "https://opendata.businessportal.gr/" };
const BOG = { label: "Bank of Greece", href: "https://www.bankofgreece.gr/en/statistics/external-sector/balance-of-payments/travel-services" };
const GEMI_WAITING: Bi = { en: "Waiting for the first import from the GEMI register.", el: "Αναμένεται η πρώτη εισαγωγή από το ΓΕΜΗ." };
const BOG_WAITING: Bi = { en: "Waiting for the Bank of Greece file to be imported.", el: "Αναμένεται η εισαγωγή του αρχείου της Τράπεζας της Ελλάδος." };

export const PULSE_CARDS: PulseCard[] = [
  { id: "gdp", title: { en: "Real GDP growth", el: "Πραγματική αύξηση ΑΕΠ" }, code: "gdp_growth", unit: { en: "% vs same quarter last year", el: "% σε ετήσια βάση (τρίμηνο)" }, yoy: "points", source: [EUROSTAT("namq_10_gdp")] },
  { id: "hicp", title: { en: "HICP inflation", el: "Πληθωρισμός (ΕνΔΤΚ)" }, code: "hicp_all", unit: { en: "% vs same month last year", el: "% σε ετήσια βάση" }, yoy: "points", source: [EUROSTAT("prc_hicp_minr")] },
  { id: "unemployment", title: { en: "Unemployment rate", el: "Ποσοστό ανεργίας" }, code: "unemployment", unit: { en: "% of labour force, seasonally adjusted", el: "% του εργατικού δυναμικού, εποχικά προσαρμοσμένο" }, yoy: "points", source: [EUROSTAT("une_rt_m")] },
  { id: "exports", title: { en: "Goods exports", el: "Εξαγωγές αγαθών" }, code: "gr_goods_exports", unit: { en: "€ million, all partner countries", el: "€ εκατ., προς όλες τις χώρες" }, yoy: "percent", source: [ELSTAT, EUROSTAT("ei_eteu27_2020_m")] },
  { id: "imports", title: { en: "Goods imports", el: "Εισαγωγές αγαθών" }, code: "gr_goods_imports", unit: { en: "€ million, all partner countries", el: "€ εκατ., από όλες τις χώρες" }, yoy: "percent", source: [ELSTAT, EUROSTAT("ei_eteu27_2020_m")] },
  { id: "balance", title: { en: "Goods trade balance", el: "Εμπορικό ισοζύγιο αγαθών" }, balance: true, source: [ELSTAT, EUROSTAT("ei_eteu27_2020_m")] },
  { id: "active-businesses", title: { en: "Active registered businesses", el: "Ενεργές εγγεγραμμένες επιχειρήσεις" }, code: "gr_gemi_active", unit: { en: "businesses with active status in GEMI", el: "επιχειρήσεις σε ενεργή κατάσταση στο ΓΕΜΗ" }, yoy: "percent", source: [GEMI], emptyNote: GEMI_WAITING },
  { id: "new-registrations", title: { en: "New business registrations", el: "Νέες εγγραφές επιχειρήσεων" }, code: "gr_gemi_new", unit: { en: "businesses incorporated in the month", el: "επιχειρήσεις που συστάθηκαν τον μήνα" }, yoy: "percent", source: [GEMI], emptyNote: GEMI_WAITING },
  { id: "travellers", title: { en: "Inbound travellers", el: "Αφίξεις ταξιδιωτών από το εξωτερικό" }, code: "gr_travellers", unit: { en: "thousand non-resident travellers", el: "χιλ. ταξιδιώτες μη κάτοικοι" }, yoy: "percent", source: [BOG], emptyNote: BOG_WAITING },
  { id: "receipts", title: { en: "Travel receipts", el: "Ταξιδιωτικές εισπράξεις" }, code: "gr_travel_receipts", unit: { en: "€ million spent by visitors in Greece", el: "€ εκατ. δαπάνες επισκεπτών στην Ελλάδα" }, yoy: "percent", source: [BOG, EUROSTAT("bop_c6_q")] },
];

const t = (lang: Lang, b: Bi) => b[lang];

function Spark({ series, unit, decimals, lang }: { series: PulseObs[]; unit: string; decimals: number; lang: Lang }) {
  const data = series.slice(-24).map((o) => ({ p: periodLabel(o.period, lang), v: o.value }));
  if (data.length < 2) return null;
  return <div className="h-14 -mx-1" aria-hidden="true">
    <ResponsiveContainer><LineChart data={data}>
      <YAxis hide domain={["auto", "auto"]} />
      <RTooltip formatter={(v: number) => formatValue(v, unit, decimals, lang)} labelFormatter={(_, p) => p?.[0]?.payload?.p ?? ""} />
      <Line dataKey="v" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer>
  </div>;
}

function Sources({ list }: { list: { label: string; href: string }[] }) {
  return <p className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">{list.map((s) => (
    <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">{s.label}<ExternalLink className="h-2.5 w-2.5" /></a>))}</p>;
}

export function BusinessPulse({ lang }: { lang: Lang }) {
  const el = lang === "el";
  const q = useStatSeries(["gdp_growth", "hicp_all", "unemployment", "gr_goods_exports", "gr_goods_imports", "gr_gemi_active", "gr_gemi_new", "gr_travellers", "gr_travel_receipts"]);
  const unavailable = el ? "Μη διαθέσιμα δεδομένα" : "Data unavailable";

  const body = (c: PulseCard) => {
    const ex = q.data?.datasets["gr_goods_exports"];
    const ds = "code" in c ? q.data?.datasets[c.code] : ex;
    const series = "code" in c
      ? seriesFor(q.data?.obs[c.code] ?? [], "EL")
      : tradeBalance(seriesFor(q.data?.obs["gr_goods_exports"] ?? [], "EL"), seriesFor(q.data?.obs["gr_goods_imports"] ?? [], "EL"));
    if (!ds || !series.length) return <>
      <p className="text-xl font-semibold font-serif text-muted-foreground">{q.isLoading ? "…" : unavailable}</p>
      {!q.isLoading && "emptyNote" in c && c.emptyNote && <p className="text-xs text-muted-foreground flex gap-1"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{t(lang, c.emptyNote)}</p>}
    </>;
    const unit = ds.unit_label;
    const { latest, change } = latestWithYoy(series, "code" in c ? c.yoy : "points");
    const stale = latest ? isStale(latest.period_date, ds.frequency, ds.last_success_at) : false;
    const flag = flagLabel(latest?.status_flag, lang);
    const unitText = "code" in c ? t(lang, c.unit) : (el ? "€ εκατ., εξαγωγές − εισαγωγές" : "€ million, exports − imports");
    const changeText = change == null ? null
      : "code" in c && c.yoy === "percent" ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
      : unit.startsWith("%") ? `${change > 0 ? "+" : ""}${change.toFixed(1)} ${el ? "μον." : "pts"}`
      : `${change > 0 ? "+" : ""}${formatValue(change, unit, 1, lang)}`;
    return <>
      <p className="text-2xl font-semibold font-serif">{formatValue(latest?.value, unit, ds.decimals, lang) ?? unavailable}</p>
      <p className="text-xs text-muted-foreground">{latest ? periodLabel(latest.period, lang) : "—"} · {unitText}{flag ? ` · ${flag}` : ""}</p>
      {changeText && <p className="text-xs"><span className="font-medium">{changeText}</span> <span className="text-muted-foreground">{el ? "σε σχέση με ένα χρόνο πριν" : "vs a year earlier"}</span></p>}
      {stale && <Badge variant="outline" className="w-fit text-[10px] gap-1"><Clock className="h-3 w-3" />{el ? "Εκκρεμεί νέα δημοσίευση" : "Out of date"}{ds.last_success_at ? ` · ${el ? "τελ. ενημέρωση" : "last refresh"} ${new Date(ds.last_success_at).toLocaleDateString(el ? "el-GR" : "en-GB")}` : ""}</Badge>}
      <Spark series={series} unit={unit} decimals={ds.decimals} lang={lang} />
    </>;
  };

  const last = Object.values(q.data?.datasets ?? {}).map((d) => d.last_success_at).filter(Boolean).sort().pop();
  return <div lang={lang}>
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">{el ? "Οικονομικοί Δείκτες Ελλάδας" : "Greece Business Pulse"}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">{el
          ? "Επίσημα στοιχεία για την ελληνική οικονομία. Κάθε κάρτα δείχνει την περίοδο αναφοράς της τελευταίας δημοσίευσης και την πηγή της."
          : "Official figures for the Greek economy. Each card shows the reference period of the latest release and its source."}</p>
      </div>
      <Link to="/compare/greece-cyprus" className="inline-flex items-center gap-2 border border-border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"><ArrowRightLeft className="h-4 w-4" />{el ? "Σύγκριση με την Κύπρο" : "Compare with Cyprus"}</Link>
    </div>
    {q.isError && <p className="text-sm text-muted-foreground mb-4">{el ? "Τα στοιχεία δεν φορτώθηκαν. Δοκιμάστε ξανά αργότερα." : "Figures could not be loaded right now. Please try again later."}</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {PULSE_CARDS.map((c) => <Card key={c.id}><CardContent className="p-4 space-y-1.5 flex flex-col h-full">
        <p className="text-xs font-medium text-muted-foreground leading-snug">{t(lang, c.title)}</p>
        <div className="space-y-1 flex-1">{body(c)}</div>
        <Sources list={c.source} />
      </CardContent></Card>)}
    </div>
    <p className="text-xs text-muted-foreground mt-6 max-w-4xl">{el
      ? "Πηγές: Eurostat (CC BY 4.0), ΕΛΣΤΑΤ μέσω Eurostat, Τράπεζα της Ελλάδος (Έρευνα Συνόρων, CC BY 4.0) και ανοικτά δεδομένα ΓΕΜΗ. Ελέγχονται καθημερινά· οι αναθεωρήσεις παλαιότερων τιμών ελέγχονται πριν αλλάξουν εδώ. Περίοδοι που δεν έχουν δημοσιευτεί δεν εμφανίζονται ποτέ ως μηδέν."
      : "Sources: Eurostat (CC BY 4.0), ELSTAT via Eurostat, Bank of Greece (Border Survey, CC BY 4.0) and GEMI open data. Checked daily; revisions to past figures are reviewed before they change here. Periods not yet published are never shown as zero."}
      {last && <> {el ? "Τελευταία επιτυχής ενημέρωση" : "Last successful refresh"} {new Date(last).toLocaleString(el ? "el-GR" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}.</>}
      {" "}<Link to={grHref("/greece/opportunities")} className="underline">{el ? "Δημόσιοι διαγωνισμοί →" : "Public tenders →"}</Link></p>
  </div>;
}
