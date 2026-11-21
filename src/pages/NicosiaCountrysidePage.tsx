import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { ListingCard } from "@/components/explore/ListingCard";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { useExploreData, useIsTourismEditor } from "@/hooks/useExplore";
import { EL, filterListings, needsCoords, NICOSIA_FILTERS, nicosiaListings } from "@/lib/explore";

export const NICOSIA_TITLE = { en: "Nicosia City & Countryside", el: "Λευκωσία — Πόλη και Ύπαιθρος" };

/** Bilingual Nicosia pilot: one filtered set drives the list; filters live in the address so they survive reloads and shared links. */
export default function NicosiaCountrysidePage() {
  const { data, isLoading } = useExploreData();
  const editor = useIsTourismEditor();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const types = (params.get("types") ?? "").split(",").filter(Boolean);
  const update = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };
  const toggle = (id: string) => update("types", (types.includes(id) ? types.filter((t) => t !== id) : [...types, id]).join(","));

  const pool = useMemo(() => nicosiaListings(data?.listings ?? []), [data]);
  const results = useMemo(() => filterListings(pool, { q }, data?.destNameById).filter((l) => !types.length || types.includes(l.category)), [pool, q, types.join(","), data]); // eslint-disable-line react-hooks/exhaustive-deps
  const missing = results.filter(needsCoords).length;

  return (
    <ExploreShell title={(lang) => NICOSIA_TITLE[lang]}>
      {(lang) => (
        <div className="container mx-auto px-4 py-6 pb-8">
          <SEOHead title={EL(lang, "Nicosia City & Countryside — villages, heritage, stays, events & routes | TourismHub.cy", "Λευκωσία — Πόλη και Ύπαιθρος: χωριά, μνημεία, διαμονή, εκδηλώσεις & διαδρομές | TourismHub.cy")}
            description={EL(lang, "A checked list of Nicosia's villages, heritage sites, museums, places to stay, events and routes — each against an official source.", "Λίστα με χωριά, μνημεία, μουσεία, διαμονή, εκδηλώσεις και διαδρομές της Λευκωσίας — όλα ελεγμένα από επίσημη πηγή.")}
            path="/explore/nicosia-countryside" breadcrumbs={[{ name: EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο"), href: "/explore" }]} />
          <nav className="text-xs text-muted-foreground mb-3">
            <Link to="/explore" className="hover:underline">{EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}</Link> / {NICOSIA_TITLE[lang]}
          </nav>
          <p className="text-foreground/90 max-w-3xl mb-5">
            {EL(lang, "From the walled capital to the stone villages of the Troodos foothills: heritage sites, licensed places to stay, village events and official wine routes across Nicosia district.",
              "Από την περιτειχισμένη πρωτεύουσα μέχρι τα πέτρινα χωριά στους πρόποδες του Τροόδους: μνημεία, αδειοδοτημένα καταλύματα, εκδηλώσεις χωριών και επίσημες οινικές διαδρομές σε όλη την επαρχία Λευκωσίας.")}
          </p>

          <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border mb-4">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => update("q", e.target.value)} className="pl-9 rounded-none" aria-label={EL(lang, "Search", "Αναζήτηση")}
                placeholder={EL(lang, "Search in English or Greek, e.g. Fikardou, Φικάρδου, wine…", "Αναζήτηση στα ελληνικά ή αγγλικά, π.χ. Φικάρδου, Fikardou, κρασί…")} />
            </div>
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={EL(lang, "Filter by type", "Φίλτρο ανά τύπο")}>
              <button type="button" onClick={() => update("types", "")} aria-pressed={!types.length}
                className={`shrink-0 px-3 py-1.5 text-xs border ${!types.length ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{EL(lang, "All", "Όλα")}</button>
              {NICOSIA_FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => toggle(f.id)} aria-pressed={types.includes(f.id)}
                  className={`shrink-0 px-3 py-1.5 text-xs border ${types.includes(f.id) ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}>
                  {f[lang]} <span className="opacity-60">({pool.filter((l) => l.category === f.id).length})</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {results.length} {EL(lang, "places", "μέρη")}
            {editor && missing > 0 && <span className="text-destructive font-semibold"> · {missing} need coordinates</span>}
          </p>

          {isLoading ? <p className="text-sm text-muted-foreground">…</p> : results.length ? (
            <div className="grid sm:grid-cols-2 gap-4">{results.map((l) => <ListingCard key={l.id} l={l} lang={lang} editor={editor} />)}</div>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">{EL(lang, "No confirmed places match yet.", "Δεν υπάρχουν ακόμη επιβεβαιωμένα μέρη.")}</p>}
        </div>
      )}
    </ExploreShell>
  );
}
