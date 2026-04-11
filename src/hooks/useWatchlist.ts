import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WatchlistItem {
  id: string;
  company_type: string;
  company_id: string;
  company_name: string;
  company_slug: string | null;
  notes: string | null;
  created_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("company_watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as WatchlistItem[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const isWatching = useCallback(
    (companyId: string) => items.some((i) => i.company_id === companyId),
    [items]
  );

  const toggleWatch = useCallback(
    async (companyId: string, companyName: string, companyType: string = "directory", companySlug?: string) => {
      if (!user) return false;
      const existing = items.find((i) => i.company_id === companyId);
      if (existing) {
        await supabase.from("company_watchlist").delete().eq("id", existing.id);
        setItems((prev) => prev.filter((i) => i.id !== existing.id));
        return false;
      } else {
        const { data } = await supabase
          .from("company_watchlist")
          .insert({
            user_id: user.id,
            company_id: companyId,
            company_name: companyName,
            company_type: companyType,
            company_slug: companySlug || null,
          })
          .select()
          .single();
        if (data) setItems((prev) => [data as WatchlistItem, ...prev]);
        return true;
      }
    },
    [user, items]
  );

  return { items, loading, isWatching, toggleWatch, refetch: fetchItems };
}
