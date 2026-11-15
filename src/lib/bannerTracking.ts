// Records banner views and clicks via the track_banner database function.
// keepalive lets the request finish even when the click leaves the page.
import { useEffect, useRef } from "react";

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type BannerEvent = "impression" | "click";

export function trackBanner(id: string, kind: BannerEvent): Promise<void> {
  return fetch(`${URL_BASE}/rest/v1/rpc/track_banner`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ _id: id, _kind: kind }),
  }).then(() => undefined, () => undefined);
}

const seen = new Set<string>();

/** Counts one view per banner, slot and page once half the banner is on screen. */
export function useBannerImpression<T extends HTMLElement>(bannerId: string | null | undefined, slot: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!bannerId || !el) return;
    const key = `${bannerId}:${slot}:${location.pathname}`;
    if (seen.has(key)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5) && !seen.has(key)) {
        seen.add(key);
        trackBanner(bannerId, "impression");
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [bannerId, slot]);
  return ref;
}

/** True when a click should be left to the browser (new tab, middle click, etc.). */
export function isModifiedClick(e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}
