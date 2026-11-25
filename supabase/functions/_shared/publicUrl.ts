// Outbound-fetch guard for admin-supplied addresses: only public https hosts, checked on every redirect hop.
export function isPublicHttpsUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  if (u.port && u.port !== "443") return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h.includes(".") || h.includes(":")) return false; // no single-label or IPv6 literal hosts
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || /^0x/i.test(h)) return false; // no IP literals
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|supabase\.internal)$/.test(h)) return false;
  if (h === "metadata.google.internal") return false;
  return true;
}

export async function safeFetch(url: string, init: RequestInit = {}, maxHops = 5): Promise<Response> {
  let current = url;
  for (let i = 0; i <= maxHops; i++) {
    if (!isPublicHttpsUrl(current)) throw new Error("Address not allowed");
    const r = await fetch(current, { ...init, redirect: "manual" });
    const loc = r.status >= 300 && r.status < 400 ? r.headers.get("location") : null;
    if (!loc) return r;
    await r.body?.cancel();
    current = new URL(loc, current).toString();
  }
  throw new Error("Too many redirects");
}
