import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, FileEdit, Eye, EyeOff } from "lucide-react";
import { needsReview, formatReviewed } from "@/lib/resourceFreshness";
import type { Database } from "@/integrations/supabase/types";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

export function ResourcesPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Resource | null>(null);
  const { data: rows = [] } = useQuery({
    queryKey: ["resources-admin"],
    queryFn: async () => (await supabase.from("resources").select("*").order("title")).data || [],
  });
  const stale = rows.filter((r) => r.is_published && needsReview(r.reviewed_at));

  const update = async (id: string, patch: Partial<Resource>, msg: string) => {
    const { error } = await supabase.from("resources").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["resources-admin"] });
    qc.invalidateQueries({ queryKey: ["resources"] });
  };

  return (
    <div className="space-y-4">
      {stale.length > 0 && (
        <div className="flex items-center gap-2 border border-warning/40 bg-warning/10 text-sm p-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {stale.length} published {stale.length === 1 ? "resource needs" : "resources need"} review (not checked in the last 6 months).
        </div>
      )}
      <div className="divide-y divide-border border border-border">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.resource_type} · {r.category} · {formatReviewed(r.reviewed_at) ? `reviewed ${formatReviewed(r.reviewed_at)}` : "never reviewed"}
              </p>
            </div>
            {!r.is_published && <Badge variant="outline">Hidden</Badge>}
            {r.is_published && needsReview(r.reviewed_at) && <Badge variant="outline" className="border-warning text-warning">Needs review</Badge>}
            <Button size="sm" variant="ghost" onClick={() => update(r.id, { reviewed_at: new Date().toISOString() }, "Marked as reviewed")}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Reviewed
            </Button>
            <Button size="sm" variant="ghost" onClick={() => update(r.id, { is_published: !r.is_published }, r.is_published ? "Hidden" : "Published")}>
              {r.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              <FileEdit className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit resource</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" />
              <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Short description" rows={2} />
              <Textarea value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} placeholder="Content (Markdown)" rows={20} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">The trade snapshot and FinTech reports are built from live data; their text box is not shown on the page.</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={async () => {
                  await update(editing.id, { title: editing.title, description: editing.description, content: editing.content, reviewed_at: new Date().toISOString() }, "Saved");
                  setEditing(null);
                }}>Save & mark reviewed</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
