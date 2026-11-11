import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementCard } from "./AnnouncementCard";
import { type Announcement } from "@/lib/announcements";

/** Published announcements whose company match is confirmed for this directory profile */
export function CompanyAnnouncements({ companyId }: { companyId: string }) {
  const { data = [] } = useQuery({
    queryKey: ["company-profile-announcements", companyId],
    queryFn: async () => (await supabase.from("company_announcements").select("*").eq("directory_company_id", companyId).eq("status", "published")
      .order("source_published_at", { ascending: false }).limit(6)).data as unknown as Announcement[] ?? [],
  });
  if (!data.length) return null;
  return (
    <section className="mb-8" aria-labelledby="company-announcements">
      <div className="flex items-center justify-between mb-4">
        <h2 id="company-announcements" className="font-serif font-bold text-foreground flex items-center gap-2"><Megaphone className="h-5 w-5 text-secondary" />Company Announcements</h2>
        <Link to="/company-announcements" className="text-sm text-secondary hover:underline">View all</Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{data.map((a) => <AnnouncementCard key={a.id} a={a} lang="en" compact />)}</div>
    </section>
  );
}
