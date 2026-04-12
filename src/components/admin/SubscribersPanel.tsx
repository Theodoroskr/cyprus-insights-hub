import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Users, Search, Download, UserCheck, UserX,
  Mail, Building2, Briefcase, ChevronLeft, ChevronRight,
  RefreshCw, Trash2,
} from "lucide-react";

const PAGE_SIZE = 20;

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  job_title: string | null;
  verticals: string[];
  frequency: string;
  is_active: boolean;
  created_at: string;
}

export function SubscribersPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["newsletter-subscribers", search, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "inactive") query = query.eq("is_active", false);
      if (search.trim()) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);

      const { data, count, error } = await query;
      if (error) throw error;
      return { subscribers: (data ?? []) as Subscriber[], total: count ?? 0 };
    },
  });

  const subscribers = data?.subscribers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast({ title: "Updated", description: "Subscriber status updated." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast({ title: "Deleted", description: "Subscriber removed." });
    },
  });

  const activeCount = subscribers.filter((s) => s.is_active).length;

  const exportCSV = () => {
    if (!subscribers.length) return;
    const headers = ["Email", "Name", "Company", "Job Title", "Verticals", "Frequency", "Active", "Signed Up"];
    const rows = subscribers.map((s) => [
      s.email,
      s.name ?? "",
      s.company ?? "",
      s.job_title ?? "",
      (s.verticals ?? []).join("; "),
      s.frequency,
      s.is_active ? "Yes" : "No",
      new Date(s.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const verticalLabel: Record<string, string> = {
    compliance: "Compliance",
    fintech: "FinTech",
    sme: "SME",
    general: "General",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bento-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-800"><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-foreground">{total}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </div>
        <div className="bento-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 text-green-800"><UserCheck className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-foreground">{activeCount}</p><p className="text-xs text-muted-foreground">Active</p></div>
        </div>
        <div className="bento-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-800"><UserX className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-foreground">{total - activeCount}</p><p className="text-xs text-muted-foreground">Inactive</p></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or company…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className="capitalize text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No subscribers found</p>
        </div>
      ) : (
        <div className="border border-border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Interests</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Signed Up</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate max-w-[200px]">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{sub.name ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {sub.company ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {sub.company}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {(sub.verticals ?? []).map((v) => (
                        <Badge key={v} variant="outline" className="text-[10px]">
                          {verticalLabel[v] ?? v}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={sub.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                      {sub.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActiveMutation.mutate({ id: sub.id, is_active: !sub.is_active })}
                        title={sub.is_active ? "Deactivate" : "Activate"}
                      >
                        {sub.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remove ${sub.email}?`)) deleteMutation.mutate(sub.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} · {total} subscribers
          </p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
