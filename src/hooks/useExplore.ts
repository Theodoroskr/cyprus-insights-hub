import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Destination, Listing } from "@/lib/explore";

export function useExploreData() {
  return useQuery({
    queryKey: ["explore-data"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const [d, l, links] = await Promise.all([
        supabase.from("tour_destinations").select("*").order("sort_order"),
        supabase.from("tour_listings").select("*").order("name_en"),
        supabase.from("tour_listing_destinations").select("listing_id,destination_id"),
      ]);
      if (d.error) throw d.error;
      if (l.error) throw l.error;
      if (links.error) throw links.error;
      const byListing: Record<string, string[]> = {};
      for (const r of links.data ?? []) (byListing[r.listing_id] ??= []).push(r.destination_id);
      const listings = (l.data ?? []).map((x) => ({ ...x, destination_ids: byListing[x.id] ?? [] })) as Listing[];
      const destinations = (d.data ?? []) as Destination[];
      const destNameById: Record<string, string[]> = {};
      for (const x of destinations) destNameById[x.id] = [x.name_en, x.name_el ?? "", ...x.aliases];
      return { destinations, listings, destNameById };
    },
  });
}
