import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveBanner {
  id: string;
  slot_id: string;
  name: string;
  image_url: string | null;
  click_url: string;
}

/** All live, in-date banners, fetched once and shared by every ad slot. */
function useActiveBanners() {
  return useQuery({
    queryKey: ["active-banners"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("banner_placements")
        .select("id, slot_id, name, image_url, click_url, starts_at, ends_at")
        .eq("is_active", true);
      return ((data ?? []) as any[]).filter(
        (b) => b.image_url && (!b.starts_at || b.starts_at <= now) && (!b.ends_at || b.ends_at >= now),
      ) as ActiveBanner[];
    },
  });
}

/** Returns the live banner for a slot, or null when the slot is unsold. */
export function useActiveBanner(slotId: string): ActiveBanner | null {
  const { data } = useActiveBanners();
  return data?.find((b) => b.slot_id === slotId) ?? null;
}
