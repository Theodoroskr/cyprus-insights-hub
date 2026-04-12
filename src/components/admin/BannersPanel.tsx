import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, ExternalLink, Image, BarChart3 } from "lucide-react";

const SLOT_OPTIONS = [
  { value: "leaderboard", label: "Leaderboard (728×90)" },
  { value: "banner", label: "Banner (468×60)" },
  { value: "mrec", label: "MREC (300×250)" },
  { value: "skyscraper", label: "Skyscraper (160×600)" },
  { value: "billboard", label: "Billboard (970×250)" },
];

type Banner = {
  id: string;
  name: string;
  slot_id: string;
  image_url: string | null;
  click_url: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
};

type BannerForm = {
  name: string;
  slot_id: string;
  image_url: string;
  click_url: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

const emptyForm: BannerForm = {
  name: "",
  slot_id: "leaderboard",
  image_url: "",
  click_url: "",
  is_active: true,
  starts_at: "",
  ends_at: "",
};

export function BannersPanel() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banner_placements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: BannerForm & { id?: string }) => {
      const record = {
        name: payload.name,
        slot_id: payload.slot_id,
        image_url: payload.image_url || null,
        click_url: payload.click_url || "#",
        is_active: payload.is_active,
        starts_at: payload.starts_at || null,
        ends_at: payload.ends_at || null,
      };
      if (payload.id) {
        const { error } = await supabase.from("banner_placements").update(record).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banner_placements").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setDialogOpen(false);
      setEditingId(null);
      toast({ title: "Saved", description: "Banner placement saved successfully." });
    },
    onError: (err) => toast({ title: "Error", description: (err as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banner_placements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: "Deleted", description: "Banner removed." });
    },
    onError: (err) => toast({ title: "Error", description: (err as Error).message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("banner_placements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      slot_id: b.slot_id,
      image_url: b.image_url ?? "",
      click_url: b.click_url,
      is_active: b.is_active,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "",
      ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("banner-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("banner-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      toast({ title: "Uploaded", description: "Image uploaded successfully." });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  };

  const slotLabel = (id: string) => SLOT_OPTIONS.find((s) => s.value === id)?.label ?? id;

  const isScheduled = (b: Banner) => {
    const now = new Date();
    if (b.starts_at && new Date(b.starts_at) > now) return "scheduled";
    if (b.ends_at && new Date(b.ends_at) < now) return "expired";
    return "live";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Banner Placements</h2>
          <p className="text-sm text-muted-foreground">{banners.length} banner(s) configured</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No banners yet</p>
          <p className="text-sm">Create your first banner placement to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => {
            const schedule = isScheduled(b);
            return (
              <div key={b.id} className="bento-card flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Thumbnail */}
                <div className="w-24 h-16 rounded border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{b.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{slotLabel(b.slot_id)}</Badge>
                    {schedule === "scheduled" && <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>}
                    {schedule === "expired" && <Badge className="text-[10px] bg-muted text-muted-foreground border-border">Expired</Badge>}
                    {schedule === "live" && b.is_active && <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200">Live</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {b.impressions.toLocaleString()} imp</span>
                    <span>{b.clicks.toLocaleString()} clicks</span>
                    {b.impressions > 0 && <span>{((b.clicks / b.impressions) * 100).toFixed(2)}% CTR</span>}
                    {b.click_url !== "#" && (
                      <a href={b.click_url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:text-foreground">
                        <ExternalLink className="w-3 h-3" /> URL
                      </a>
                    )}
                  </div>
                  {(b.starts_at || b.ends_at) && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {b.starts_at && `From ${new Date(b.starts_at).toLocaleDateString()}`}
                      {b.starts_at && b.ends_at && " — "}
                      {b.ends_at && `Until ${new Date(b.ends_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={b.is_active}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: b.id, is_active: v })}
                  />
                  <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this banner?")) deleteMutation.mutate(b.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="section-label">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Homepage Leaderboard Q3" />
            </div>
            <div>
              <label className="section-label">Ad Slot</label>
              <Select value={form.slot_id} onValueChange={(v) => setForm({ ...form, slot_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLOT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="section-label">Banner Image</label>
              <div className="flex gap-2">
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="URL or upload below"
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span>{uploading ? "Uploading…" : "Upload"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="mt-2 h-24 w-full object-contain rounded border border-border bg-muted/20" />
              )}
            </div>
            <div>
              <label className="section-label">Click URL</label>
              <Input value={form.click_url} onChange={(e) => setForm({ ...form, click_url: e.target.value })} placeholder="https://sponsor.com/landing" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">Starts At</label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <label className="section-label">Ends At</label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm text-foreground">Active</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
