import { useWhoIsWhoVisible } from "@/hooks/useIsAdmin";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Users, History, ShieldCheck, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const EVENT_LABELS: Record<string, string> = {
  executive_appointment: "Executive Appointment",
  board_appointment: "Board Appointment",
  investment: "Investment",
  merger_acquisition: "Merger or Acquisition",
  partnership: "Partnership",
  expansion: "Expansion",
  financial_results: "Financial Results",
  government_tender: "Government Tender",
  regulatory_action: "Regulatory Action",
  licence_update: "Licence Update",
  funding_grant: "Funding or Grant",
  corporate_restructuring: "Corporate Restructuring",
  other_business_news: "Other Business News",
};

const RECORD_LABELS: Record<string, string> = {
  licensed: "Licence register",
  warning: "Warning (unauthorised entity)",
  enforcement: "Enforcement action",
  announcement: "Announcement",
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-secondary" /> {title}
      </h2>
      {children}
    </section>
  );
}

export function CompanyIntelligence({ directoryCompanyId }: { directoryCompanyId: string }) {
  const { visible: showPeople } = useWhoIsWhoVisible();
  const { data } = useQuery({
    queryKey: ["company-intel", directoryCompanyId],
    queryFn: async () => {
      const { data: curated } = await supabase.from("companies").select("id").eq("directory_company_id", directoryCompanyId);
      const curatedIds = (curated || []).map((c) => c.id);
      const entityIds = [directoryCompanyId, ...curatedIds];

      const [links, events, regs, rels] = await Promise.all([
        supabase.from("news_entity_links")
          .select("article:cna_articles(id, title, published_at, created_at, source_url, event_type, status)")
          .in("entity_id", entityIds).in("entity_type", ["directory_company", "company"]).eq("status", "approved").limit(30),
        supabase.from("company_events").select("*")
          .or(`directory_company_id.eq.${directoryCompanyId}${curatedIds.length ? `,company_id.in.(${curatedIds.join(",")})` : ""}`)
          .eq("status", "approved").order("event_date", { ascending: false }).limit(30),
        supabase.from("regulatory_records").select("*").eq("directory_company_id", directoryCompanyId).eq("status", "published"),
        curatedIds.length
          ? supabase.from("relationships").select("id, role, role_type, started_at, ended_at, is_current, source_url, person:people(name, slug, title)").in("company_id", curatedIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const news = (links.data || []).map((l: any) => l.article).filter((a: any) => a && a.status === "published")
        .sort((a: any, b: any) => (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at));
      return { news, events: events.data || [], regs: regs.data || [], people: rels.data || [] };
    },
  });

  if (!data) return null;
  const { news, events, regs, people } = data;
  const sources = Array.from(new Set([
    ...news.map((n: any) => n.source_url),
    ...events.map((e: any) => e.source_url),
    ...regs.map((r: any) => r.source_url),
    ...people.map((p: any) => p.source_url),
  ].filter(Boolean))) as string[];

  return (
    <div className="space-y-6 mt-8">
      <Section icon={Newspaper} title="Latest Company News">
        {news.length === 0 ? <p className="text-sm text-muted-foreground">No verified news linked to this company yet.</p> : (
          <ul className="divide-y divide-border">
            {news.map((n: any) => (
              <li key={n.id} className="py-3">
                <Link to={`/article/${n.id}`} className="font-medium text-foreground hover:text-secondary">{n.title}</Link>
                <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                  {fmt(n.published_at || n.created_at)}
                  {n.event_type && <Badge variant="outline" className="text-[10px]">{EVENT_LABELS[n.event_type] || n.event_type}</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={Users} title="Key People">
        {people.length === 0 ? <p className="text-sm text-muted-foreground">No verified directors or executives recorded yet.</p> : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {people.map((r: any) => (
              <li key={r.id} className="border border-border rounded-lg p-3">
                {showPeople ? <Link to={`/whoiswho/${r.person?.slug}`} className="font-medium text-foreground hover:text-secondary">{r.person?.name}</Link> : <span className="font-medium text-foreground">{r.person?.name}</span>}
                <p className="text-sm text-muted-foreground">{r.role}{!r.is_current && " (former)"}</p>
                {(r.started_at || r.ended_at) && <p className="text-xs text-muted-foreground">{fmt(r.started_at)} – {r.ended_at ? fmt(r.ended_at) : "present"}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={History} title="Corporate Timeline">
        {events.length === 0 ? <p className="text-sm text-muted-foreground">No verified events recorded yet.</p> : (
          <ol className="border-l border-border ml-2 space-y-4">
            {events.map((e: any) => (
              <li key={e.id} className="pl-4 relative">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary" />
                <p className="text-xs text-muted-foreground">{fmt(e.event_date)} · {EVENT_LABELS[e.event_type] || e.event_type}</p>
                <p className="text-sm text-foreground">{e.title}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section icon={ShieldCheck} title="Regulatory Information">
        {regs.length === 0 ? <p className="text-sm text-muted-foreground">No regulator records linked to this company.</p> : (
          <ul className="space-y-2">
            {regs.map((r: any) => (
              <li key={r.id} className="text-sm">
                <Badge variant="outline" className="mr-2">{r.regulator}</Badge>
                <span className="font-medium">{RECORD_LABELS[r.record_type] || r.record_type}</span>
                {r.license_number && <span className="text-muted-foreground"> · Licence {r.license_number}</span>}
                {r.title && <span className="text-muted-foreground"> · {r.title}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {sources.length > 0 && (
        <Section icon={Link2} title="Sources">
          <ul className="space-y-1 text-sm">
            {sources.map((s) => (
              <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline break-all">{s}</a></li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
