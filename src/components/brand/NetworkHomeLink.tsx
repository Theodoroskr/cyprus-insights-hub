import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { currentHost, networkHome } from "@/lib/networkEditions";

/**
 * The network name in the top strip. Points at the International edition, which is the
 * network-level view; the vertical hubs themselves live in the footer only.
 */
export function NetworkHomeLink({ className, children = "BHub Network" }: { className?: string; children?: ReactNode }) {
  const { href, external } = networkHome(currentHost());
  return external ? (
    <a href={href} className={className}>{children}</a>
  ) : (
    <Link to={href} className={className}>{children}</Link>
  );
}
