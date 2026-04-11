import { ReactNode, useState } from "react";
import { Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "./LoginModal";

interface ToolResultGateProps {
  children: ReactNode;
  toolName: string;
}

export function ToolResultGate({ children, toolName }: ToolResultGateProps) {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {children}
      {!user && (
        <div className="mt-4 border border-secondary/20 bg-secondary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-secondary/10 flex items-center justify-center shrink-0">
              <Save className="h-4 w-4 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Save your {toolName} results</p>
              <p className="text-xs text-muted-foreground mt-1">Register free to save results, track progress over time, and export as PDF.</p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={() => setShowLogin(true)} className="rounded-none text-xs uppercase tracking-wider font-semibold h-8">
                  Register Free
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowLogin(true)} className="rounded-none text-xs uppercase tracking-wider font-semibold h-8 gap-1.5">
                  <Download className="h-3 w-3" /> Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} defaultTab="register" />
    </>
  );
}
