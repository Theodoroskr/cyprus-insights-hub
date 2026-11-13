import { Link, useParams } from "react-router-dom";
import { ExternalLink, Navigation } from "lucide-react";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { SEOHead } from "@/components/SEOHead";
import { useExploreData } from "@/hooks/useExplore";
import { catLabel, directionsUrl, EL, pick, placeLine } from "@/lib/explore";
import NotFound from "./NotFound";

export default function ExplorePlacePage() {
  const { slug } = useParams();
  const { data, isLoading } = useExploreData();
  if (isLoading || !data) return <ExploreShell>{() => <p className="container mx-auto px-4 py-8 text-sm text-muted-foreground">…</p>}</ExploreShell>;
  const l = data.listings.find((x) => x.slug === slug);
  if (!l) return <NotFound />;
  const dests = data.destinations.filter((d) => l.destination_ids?.includes(d.id));
  return (
    <ExploreShell title={(lang) => pick(lang, l.name_en, l.name_el)}>
      {(lang) => {
        const rows: [string, string | null][] = [
          [EL(lang, "Opening hours", "Ωράριο"), pick(lang, l.opening_hours, l.opening_hours_el) || null],
          [EL(lang, "Admission", "Είσοδος"), pick(lang, l.admission, l.admission_el) || null],
          [EL(lang, "Accessibility", "Προσβασιμότητα"), pick(lang, l.accessibility, l.accessibility_el) || null],
          [EL(lang, "Parking", "Στάθμευση"), pick(lang, l.parking, l.parking_el) || null],
          [EL(lang, "Address", "Διεύθυνση"), pick(lang, l.address, l.address_el) || null],
        ];
        return (
          <article className="container mx-auto px-4 py-8 max-w-3xl">
            <SEOHead title={`${pick(lang, l.name_en, l.name_el)} — ${placeLine(l, lang)} | ${EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}`} description={(pick(lang, l.summary_en, l.summary_el) || l.name_en).slice(0, 158)} path={`/explore/place/${l.slug}`}
              breadcrumbs={[{ name: EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο"), href: "/explore" }, ...(dests[0] ? [{ name: pick(lang, dests[0].name_en, dests[0].name_el), href: `/explore/${dests[0].slug}` }] : [])]} />
            <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary mb-1">{catLabel(l.category, lang)}</p>
            <h2 className="font-serif text-3xl font-bold">{pick(lang, l.name_en, l.name_el)}</h2>
            {lang === "en" && l.name_el && <p className="text-muted-foreground">{l.name_el}</p>}
            {lang === "el" && l.name_el && <p className="text-muted-foreground">{l.name_en}</p>}
            <p className="text-sm text-muted-foreground mt-1">{placeLine(l, lang)}</p>
            <p className="mt-4 text-foreground/90">{pick(lang, l.summary_en, l.summary_el)}</p>
            <dl className="mt-6 border-t border-border">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid sm:grid-cols-[160px_1fr] gap-1 py-2 border-b border-border text-sm">
                  <dt className="font-semibold">{k}</dt><dd className="text-foreground/90">{v}</dd>
                </div>
              ))}
              {!pick(lang, l.opening_hours, l.opening_hours_el) && (
                <p className="py-2 text-sm text-muted-foreground border-b border-border">{EL(lang, "Hours and access vary — check the official page before visiting.", "Ωράρια και πρόσβαση διαφέρουν — ελέγξτε την επίσημη σελίδα.")}</p>
              )}
            </dl>
            <div className="flex flex-wrap gap-2 mt-6">
              {l.official_url && <a href={l.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-foreground text-background px-4 py-2 text-sm font-semibold"><ExternalLink className="h-4 w-4" />{EL(lang, "Official page", "Επίσημη σελίδα")}</a>}
              {l.booking_url && <a href={l.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 border border-foreground px-4 py-2 text-sm font-semibold">{EL(lang, "Book", "Κράτηση")}</a>}
              <a href={directionsUrl(l)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 border border-border px-4 py-2 text-sm"><Navigation className="h-4 w-4" />{EL(lang, "Directions", "Οδηγίες")}</a>
            </div>
            {dests.length > 0 && (
              <p className="mt-6 text-sm">{EL(lang, "Part of:", "Ανήκει σε:")} {dests.map((d, i) => <span key={d.id}>{i > 0 && ", "}<Link to={`/explore/${d.slug}`} className="text-secondary hover:underline">{pick(lang, d.name_en, d.name_el)}</Link></span>)}</p>
            )}
            <p className="mt-6 text-xs text-muted-foreground">
              {EL(lang, "Source:", "Πηγή:")} {l.source_url ? <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="underline">{new URL(l.source_url).hostname.replace(/^www\./, "")}</a> : "—"}
              {l.last_verified_at && <> · {EL(lang, "Last verified", "Τελευταίος έλεγχος")} {new Date(l.last_verified_at).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}</>}
            </p>
          </article>
        );
      }}
    </ExploreShell>
  );
}
