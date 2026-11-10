import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Row = { id: string; publisher: string; survey_year: number; indicator: string; value: number | null; unit: string; status: string };

export function FinLitFindingsPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-finlit-findings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fin_lit_findings").select("id, publisher, survey_year, indicator, value, unit, status").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const setStatus = async (id: string, status: "approved" | "draft") => {
    await supabase.from("fin_lit_findings").update({ status, approved_by: status === "approved" ? user?.id : null, approved_at: status === "approved" ? new Date().toISOString() : null }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-finlit-findings"] });
    qc.invalidateQueries({ queryKey: ["finlit-findings"] });
  };
  const approveAll = async () => {
    await supabase.from("fin_lit_findings").update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() }).neq("status", "approved");
    qc.invalidateQueries({ queryKey: ["admin-finlit-findings"] });
    qc.invalidateQueries({ queryKey: ["finlit-findings"] });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Financial Literacy survey results</CardTitle>
        <p className="text-sm text-muted-foreground">Only approved figures appear on the public Financial Literacy page.</p>
        <Button size="sm" className="w-fit" onClick={approveAll} disabled={!(q.data ?? []).some((r) => r.status !== "approved")}>Approve all</Button></CardHeader>
      <CardContent className="divide-y">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="flex items-center gap-3 py-2 text-sm">
            <Badge variant={r.status === "approved" ? "secondary" : "outline"}>{r.status === "approved" ? "Approved" : "Awaiting approval"}</Badge>
            <span className="flex-1">{r.publisher} {r.survey_year} · {r.indicator}: <strong>{r.value ?? "—"}</strong> <span className="text-muted-foreground">{r.unit}</span></span>
            <Button size="sm" variant="outline" onClick={() => setStatus(r.id, r.status === "approved" ? "draft" : "approved")}>{r.status === "approved" ? "Unpublish" : "Approve"}</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
