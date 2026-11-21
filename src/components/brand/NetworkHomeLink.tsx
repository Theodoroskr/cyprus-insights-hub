import { Link } from "react-router-dom";
import { onGrHost } from "@/lib/edition";
import { networkHome } from "@/lib/networkEditions";

/**
 * The network name in the top strip. Points at the International edition, which is the
 * network-level view; the vertical hubs themselves live in the footer only.
 */
export function NetworkHomeLink({ className }: { className?: string }) {
  const { href, external } = networkHome(onGrHost());
  return external ? (
    <a href={href} className={className}>BHub Network</a>
  ) : (
    <Link to={href} className={className}>BHub Network</Link>
  );
}
