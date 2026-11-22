import { Link } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStatSeries } from "@/hooks/useStatSeries";
import { formatValue, latestWithYoy, periodLabel, seriesFor, type Lang } from "@/lib/greecePulse";
import { grLangHref } from "@/lib/edition";

/** Headline figures shown in the banner; each one names its own reference period. */
const HIGHLIGHTS = [
  { code: "gdp_growth", en: "Real GDP growth", el: "Αύξηση ΑΕΠ" },
  { code: "hicp_all", en: "Inflation", el: "Πληθωρισμός" },
  { code: "unemployment", en: "Unemployment", el: "Ανεργία" },
  { code: "gr_travellers", en: "Inbound travellers (thousand)", el: "Αφίξεις ταξιδιωτών (χιλ.)" },
] as const;

/** Top-of-homepage banner on the Greece edition promoting Greece Business Pulse. */
export function GreecePulseBanner({ lang }: { lang: Lang }) {
  const el = lang === "el";
  const q = useStatSeries(HIGHLIGHTS.map((h) => h.code));
  const figures = HIGHLIGHTS.map((h) => {
    const ds = q.data?.datasets[h.code];
    const { latest } = latestWithYoy(seriesFor(q.data?.obs[h.code] ?? [], "EL"), "points");
    const value = ds && latest ? formatValue(latest.value, ds.unit_label, ds.decimals, lang) : null;
    return value && latest ? { ...h, value, period: periodLabel(latest.period, lang) } : null;
  }).filter(Boolean) as (typeof HIGHLIGHTS[number] & { value: string; period: string })[];

  return (
    <section lang={lang} className="mb-8 rounded-lg bg-primary text-primary-foreground overflow-hidden">
      <div className="p-6 md:p-7 flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex items-start gap-4 lg:max-w-md">
          <Activity className="h-8 w-8 text-brand-sky shrink-0 mt-1" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-sky font-semibold">{el ? "Επίσημα στοιχεία" : "Official data"}</p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mt-1">{el ? "Οικονομικοί Δείκτες Ελλάδας" : "Greece Business Pulse"}</h2>
            <p className="text-sm opacity-85 mt-2">{el
              ? "Επίσημα στοιχεία για την ελληνική οικονομία. Κάθε κάρτα δείχνει την περίοδο αναφοράς της τελευταίας δημοσίευσης και την πηγή της."
              : "Official figures for the Greek economy. Each card shows the reference period of the latest release and its source."}</p>
          </div>
        </div>
        {figures.length > 0 && <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          {figures.map((f) => <div key={f.code} className="rounded-md bg-primary-foreground/10 px-3 py-2.5">
            <dt className="text-[11px] opacity-80 leading-snug">{el ? f.el : f.en}</dt>
            <dd className="font-serif text-xl font-semibold mt-0.5">{f.value}</dd>
            <dd className="text-[11px] opacity-70">{f.period}</dd>
          </div>)}
        </dl>}
        <Button asChild variant="secondary" className="shrink-0">
          <Link to={grLangHref("/greece/business-pulse", lang)}>
            {el ? "Δείτε όλους τους δείκτες" : "See all figures"} <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
