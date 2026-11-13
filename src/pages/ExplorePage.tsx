import { Link } from "react-router-dom";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { ExploreBrowser } from "@/components/explore/ExploreBrowser";
import { SEOHead } from "@/components/SEOHead";
import { useExploreData } from "@/hooks/useExplore";
import { EL, EXPLORE_CATEGORIES, pick } from "@/lib/explore";
import { HubLeadStories } from "@/components/hub/HubLeadStories";

export default function ExplorePage() {
  const { data, isLoading } = useExploreData();
  const top = (data?.destinations ?? []).filter((d) => !d.parent_id);
  return (
    <ExploreShell masthead>
      {(lang) => (
        <>
        <HubLeadStories brand="tourismhub" topic="tourism" allNewsHref="/search?q=tourism" />
        <div className="container mx-auto px-4 py-8">
          <SEOHead title={EL(lang, "Explore Cyprus — Destinations, Attractions & Experiences | TourismHub.cy", "Εξερευνήστε την Κύπρο — Προορισμοί, αξιοθέατα & εμπειρίες | TourismHub.cy")} description={EL(lang, "Verified guide to Nicosia, Limassol, Larnaka, Pafos, Famagusta (Ayia Napa, Protaras) and Troodos: museums, beaches, trails and more, with official links.", "Επιβεβαιωμένος οδηγός για Λευκωσία, Λεμεσό, Λάρνακα, Πάφο, Αμμόχωστο (Αγία Νάπα, Πρωταράς) και Τρόοδος: μουσεία, παραλίες, μονοπάτια και άλλα, με επίσημους συνδέσμους.")} path="/explore" />
          <h2 className="section-label mb-3">{EL(lang, "Destinations", "Προορισμοί")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {top.map((d) => {
              const kids = data!.destinations.filter((k) => k.parent_id === d.id);
              const n = data!.listings.filter((l) => l.destination_ids?.includes(d.id)).length;
              return (
                <div key={d.id} className="border border-border bg-card">
                  <Link to={`/explore/${d.slug}`} className="block p-4 hover:bg-muted transition-colors">
                    <div className="aspect-[4/3] mb-3 bg-gradient-to-br from-secondary/30 via-muted to-primary/20 flex items-end p-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n} {EL(lang, "places", "μέρη")}</span>
                    </div>
                    <p className="font-serif text-lg font-bold text-foreground">{pick(lang, d.name_en, d.name_el)}</p>
                  </Link>
                  {kids.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-x-3 text-xs">
                      {kids.map((k) => <Link key={k.id} to={`/explore/${k.slug}`} className="text-secondary hover:underline">{pick(lang, k.name_en, k.name_el)}</Link>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid md:grid-cols-2 gap-3 mb-8">
            <Link to={`/explore/nicosia-countryside${lang === "el" ? "?lang=el" : ""}`} className="block border border-foreground bg-card p-5 hover:bg-muted transition-colors">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary">{EL(lang, "New · Map & list", "Νέο · Χάρτης & λίστα")}</p>
              <p className="font-serif text-xl font-bold">{EL(lang, "Nicosia City & Countryside", "Λευκωσία — Πόλη και Ύπαιθρος")}</p>
              <p className="text-sm text-muted-foreground">{EL(lang, "Villages, heritage sites, stays, events and routes — starting with Fikardou.", "Χωριά, μνημεία, διαμονή, εκδηλώσεις και διαδρομές — ξεκινώντας από το Φικάρδου.")}</p>
            </Link>
            <Link to={`/explore/conference-venues${lang === "el" ? "?lang=el" : ""}`} className="block border border-border bg-card p-5 hover:border-foreground transition-colors">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary">{EL(lang, "For organisers", "Για διοργανωτές")}</p>
              <p className="font-serif text-xl font-bold">{EL(lang, "Conference Venues", "Χώροι συνεδρίων")}</p>
              <p className="text-sm text-muted-foreground">{EL(lang, "Rooms and capacity by layout, as published by each venue.", "Αίθουσες και χωρητικότητα ανά διάταξη, όπως τις δημοσιεύει κάθε χώρος.")}</p>
            </Link>
          </div>
          <h2 className="section-label mb-3">{EL(lang, "Categories", "Κατηγορίες")}</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {EXPLORE_CATEGORIES.map((c) => (
              <Link key={c.id} to={`/explore?category=${c.id}`} className="border border-border px-3 py-1.5 text-sm hover:border-foreground">{c[lang]}</Link>
            ))}
          </div>
          <h2 className="section-label mb-3">{EL(lang, "All places", "Όλα τα μέρη")}</h2>
          {isLoading || !data ? <p className="text-sm text-muted-foreground">…</p> : <ExploreBrowser listings={data.listings} destNameById={data.destNameById} lang={lang} />}
        </div>
        </>
      )}
    </ExploreShell>
  );
}
