import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EVENT_LABELS } from "@/components/intel/CompanyIntelligence";

const KIND_LABELS: Record<string, string> = {
  company: "Company profile ↔ registry",
  news_company: "News ↔ company",
  news_person: "News ↔ person",
};

type Tab = "matches" | "events" | "corrections";

export function ReviewQueuePanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("matches");

  const { data: matches = [] } = useQuery({
    queryKey: ["review-matches"],
    queryFn: async () => (await supabase.from("match_review_queue").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(100)).data || [],
  });
  const { data: events = [] } = useQuery({
    queryKey: ["review-events"],
    queryFn: async () => (await supabase.from("company_events").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(100)).data || [],
  });
  const { data: corrections = [] } = useQuery({
    queryKey: ["review-corrections"],
    queryFn: async () => (await supabase.from("correction_requests").select("*, person:people(name, slug)").eq("status", "open").order("created_at", { ascending: false })).data || [],
  });

  const decideMatch = async (m: any, approve: boolean) => {
    const status = approve ? "approved" : "rejected";
    await supabase.from("match_review_queue").update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", m.id);
    if (m.kind === "company" && approve) {
      // One master record: link the curated profile to the registry company; reject other candidates
      await supabase.from("companies").update({ directory_company_id: m.candidate_id }).eq("id", m.source_id);
      await supabase.from("match_review_queue").update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("kind", "company").eq("source_id", m.source_id).eq("status", "pending");
    }
    if (m.kind !== "company") {
      await supabase.from("news_entity_links").update({ status }).eq("article_id", m.source_id).eq("entity_id", m.candidate_id);
    }
    toast.success(approve ? "Match approved" : "Match rejected");
    qc.invalidateQueries({ queryKey: ["review-matches"] });
  };

  const decideEvent = async (id: string, approve: boolean) => {
    await supabase.from("company_events").update({ status: approve ? "approved" : "rejected" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["review-events"] });
  };

  const closeCorrection = async (id: string) => {
    await supabase.from("correction_requests").update({ status: "resolved" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["review-corrections"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "matches" ? "default" : "outline"} onClick={() => setTab("matches")}>Matches ({matches.length})</Button>
        <Button size="sm" variant={tab === "events" ? "default" : "outline"} onClick={() => setTab("events")}>Sensitive events ({events.length})</Button>
        <Button size="sm" variant={tab === "corrections" ? "default" : "outline"} onClick={() => setTab("corrections")}>Correction requests ({corrections.length})</Button>
      </div>

      {tab === "matches" && (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {matches.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing to review.</p>}
          {matches.map((m: any) => (
            <div key={m.id} className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="mb-1">{KIND_LABELS[m.kind] || m.kind}</Badge>
                <p className="text-sm"><span className="font-semibold">{m.extracted_name}</span> → {m.candidate_label}</p>
                <p className="text-xs text-muted-foreground">{m.reason} · confidence {Math.round((m.confidence || 0) * 100)}%</p>
                {m.source_table === "cna_articles" && <a href={`/article/${m.source_id}`} target="_blank" rel="noreferrer" className="text-xs text-secondary hover:underline">Open article</a>}
              </div>
              <Button size="sm" variant="outline" onClick={() => decideMatch(m, true)}><Check className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => decideMatch(m, false)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {events.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing to review.</p>}
          {events.map((e: any) => (
            <div key={e.id} className="p-4 flex items-start gap-4">
              <div className="flex-1">
                <Badge variant="outline" className="mb-1">{EVENT_LABELS[e.event_type] || e.event_type}</Badge>
                <p className="text-sm">{e.title}</p>
                {e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" className="text-xs text-secondary hover:underline">Source</a>}
              </div>
              <Button size="sm" variant="outline" onClick={() => decideEvent(e.id, true)}>Publish</Button>
              <Button size="sm" variant="ghost" onClick={() => decideEvent(e.id, false)}>Reject</Button>
            </div>
          ))}
        </div>
      )}

      {tab === "corrections" && (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {corrections.length === 0 && <p className="p-4 text-sm text-muted-foreground">No open requests.</p>}
          {corrections.map((c: any) => (
            <div key={c.id} className="p-4 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold">{c.person?.name || "Unknown profile"} — {c.requester_name} ({c.requester_email})</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{c.message}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => closeCorrection(c.id)}>Mark resolved</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
