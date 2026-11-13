import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, List, Map as MapIcon } from "lucide-react";
import { ExploreMap } from "./ExploreMap";
import { Input } from "@/components/ui/input";
import type { Lang } from "@/lib/academy";
import { DISTRICTS, districtLabel, EL, EXPLORE_CATEGORIES, filterListings, type Listing } from "@/lib/explore";
import { ListingCard } from "./ListingCard";

/** Search + filters (URL-backed) over a listing set. */
export function ExploreBrowser({ listings, destNameById, lang, destinationId, showDistrict = true }: {
  listings: Listing[]; destNameById: Record<string, string[]>; lang: Lang; destinationId?: string; showDistrict?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "", category = params.get("category") ?? "", district = params.get("district") ?? "", locality = params.get("locality") ?? "";
  const view = params.get("view") === "map" ? "map" : "list";
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };
  const localities = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of listings) if (l.locality && (!destinationId || l.destination_ids?.includes(destinationId))) m.set(l.locality, l.locality_el || l.locality);
    return [...m.entries()].map(([value, el]) => ({ value, label: lang === "el" ? el : value })).sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [listings, destinationId, lang]);
  const results = filterListings(listings, { q, category, district, locality, destinationId }, destNameById);
  const sel = "h-10 border border-input bg-background px-3 text-sm";
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => set("q", e.target.value)} className="pl-9 rounded-none" aria-label={EL(lang, "Search", "Αναζήτηση")}
            placeholder={EL(lang, "Search places, e.g. Paphos, Agia Napa, castle…", "Αναζήτηση, π.χ. Πάφος, Αγία Νάπα, κάστρο…")} />
        </div>
        <select aria-label={EL(lang, "Category", "Κατηγορία")} className={sel} value={category} onChange={(e) => set("category", e.target.value)}>
          <option value="">{EL(lang, "All categories", "Όλες οι κατηγορίες")}</option>
          {EXPLORE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}
        </select>
        {showDistrict && (
          <select aria-label={EL(lang, "District", "Επαρχία")} className={sel} value={district} onChange={(e) => set("district", e.target.value)}>
            <option value="">{EL(lang, "All districts", "Όλες οι επαρχίες")}</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{districtLabel(d, lang)}</option>)}
          </select>
        )}
        <select aria-label={EL(lang, "Locality", "Περιοχή")} className={sel} value={locality} onChange={(e) => set("locality", e.target.value)}>
          <option value="">{EL(lang, "All localities", "Όλες οι περιοχές")}</option>
          {localities.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{results.length} {EL(lang, "places", "μέρη")}</p>
        <div className="inline-flex border border-border" role="group" aria-label={EL(lang, "View", "Προβολή")}>
          <button type="button" onClick={() => set("view", "")} aria-pressed={view === "list"} className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}><List className="h-3.5 w-3.5" />{EL(lang, "List", "Λίστα")}</button>
          <button type="button" onClick={() => set("view", "map")} aria-pressed={view === "map"} className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground"}`}><MapIcon className="h-3.5 w-3.5" />{EL(lang, "Map", "Χάρτης")}</button>
        </div>
      </div>
      {view === "map" ? <ExploreMap listings={results} lang={lang} /> : results.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{results.map((l) => <ListingCard key={l.id} l={l} lang={lang} />)}</div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">{EL(lang, "No verified places match yet.", "Δεν υπάρχουν ακόμη επιβεβαιωμένα μέρη.")}</p>
      )}
    </div>
  );
}
