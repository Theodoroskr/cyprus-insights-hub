import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RETURN_KEY } from "@/lib/funding";

/** After sign-in or email confirmation, go back to the page that asked the visitor to register. */
export function AuthReturn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) return;
    const to = localStorage.getItem(RETURN_KEY);
    if (!to) return;
    localStorage.removeItem(RETURN_KEY);
    if (to.startsWith("/") && !to.startsWith("//") && to !== window.location.pathname + window.location.search) navigate(to, { replace: true });
  }, [user, navigate]);
  return null;
}
