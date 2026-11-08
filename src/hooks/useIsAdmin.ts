import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WHOISWHO_PUBLIC } from "@/lib/featureFlags";

export function useIsAdmin() {
  const { user, loading } = useAuth() as { user: { id: string } | null; loading?: boolean };
  const q = useQuery({
    queryKey: ["admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });
  return { isAdmin: !!q.data, loading: !!loading || (!!user && q.isLoading) };
}

/** True when visitors may see Who's Who pages and people links. */
export function useWhoIsWhoVisible() {
  const { isAdmin, loading } = useIsAdmin();
  return { visible: WHOISWHO_PUBLIC || isAdmin, loading: WHOISWHO_PUBLIC ? false : loading };
}
