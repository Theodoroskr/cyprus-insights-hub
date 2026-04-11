import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import {
  Bookmark, Bell, Settings, Crown, User, Building2, Mail,
  Trash2, ExternalLink, FileText
} from "lucide-react";

interface SavedItem {
  id: string;
  item_type: string;
  item_id: string;
  item_title: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"bookmarks" | "notifications" | "settings">("bookmarks");
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [digestFreq, setDigestFreq] = useState("weekly");
  const [verticals, setVerticals] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [itemsRes, notifsRes, prefsRes] = await Promise.all([
      supabase.from("saved_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
    ]);
    if (itemsRes.data) setSavedItems(itemsRes.data as SavedItem[]);
    if (notifsRes.data) setNotifications(notifsRes.data as Notification[]);
    if (prefsRes.data) {
      setDigestFreq((prefsRes.data as any).digest_frequency || "weekly");
      setVerticals((prefsRes.data as any).verticals || []);
    }
  };

  const removeSavedItem = async (id: string) => {
    await supabase.from("saved_items").delete().eq("id", id);
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSearch = (q: string) => console.log("Search:", q);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const tabs = [
    { id: "bookmarks" as const, label: "Saved Items", icon: Bookmark, count: savedItems.length },
    { id: "notifications" as const, label: "Notifications", icon: Bell, count: notifications.filter((n) => !n.read).length },
    { id: "settings" as const, label: "Preferences", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={handleSearch} />

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-foreground/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="font-serif font-bold text-xl text-foreground">
                {profile?.display_name || user.email}
              </h1>
              {profile?.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {profile.company}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`rounded-none text-[10px] uppercase tracking-wider ${
                profile?.tier === "premium" 
                  ? "bg-secondary/15 text-secondary border-secondary/20" 
                  : "bg-foreground/5 text-foreground border-border"
              }`}>
                <Crown className="h-3 w-3 mr-1" />
                {profile?.tier || "Free"}
              </Badge>
              <Button variant="outline" size="sm" onClick={signOut} className="rounded-none text-xs">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] border-b-2 transition-colors ${
                activeTab === t.id ? "text-foreground border-secondary" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 bg-secondary/15 text-secondary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "bookmarks" && (
          <div className="space-y-0 divide-y divide-border border border-border bg-card">
            {savedItems.length === 0 ? (
              <div className="py-12 text-center">
                <Bookmark className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No saved items yet</p>
                <p className="text-xs text-muted-foreground mt-1">Bookmark articles and save tool results to see them here</p>
              </div>
            ) : (
              savedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.item_title || item.item_id}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {item.item_type} · {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSavedItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-0 divide-y divide-border border border-border bg-card">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-5 py-4 ${!n.read ? "bg-secondary/5" : ""}`}>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="border border-border bg-card p-6 space-y-6">
            <div>
              <h3 className="font-serif font-bold text-foreground mb-3">Email Digest</h3>
              <div className="flex gap-2">
                {["daily", "weekly", "monthly", "none"].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setDigestFreq(freq)}
                    className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold border transition-colors ${
                      digestFreq === freq
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-serif font-bold text-foreground mb-3">Verticals of Interest</h3>
              <div className="flex flex-wrap gap-2">
                {["Compliance", "FinTech", "SME", "Economy"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerticals((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
                    className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold border transition-colors ${
                      verticals.includes(v)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {profile?.tier !== "premium" && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-serif font-bold text-foreground">Upgrade to Premium</p>
                    <p className="text-xs text-muted-foreground">Get daily briefings, PDF exports, and custom alerts</p>
                  </div>
                  <Button className="ml-auto rounded-none text-xs uppercase tracking-wider font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
