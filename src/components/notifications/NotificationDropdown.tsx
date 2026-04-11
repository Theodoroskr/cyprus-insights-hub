import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  href: string | null;
  created_at: string;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-lg z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-secondary hover:underline font-semibold uppercase tracking-wider">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                      !n.read ? "bg-secondary/5" : ""
                    }`}
                    onClick={() => { markAsRead(n.id); if (n.href) setIsOpen(false); }}
                  >
                    {n.href ? (
                      <Link to={n.href} className="block">
                        <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-border">
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-[10px] uppercase tracking-wider font-semibold text-secondary hover:underline"
              >
                View All & Preferences
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
