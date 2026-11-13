import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import type { Lang } from "@/lib/academy";
import { catLabel, currentEdition, dateRange, EL, pastEditions, pick, placeLine, ROOM_LAYOUTS, type EventEdition, type Listing, type ListingLink, type VenueRoom } from "@/lib/explore";

const href = (l: Listing, lang: Lang) => `/explore/place/${l.slug}${lang === "el" ? "?lang=el" : ""}`;

const SECTIONS = [
  { rel: "heritage", en: "Heritage sites", el: "Μνημεία & μουσεία" },
  { rel: "stay", en: "Nearby stays", el: "Διαμονή κοντά" },
  { rel: "event", en: "Upcoming events", el: "Επερχόμενες εκδηλώσεις" },
  { rel: "route", en: "Related routes", el: "Σχετικές διαδρομές" },
] as const;

/** Reusable village template: linked heritage, stays, events and routes. Empty sections say so instead of disappearing. */
export function VillageSections({ l, lang, listings, links, editions }: { l: Listing; lang: Lang; listings: Listing[]; links: ListingLink[]; editions: EventEdition[] }) {
  const byId = new Map(listings.map((x) => [x.id, x]));
  return (
    <div className="mt-8 grid sm:grid-cols-2 gap-6">
      {SECTIONS.map((s) => {
        const items = links.filter((k) => k.from_listing_id === l.id && k.relation === s.rel).map((k) => byId.get(k.to_listing_id)).filter(Boolean) as Listing[];
        return (
          <section key={s.rel} aria-labelledby={`sec-${s.rel}`}>
            <h3 id={`sec-${s.rel}`} className="section-label mb-2">{s[lang]}</h3>
            {items.length ? (
              <ul className="space-y-2">{items.map((x) => {
                const ed = s.rel === "event" ? currentEdition(editions.filter((e) => e.listing_id === x.id)) : null;
                return (
                  <li key={x.id} className="border border-border p-3">
                    <Link to={href(x, lang)} className="font-semibold hover:underline">{pick(lang, x.name_en, x.name_el)}</Link>
                    <p className="text-xs text-muted-foreground">{catLabel(x.category, lang)} · {placeLine(x, lang)}</p>
                    {s.rel === "event" && <p className="text-xs mt-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" />{ed ? dateRange(ed, lang) : EL(lang, "Next dates not confirmed yet", "Οι επόμενες ημερομηνίες δεν έχουν επιβεβαιωθεί")}</p>}
                  </li>
                );
              })}</ul>
            ) : <p className="text-sm text-muted-foreground">{EL(lang, "Nothing confirmed yet.", "Τίποτα επιβεβαιωμένο ακόμη.")}</p>}
          </section>
        );
      })}
    </div>
  );
}

/** Places that link to this one (e.g. the village an event or route belongs to). */
export function LinkedFrom({ l, lang, listings, links }: { l: Listing; lang: Lang; listings: Listing[]; links: ListingLink[] }) {
  const byId = new Map(listings.map((x) => [x.id, x]));
  const from = links.filter((k) => k.to_listing_id === l.id).map((k) => byId.get(k.from_listing_id)).filter(Boolean) as Listing[];
  if (!from.length) return null;
  return (
    <p className="mt-6 text-sm">{l.category === "routes" ? EL(lang, "Stops on this route with a profile:", "Στάσεις της διαδρομής με σελίδα:") : EL(lang, "Linked to:", "Συνδέεται με:")}{" "}
      {from.map((x, i) => <span key={x.id}>{i > 0 && ", "}<Link to={href(x, lang)} className="text-secondary hover:underline">{pick(lang, x.name_en, x.name_el)}</Link></span>)}
    </p>
  );
}

function EditionBlock({ e, lang }: { e: EventEdition; lang: Lang }) {
  const rows: [string, string][] = ([
    [EL(lang, "Dates", "Ημερομηνίες"), dateRange(e, lang)],
    [EL(lang, "Opening hours", "Ωράριο"), pick(lang, e.opening_hours, e.opening_hours_el)],
    [EL(lang, "Programme", "Πρόγραμμα"), pick(lang, e.programme, e.programme_el)],
    [EL(lang, "Visitor information", "Πληροφορίες επισκεπτών"), pick(lang, e.visitor_info, e.visitor_info_el)],
  ] as [string, string][]).filter(([, v]) => v);
  return (
    <div className="border border-foreground p-4">
      <p className="font-serif text-xl font-bold">{pick(lang, e.label, e.label_el)}</p>
      <dl className="mt-2">{rows.map(([k, v]) => <div key={k} className="grid sm:grid-cols-[160px_1fr] gap-1 py-1.5 border-b border-border text-sm last:border-0"><dt className="font-semibold">{k}</dt><dd className="whitespace-pre-line">{v}</dd></div>)}</dl>
      {!pick(lang, e.opening_hours, e.opening_hours_el) && <p className="text-xs text-muted-foreground mt-2">{EL(lang, "Daily hours and programme have not been announced yet.", "Το ημερήσιο ωράριο και το πρόγραμμα δεν έχουν ανακοινωθεί ακόμη.")}</p>}
      {e.source_url && <p className="text-xs text-muted-foreground mt-2">{EL(lang, "Source:", "Πηγή:")} <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="underline">{new URL(e.source_url).hostname.replace(/^www\./, "")}</a>{e.last_verified_at && ` · ${EL(lang, "checked", "έλεγχος")} ${e.last_verified_at}`}</p>}
    </div>
  );
}

/** Current edition (when published) plus an archive of past editions; the event page itself stays up all year. */
export function EventEditions({ l, lang, editions }: { l: Listing; lang: Lang; editions: EventEdition[] }) {
  const mine = editions.filter((e) => e.listing_id === l.id);
  const cur = currentEdition(mine), past = pastEditions(mine);
  return (
    <section className="mt-8">
      <h3 className="section-label mb-2">{EL(lang, "This edition", "Τρέχουσα διοργάνωση")}</h3>
      {cur ? <EditionBlock e={cur} lang={lang} /> : <p className="text-sm text-muted-foreground border border-border p-4">{EL(lang, "Dates for the next edition have not been confirmed yet. Check back soon.", "Οι ημερομηνίες της επόμενης διοργάνωσης δεν έχουν επιβεβαιωθεί ακόμη.")}</p>}
      {past.length > 0 && (
        <details className="mt-4"><summary className="text-sm font-semibold cursor-pointer">{EL(lang, "Past editions", "Προηγούμενες διοργανώσεις")} ({past.length})</summary>
          <ul className="mt-2 text-sm space-y-1">{past.map((e) => <li key={e.id}>{pick(lang, e.label, e.label_el)} — {dateRange(e, lang)}</li>)}</ul>
        </details>
      )}
    </section>
  );
}

export function VenueRooms({ rooms, lang }: { rooms: VenueRoom[]; lang: Lang }) {
  if (!rooms.length) return <p className="mt-6 text-sm text-muted-foreground">{EL(lang, "Room capacities have not been published yet.", "Οι χωρητικότητες αιθουσών δεν έχουν δημοσιευθεί ακόμη.")}</p>;
  const cols = ROOM_LAYOUTS.filter((x) => rooms.some((r) => r[x.id] != null));
  return (
    <section className="mt-8 overflow-x-auto">
      <h3 className="section-label mb-2">{EL(lang, "Capacity by room layout", "Χωρητικότητα ανά διάταξη")}</h3>
      <table className="w-full text-sm border border-border">
        <thead><tr className="bg-muted text-left"><th className="p-2">{EL(lang, "Room", "Αίθουσα")}</th>{cols.map((c) => <th key={c.id} className="p-2 text-right">{c[lang]}</th>)}</tr></thead>
        <tbody>{rooms.map((r) => <tr key={r.id} className="border-t border-border"><td className="p-2 font-semibold">{pick(lang, r.name, r.name_el)}</td>{cols.map((c) => <td key={c.id} className="p-2 text-right tabular-nums">{r[c.id] ?? "—"}</td>)}</tr>)}</tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-1">{EL(lang, "As published by the venue. Confirm with the venue for your event.", "Όπως δημοσιεύονται από τον χώρο. Επιβεβαιώστε με τον χώρο για την εκδήλωσή σας.")}</p>
    </section>
  );
}
