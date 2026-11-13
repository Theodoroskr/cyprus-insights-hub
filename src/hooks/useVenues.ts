import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VenuePlan } from "@/lib/venues";

export interface VenueMedia { id: string; listing_id: string; user_id: string | null; kind: string; storage_path: string; public_url: string | null; caption: string | null; status: string; sort_order: number; created_at: string }

export function useVenuePlans() {
  return useQuery({ queryKey: ["venue-plans"], staleTime: 10 * 60_000, queryFn: async () => {
    const { data, error } = await supabase.from("venue_plans").select("*").order("sort_order");
    if (error) throw error; return (data ?? []) as unknown as VenuePlan[];
  } });
}
/** Approved media for one venue (RLS also lets owners/admins see their own pending files; filter them out for the public page). */
export function useApprovedVenueMedia(listingId?: string) {
  return useQuery({ queryKey: ["venue-media", listingId], enabled: !!listingId, queryFn: async () => {
    const { data, error } = await supabase.from("venue_media").select("*").eq("listing_id", listingId!).eq("status", "approved").order("sort_order");
    if (error) throw error; return (data ?? []) as VenueMedia[];
  } });
}
/** Venues the signed-in user is a verified representative of. */
export function useMyVenueIds(userId?: string) {
  return useQuery({ queryKey: ["my-venues", userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await supabase.from("venue_representatives").select("listing_id").eq("user_id", userId!);
    if (error) throw error; return (data ?? []).map((r) => r.listing_id);
  } });
}
