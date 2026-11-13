import { Link, useParams } from "react-router-dom";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { ExploreBrowser } from "@/components/explore/ExploreBrowser";
import { SEOHead } from "@/components/SEOHead";
import { useExploreData } from "@/hooks/useExplore";
import { districtLabel, EL, pick } from "@/lib/explore";
import NotFound from "./NotFound";

export default function ExploreDestinationPage() {
  const { destination } = useParams();
  const { data, isLoading } = useExploreData();
  if (isLoading || !data) return <ExploreShell>{() => <p className="container mx-auto px-4 py-8 text-sm text-muted-foreground">…</p>}</ExploreShell>;
  const d = data.destinations.find((x) => x.slug === destination);
  if (!d) return <NotFound />;
  const parent = data.destinations.find((x) => x.id === d.parent_id);
  const kids = data.destinations.filter((x) => x.parent_id === d.id);
  return (
    <ExploreShell title={(lang) => pick(lang, d.name_en, d.name_el)}>
      {(lang) => (
        <div className="container mx-auto px-4 py-8">
          <SEOHead title={lang === "el" ? `${pick(lang, d.name_en, d.name_el)} — Τι να δείτε | Εξερευνήστε την Κύπρο` : `${d.name_en} — Things to do | Explore Cyprus`}
            description={(lang === "el" ? d.intro_el || d.intro_en || "" : d.intro_en ?? `Verified attractions and experiences in ${d.name_en}, Cyprus.`).slice(0, 158)} path={`/explore/${d.slug}`}
            breadcrumbs={[{ name: EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο"), href: "/explore" }, ...(parent ? [{ name: pick(lang, parent.name_en, parent.name_el), href: `/explore/${parent.slug}` }] : [])]} />
          <nav className="text-xs text-muted-foreground mb-4">
            <Link to="/explore" className="hover:underline">{EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}</Link>
            {parent && <> / <Link to={`/explore/${parent.slug}`} className="hover:underline">{pick(lang, parent.name_en, parent.name_el)}</Link></>}
            {" / "}{pick(lang, d.name_en, d.name_el)}
          </nav>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <h2 className="font-serif text-2xl font-bold mb-2">{pick(lang, d.name_en, d.name_el)}{d.name_el ? <span className="text-muted-foreground font-normal text-lg"> · {lang === "en" ? d.name_el : d.name_en}</span> : null}</h2>
              <p className="text-foreground/90">{pick(lang, d.intro_en, d.intro_el)}</p>
              {d.kind === "area" && d.districts.length > 1 && <p className="text-xs text-muted-foreground mt-2">{EL(lang, "Spans districts:", "Εκτείνεται στις επαρχίες:")} {d.districts.map((x) => districtLabel(x, lang)).join(", ")}</p>}
              {kids.length > 0 && (
                <div className="mt-3 flex gap-2">{kids.map((k) => <Link key={k.id} to={`/explore/${k.slug}`} className="border border-border px-3 py-1.5 text-sm hover:border-foreground">{pick(lang, k.name_en, k.name_el)}</Link>)}</div>
              )}
            </div>
            {d.image_url ? (
              <figure><img src={d.image_url} alt={pick(lang, d.name_en, d.name_el)} className="w-full aspect-[4/3] object-cover" />{d.image_credit && <figcaption className="text-[10px] text-muted-foreground mt-1">{d.image_credit}</figcaption>}</figure>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-secondary/30 via-muted to-primary/20" aria-hidden />
            )}
          </div>
          <ExploreBrowser listings={data.listings} destNameById={data.destNameById} lang={lang} destinationId={d.id} showDistrict={d.kind === "area"} />
        </div>
      )}
    </ExploreShell>
  );
}
