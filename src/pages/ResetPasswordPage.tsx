import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      // Give the client a moment to read the recovery link before showing "expired".
      setTimeout(() => setChecked(true), 1500);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters.");
    if (password !== confirm) return toast.error("The two passwords don't match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>Reset your password | BusinessHub.cy</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="w-full max-w-md bg-card border border-border p-6 space-y-4">
        <h1 className="font-serif text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Set a new password
        </h1>
        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pl-10 rounded-none" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="pl-10 rounded-none" />
            </div>
            <Button type="submit" className="w-full rounded-none font-semibold uppercase tracking-wider text-xs h-11" disabled={loading}>
              {loading ? "Please wait..." : "Save new password"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {checked
              ? "This reset link is invalid or has expired. Open the sign-in window, choose “Forgot password?” and request a new link."
              : "Checking your reset link…"}
          </p>
        )}
      </div>
    </div>
  );
}
