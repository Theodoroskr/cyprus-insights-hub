import { Download } from "lucide-react";
import type { Lang } from "@/lib/academy";
import { EL, pick, type Listing } from "@/lib/explore";
import { useApprovedVenueMedia, useVenuePlans } from "@/hooks/useVenues";
import { currentPlanCode, planFor, visiblePhotos } from "@/lib/venues";

/** Logo, Featured label and AV line shown at the top of a venue page. */
export function VenueHeader({ l, lang }: { l: Listing; lang: Lang }) {
  const plan = planFor(currentPlanCode(l), useVenuePlans().data ?? []);
  return (
    <div className="flex items-center gap-3 mb-3">
      {l.logo_url && <img src={l.logo_url} alt={`${l.name_en} logo`} className="h-14 w-14 object-contain border border-border bg-background p-1" loading="lazy" />}
      {plan?.featured && <span className="text-[10px] uppercase tracking-wider font-semibold bg-secondary text-secondary-foreground px-2 py-0.5">Featured</span>}
    </div>
  );
}

/** Cover, gallery and brochure — only approved files, only as many as the current plan includes. */
export function VenueGallery({ l, lang }: { l: Listing; lang: Lang }) {
  const plan = planFor(currentPlanCode(l), useVenuePlans().data ?? []);
  const photos = visiblePhotos(useApprovedVenueMedia(l.id).data ?? [], plan);
  const av = pick(lang, l.av_equipment ?? null, l.av_equipment_el ?? null);
  return (
    <>
      {plan?.allows_cover && l.cover_url && <img src={l.cover_url} alt={l.name_en} className="mt-6 w-full aspect-[16/7] object-cover" loading="lazy" />}
      {av && <p className="mt-4 text-sm"><strong>{EL(lang, "Audio-visual:", "Οπτικοακουστικά:")}</strong> {av}</p>}
      {photos.length > 0 && (
        <section className="mt-8">
          <h3 className="section-label mb-2">{EL(lang, "Photos", "Φωτογραφίες")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{photos.map((p) => p.public_url && <img key={p.id} src={p.public_url} alt={p.caption ?? l.name_en} className="aspect-[4/3] w-full object-cover" loading="lazy" />)}</div>
        </section>
      )}
      {plan?.allows_brochure && l.brochure_url && <a href={l.brochure_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 border border-border px-4 py-2 text-sm"><Download className="h-4 w-4" />{EL(lang, "Download brochure", "Λήψη φυλλαδίου")}</a>}
    </>
  );
}
