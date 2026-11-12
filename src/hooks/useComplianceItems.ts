import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_ITEM_COLUMNS, type ComplianceItem } from "@/lib/compliance";

/** Published ComplianceHub records (RLS returns published, non-test rows only), newest first. */
export function useComplianceItems(section?: string) {
  return useQuery({
    queryKey: ["compliance-items", section ?? "all"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let q = supabase.from("compliance_items").select(PUBLIC_ITEM_COLUMNS).eq("status", "published")
        .order("publication_date", { ascending: false, nullsFirst: false }).limit(1000);
      if (section) q = q.contains("sections", [section]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ComplianceItem[];
    },
  });
}
