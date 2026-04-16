import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, Crown, Search, Users, RefreshCw } from "lucide-react";

interface UserRow {
  user_id: string;
  display_name: string | null;
  company: string | null;
  tier: "free" | "premium";
  created_at: string;
  roles: string[];
}

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }

    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      fetchUsers();
    });
  }, [user, authLoading]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, company, tier, created_at")
      .order("created_at", { ascending: false });

    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap: Record<string, string[]> = {};
    allRoles?.forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    setUsers(
      (profiles || []).map((p) => ({
        ...p,
        tier: p.tier as "free" | "premium",
        roles: roleMap[p.user_id] || [],
      }))
    );
    setLoading(false);
  };

  const changeTier = async (userId: string, newTier: "free" | "premium") => {
    const { error } = await supabase
      .from("profiles")
      .update({ tier: newTier })
      .eq("user_id", userId);
    if (error) { toast.error("Failed to update tier"); return; }
    toast.success(`Tier updated to ${newTier}`);
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, tier: newTier } : u));
  };

  const toggleRole = async (userId: string, role: "admin" | "moderator", hasIt: boolean) => {
    if (hasIt) {
      // Prevent removing own admin
      if (role === "admin" && userId === user?.id) {
        toast.error("Cannot remove your own admin role");
        return;
      }
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) { toast.error("Failed to remove role"); return; }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) { toast.error("Failed to add role"); return; }
    }
    toast.success(`Role ${hasIt ? "removed" : "added"}`);
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.company || "").toLowerCase().includes(q) ||
      u.user_id.includes(q)
    );
  });

  if (!isAdmin) return null;

  return (
    <>
      <SEOHead title="User Management — Admin" description="Manage users, tiers and roles" />
      <TopNavigation onSearch={() => {}} />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <Badge variant="secondary">{users.length} users</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading users…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <span className="font-medium text-foreground">{u.display_name || "—"}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.user_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.company || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={u.tier}
                          onValueChange={(v) => changeTier(u.user_id, v as "free" | "premium")}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">
                              <span className="flex items-center gap-1">
                                <Crown className="h-3 w-3" /> Premium
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-xs">
                              {r === "admin" && <Shield className="h-3 w-3 mr-0.5" />}
                              {r}
                            </Badge>
                          ))}
                          {u.roles.length === 0 && (
                            <span className="text-xs text-muted-foreground">user</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant={u.roles.includes("admin") ? "destructive" : "outline"}
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => toggleRole(u.user_id, "admin", u.roles.includes("admin"))}
                          >
                            {u.roles.includes("admin") ? "Remove Admin" : "Make Admin"}
                          </Button>
                          <Button
                            variant={u.roles.includes("moderator") ? "destructive" : "outline"}
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => toggleRole(u.user_id, "moderator", u.roles.includes("moderator"))}
                          >
                            {u.roles.includes("moderator") ? "Remove Mod" : "Make Mod"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
