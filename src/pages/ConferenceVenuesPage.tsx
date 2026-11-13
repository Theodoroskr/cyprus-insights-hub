import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { List, Map as MapIcon, Search } from "lucide-react";
import { ExploreShell } from "@/components/explore/ExploreShell";
import { ExploreMap } from "@/components/explore/ExploreMap";
import { ListingCard } from "@/components/explore/ListingCard";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { useExploreData, useIsTourismEditor } from "@/hooks/useExplore";
import { DISTRICTS, districtLabel, EL, filterListings, maxCapacity, ROOM_LAYOUTS, venueFits, type RoomLayout } from "@/lib/explore";

export default function ConferenceVenuesPage() {
  const { data, isLoading } = useExploreData();
  const editor = useIsTourismEditor();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "", district = params.get("district") ?? "";
  const layout = (ROOM_LAYOUTS.some((x) => x.id === params.get("layout")) ? params.get("layout") : "") as RoomLayout | "";
  const delegates = Math.max(0, parseInt(params.get("delegates") ?? "", 10) || 0) || null;
  const view = params.get("view") === "map" ? "map" : "list";
  const update = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };
  const rooms = data?.roomsByListing ?? {};
  const venues = useMemo(() => (data?.listings ?? []).filter((l) => l.category === "conference-venues"), [data]);
  const results = filterListings(venues, { q, district }).filter((l) => venueFits(rooms[l.id] ?? [], delegates, layout));
  const sel = "h-10 border border-input bg-background px-3 text-sm";
  return (
    <ExploreShell title={(lang) => EL(lang, "Conference Venues", "Χώροι συνεδρίων")}>
      {(lang) => (
        <div className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
          <SEOHead title={EL(lang, "Conference Venues in Cyprus — rooms, capacity & quotes | TourismHub.cy", "Χώροι συνεδρίων στην Κύπρο — αίθουσες, χωρητικότητα & προσφορές | TourismHub.cy")}
            description={EL(lang, "Compare Cyprus conference venues by district, delegate count and room layout, using capacities published by each venue.", "Συγκρίνετε χώρους συνεδρίων στην Κύπρο ανά επαρχία, αριθμό συνέδρων και διάταξη αίθουσας, με βάση τις χωρητικότητες που δημοσιεύει κάθε χώρος.")}
            path="/explore/conference-venues" breadcrumbs={[{ name: EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο"), href: "/explore" }]} />
          <nav className="text-xs text-muted-foreground mb-3">
            <Link to="/explore" className="hover:underline">{EL(lang, "Explore Cyprus", "Εξερευνήστε την Κύπρο")}</Link> / {EL(lang, "Conference Venues", "Χώροι συνεδρίων")}
          </nav>
          <p className="text-foreground/90 max-w-3xl mb-5">{EL(lang, "Room capacities are shown exactly as each venue publishes them. Request a quote straight from a venue's page once we have confirmed its business email.", "Οι χωρητικότητες εμφανίζονται όπως τις δημοσιεύει κάθε χώρος. Ζητήστε προσφορά από τη σελίδα του χώρου μόλις επιβεβαιώσουμε το επαγγελματικό του email.")}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => update("q", e.target.value)} className="pl-9 rounded-none" aria-label={EL(lang, "Search", "Αναζήτηση")} placeholder={EL(lang, "Search venues", "Αναζήτηση χώρων")} />
            </div>
            <select aria-label={EL(lang, "District", "Επαρχία")} className={sel} value={district} onChange={(e) => update("district", e.target.value)}>
              <option value="">{EL(lang, "All districts", "Όλες οι επαρχίες")}</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{districtLabel(d, lang)}</option>)}
            </select>
            <Input type="number" min={1} inputMode="numeric" value={delegates ?? ""} onChange={(e) => update("delegates", e.target.value)} className="w-36 rounded-none" aria-label={EL(lang, "Delegates", "Σύνεδροι")} placeholder={EL(lang, "Delegates", "Σύνεδροι")} />
            <select aria-label={EL(lang, "Room layout", "Διάταξη")} className={sel} value={layout} onChange={(e) => update("layout", e.target.value)}>
              <option value="">{EL(lang, "Any layout", "Οποιαδήποτε διάταξη")}</option>
              {ROOM_LAYOUTS.map((x) => <option key={x.id} value={x.id}>{x[lang]}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">{results.length} {EL(lang, "venues", "χώροι")}{(delegates || layout) ? EL(lang, " · only venues that publish a fitting room", " · μόνο χώροι με δημοσιευμένη κατάλληλη αίθουσα") : ""}</p>
            <div className="inline-flex border border-border" role="group" aria-label={EL(lang, "View", "Προβολή")}>
              <button type="button" onClick={() => update("view", "")} aria-pressed={view === "list"} className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}><List className="h-3.5 w-3.5" />{EL(lang, "List", "Λίστα")}</button>
              <button type="button" onClick={() => update("view", "map")} aria-pressed={view === "map"} className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground"}`}><MapIcon className="h-3.5 w-3.5" />{EL(lang, "Map", "Χάρτης")}</button>
            </div>
          </div>
          {isLoading ? <p className="text-sm text-muted-foreground">…</p> : view === "map" ? <ExploreMap listings={results} lang={lang} /> : results.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{results.map((l) => {
              const cap = maxCapacity(rooms[l.id] ?? [], layout);
              return <ListingCard key={l.id} l={l} lang={lang} editor={editor} extra={cap ? EL(lang, `Up to ${cap} delegates${layout ? ` (${ROOM_LAYOUTS.find((x) => x.id === layout)!.en.toLowerCase()})` : ""}`, `Έως ${cap} σύνεδροι`) : null} />;
            })}</div>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">{EL(lang, "No confirmed venues match these filters yet.", "Δεν υπάρχουν ακόμη επιβεβαιωμένοι χώροι για αυτά τα φίλτρα.")}</p>}
        </div>
      )}
    </ExploreShell>
  );
}
