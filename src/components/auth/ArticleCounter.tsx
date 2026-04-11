import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "./LoginModal";

const MAX_FREE_ARTICLES = 3;
const STORAGE_KEY = "bh_article_views";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getViewCount(): number {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data[getTodayKey()] || 0;
  } catch {
    return 0;
  }
}

export function incrementArticleView() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const key = getTodayKey();
    data[key] = (data[key] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function hasReachedLimit(): boolean {
  return getViewCount() >= MAX_FREE_ARTICLES;
}

export function ArticleCounter() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getViewCount());
  }, []);

  if (user || count === 0) return null;

  const remaining = Math.max(0, MAX_FREE_ARTICLES - count);

  return (
    <>
      <div className="bg-foreground text-background py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-secondary" />
            <span className="text-xs font-semibold">
              {remaining > 0
                ? `${remaining} of ${MAX_FREE_ARTICLES} free articles remaining today`
                : "You've reached your daily free article limit"}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setShowLogin(true)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none text-[10px] uppercase tracking-wider font-semibold h-7 px-3"
          >
            Register for Unlimited
          </Button>
        </div>
      </div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} defaultTab="register" />
    </>
  );
}
