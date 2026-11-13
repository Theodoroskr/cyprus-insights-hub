import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Destination, EventEdition, Listing, ListingLink, VenueRoom } from "@/lib/explore";

export function useExploreData() {
  return useQuery({
    queryKey: ["explore-data"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const [d, l, links, ll, ed, rooms] = await Promise.all([
        supabase.from("tour_destinations").select("*").order("sort_order"),
        supabase.from("tour_listings").select("*").order("name_en"),
        supabase.from("tour_listing_destinations").select("listing_id,destination_id"),
        supabase.from("tour_listing_links").select("from_listing_id,to_listing_id,relation,sort_order").order("sort_order"),
        supabase.from("tour_event_editions").select("*").order("start_date", { ascending: false }),
        supabase.from("tour_venue_rooms").select("*").order("sort_order"),
      ]);
      for (const r of [d, l, links, ll, ed, rooms]) if (r.error) throw r.error;
      const byListing: Record<string, string[]> = {};
      for (const r of links.data ?? []) (byListing[r.listing_id] ??= []).push(r.destination_id);
      const listings = (l.data ?? []).map((x) => ({ ...x, destination_ids: byListing[x.id] ?? [] })) as Listing[];
      const destinations = (d.data ?? []) as Destination[];
      const destNameById: Record<string, string[]> = {};
      for (const x of destinations) destNameById[x.id] = [x.name_en, x.name_el ?? "", ...x.aliases];
      const roomsByListing: Record<string, VenueRoom[]> = {};
      for (const r of (rooms.data ?? []) as VenueRoom[]) (roomsByListing[r.listing_id] ??= []).push(r);
      return {
        destinations, listings, destNameById,
        listingLinks: (ll.data ?? []) as ListingLink[],
        editions: (ed.data ?? []) as EventEdition[],
        roomsByListing,
      };
    },
  });
}

/** True for signed-in admins (editor flags such as "needs coordinates"). */
export function useIsTourismEditor() {
  return useQuery({
    queryKey: ["tourism-editor"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      return !!data;
    },
  }).data ?? false;
}
