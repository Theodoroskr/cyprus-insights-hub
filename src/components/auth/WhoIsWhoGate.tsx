import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useWhoIsWhoVisible } from "@/hooks/useIsAdmin";
import { WHOISWHO_PUBLIC } from "@/lib/featureFlags";

/** Route wrapper: admins only until Who's Who launches; others go to the homepage. */
export function WhoIsWhoRoute({ children }: { children: ReactNode }) {
  const { visible, loading } = useWhoIsWhoVisible();
  if (loading) return null;
  if (!visible) return <Navigate to="/" replace />;
  return (
    <>
      {!WHOISWHO_PUBLIC && <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>}
      {children}
    </>
  );
}

/** Renders children only when Who's Who is visible to this visitor. */
export function WhoIsWhoOnly({ children }: { children: ReactNode }) {
  const { visible } = useWhoIsWhoVisible();
  return visible ? <>{children}</> : null;
}
