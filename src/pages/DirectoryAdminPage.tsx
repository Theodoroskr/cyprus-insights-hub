import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Save, Plus, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EVENT_LABELS } from "@/components/intel/CompanyIntelligence";

const PROFILE_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "company_name", label: "Company name" },
  { key: "registration_no", label: "Registration number" },
  { key: "organisation_status", label: "Status" },
  { key: "organisation_type", label: "Company type" },
  { key: "nace_code", label: "Industry code (NACE)" },
  { key: "activity_description", label: "Activity", multiline: true },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
];

const BADGES: { key: string; label: string }[] = [
  { key: "cysec_licensed", label: "CySEC licensed" },
  { key: "cbc_supervised", label: "Central Bank supervised" },
  { key: "icpac_registered", label: "ICPAC registered" },
  { key: "bar_member", label: "Bar Association member" },
  { key: "cifa_member", label: "CIFA member" },
];

const STATUSES = ["pending", "approved", "rejected"];

export default function DirectoryAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", event_type: "other", event_date: "", source_url: "" });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data === true,
  });

  const { data: results = [] } = useQuery({
    queryKey: ["dir-admin-search", term],
    enabled: !!isAdmin && term.trim().length >= 2,
    queryFn: async () => {
      const t = `%${term.trim()}%`;
      return (await supabase.from("directory_companies").select("id, company_name, registration_no, city")
        .or(`company_name.ilike.${t},registration_no.ilike.${t}`).order("company_name").limit(30)).data || [];
    },
  });

  const { data: company } = useQuery({
    queryKey: ["dir-admin-company", selectedId],
    enabled: !!selectedId,
    queryFn: async () => (await supabase.from("directory_companies").select("*").eq("id", selectedId!).single()).data,
  });
  useEffect(() => { if (company) setForm(company); }, [company]);

  const { data: events = [] } = useQuery({
    queryKey: ["dir-admin-events", selectedId],
    enabled: !!selectedId,
    queryFn: async () => (await supabase.from("company_events").select("*").eq("directory_company_id", selectedId!).order("event_date", { ascending: false })).data || [],
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { id, created_at, slug, ...rest } = form;
    const { error } = await supabase.from("directory_companies")
      .update({ ...rest, regulatory_flags_updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Company saved");
    qc.invalidateQueries({ queryKey: ["dir-admin-company", id] });
  };

  const refreshEvents = () => qc.invalidateQueries({ queryKey: ["dir-admin-events", selectedId] });

  const addEvent = async () => {
    if (!newEvent.title.trim()) return toast.error("Add a title");
    const { error } = await supabase.from("company_events").insert({
      directory_company_id: selectedId, title: newEvent.title.trim(), event_type: newEvent.event_type,
      event_date: newEvent.event_date || null, source_url: newEvent.source_url || null, status: "approved",
    });
    if (error) return toast.error(error.message);
    setNewEvent({ title: "", event_type: "other", event_date: "", source_url: "" });
    toast.success("Event added");
    refreshEvents();
  };

  const updateEvent = async (id: string, patch: any) => {
    const { error } = await supabase.from("company_events").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    refreshEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("company_events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refreshEvents();
  };

  if (!user || roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          {roleLoading ? "Loading..." : "Admins only. Please sign in with an admin account."}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Directory admin</h1>
        <p className="text-sm text-muted-foreground mb-6">Edit company profiles, licence badges and events.</p>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Name or registration no." value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border bg-card max-h-[70vh] overflow-auto">
              {term.trim().length < 2 && <p className="p-3 text-sm text-muted-foreground">Type at least 2 letters.</p>}
              {results.map((c: any) => (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 hover:bg-muted ${selectedId === c.id ? "bg-muted" : ""}`}>
                  <p className="text-sm font-medium">{c.company_name}</p>
                  <p className="text-xs text-muted-foreground">{c.registration_no || "No reg. no."} · {c.city || "—"}</p>
                </button>
              ))}
            </div>
          </aside>

          <section>
            {!form ? (
              <p className="text-muted-foreground">Search and pick a company to edit.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">{form.company_name}</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/directory/company/${form.slug}`} target="_blank"><ExternalLink className="h-4 w-4 mr-1" />View page</Link>
                    </Button>
                    <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4 bg-card grid md:grid-cols-2 gap-4">
                  {PROFILE_FIELDS.map((f) => (
                    <div key={f.key} className={f.multiline ? "md:col-span-2" : ""}>
                      <Label className="text-xs">{f.label}</Label>
                      {f.multiline
                        ? <Textarea value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value || null)} />
                        : <Input value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value || null)} />}
                    </div>
                  ))}
                </div>

                <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                  <h3 className="font-semibold">Licence badges</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {BADGES.map((b) => (
                      <label key={b.key} className="flex items-center justify-between gap-3 border border-border rounded p-3">
                        <span className="text-sm">{b.label}</span>
                        <Switch checked={!!form[b.key]} onCheckedChange={(v) => set(b.key, v)} />
                      </label>
                    ))}
                  </div>
                  {form.cysec_licensed && (
                    <div className="grid md:grid-cols-3 gap-3">
                      <div><Label className="text-xs">CySEC licence type</Label><Input value={form.cysec_license_type || ""} onChange={(e) => set("cysec_license_type", e.target.value || null)} /></div>
                      <div><Label className="text-xs">CySEC licence no.</Label><Input value={form.cysec_license_number || ""} onChange={(e) => set("cysec_license_number", e.target.value || null)} /></div>
                      <div><Label className="text-xs">CySEC status</Label><Input value={form.cysec_status || ""} onChange={(e) => set("cysec_status", e.target.value || null)} /></div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Click Save to apply profile and badge changes.</p>
                </div>

                <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                  <h3 className="font-semibold">Events</h3>
                  {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
                  {events.map((e: any) => (
                    <div key={e.id} className="flex flex-wrap items-center gap-2 border border-border rounded p-3">
                      <Badge variant="outline">{EVENT_LABELS[e.event_type] || e.event_type}</Badge>
                      <span className="text-sm flex-1 min-w-[200px]">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{e.event_date || "No date"}</span>
                      <select className="border border-input bg-background rounded px-2 py-1 text-sm" value={e.status}
                        onChange={(ev) => updateEvent(e.id, { status: ev.target.value })}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Button size="sm" variant="ghost" onClick={() => deleteEvent(e.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <div className="grid md:grid-cols-[1fr_160px_150px] gap-2 pt-2 border-t border-border">
                    <Input placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                    <select className="border border-input bg-background rounded px-2 text-sm" value={newEvent.event_type}
                      onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}>
                      {Object.entries({ other: "Other", ...EVENT_LABELS }).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
                    </select>
                    <Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                    <Input className="md:col-span-2" placeholder="Source link (recommended)" value={newEvent.source_url} onChange={(e) => setNewEvent({ ...newEvent, source_url: e.target.value })} />
                    <Button onClick={addEvent}><Plus className="h-4 w-4 mr-1" />Add event</Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
