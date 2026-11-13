import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDeadline } from "@/lib/funding";
import { FundingGate } from "./FundingGate";

/** "Related funding call" box on a story an editor linked to an opportunity. */
export function RelatedFunding({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const links = useQuery({
    queryKey: ["article-funding", articleId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("article_funding_links").select("call_id").eq("article_id", articleId);
      const ids = (data ?? []).map((d) => d.call_id);
      if (!ids.length) return { count: 0, calls: [] as { slug: string | null; title_en: string; issuer: string; deadline_date: string | null; deadline_time: string | null }[] };
      if (!user) return { count: ids.length, calls: [] };
      const { data: calls } = await supabase.from("funding_calls").select("slug,title_en,issuer,deadline_date,deadline_time").in("id", ids).eq("status", "verified");
      return { count: ids.length, calls: calls ?? [] };
    },
  });
  if (!links.data?.count) return null;
  return (
    <aside className="my-8 border-l-4 border-secondary bg-secondary/5 p-5 rounded-r-lg">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary mb-2"><Coins className="h-4 w-4" />Related funding call</p>
      {user ? (
        <ul className="space-y-2">
          {links.data.calls.map((c) => (
            <li key={c.slug}>
              <Link to={`/funding/${c.slug}`} className="font-serif font-bold text-foreground hover:text-secondary">{c.title_en}</Link>
              <p className="text-sm text-muted-foreground">{c.issuer} · Deadline {formatDeadline(c.deadline_date, c.deadline_time, "en")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <FundingGate lang="en" compact />
      )}
    </aside>
  );
}
