import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Lang } from "@/lib/academy";
import { EL, mappable, pick, type Listing } from "@/lib/explore";

declare global { interface Window { __exploreMapsReady?: () => void; google?: any } }

let loader: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
  if (!key) return Promise.reject(new Error("Map key missing"));
  loader = new Promise((resolve, reject) => {
    window.__exploreMapsReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__exploreMapsReady&channel=${channel ?? ""}&region=CY`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("Map failed to load")); };
    document.head.appendChild(s);
  });
  return loader;
}

/** Map of listings; pins only for verified coordinates. */
export function ExploreMap({ listings, lang, heightClass = "h-[480px]", note = true }: { listings: Listing[]; lang: Lang; heightClass?: string; note?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const info = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const pins = mappable(listings);

  useEffect(() => {
    let alive = true;
    loadMaps().then(() => {
      if (!alive || !el.current) return;
      const g = window.google.maps;
      map.current = new g.Map(el.current, { center: { lat: 35.0, lng: 33.2 }, zoom: 8, clickableIcons: false, mapTypeControl: false, streetViewControl: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }] });
      info.current = new g.InfoWindow();
      setReady(true);
    }).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const g = window.google.maps;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    const bounds = new g.LatLngBounds();
    for (const l of pins) {
      const pos = { lat: l.lat as number, lng: l.lng as number };
      const m = new g.Marker({ position: pos, map: map.current, title: pick(lang, l.name_en, l.name_el) });
      m.addListener("click", () => {
        const div = document.createElement("div");
        const t = document.createElement("strong"); t.textContent = pick(lang, l.name_en, l.name_el);
        const a = document.createElement("a"); const href = `/explore/place/${l.slug}${lang === "el" ? "?lang=el" : ""}`; a.href = href; a.textContent = EL(lang, "View place →", "Προβολή →");
        a.style.display = "block"; a.style.marginTop = "4px";
        a.onclick = (e) => { e.preventDefault(); navigate(href); };
        div.append(t, a);
        info.current.setContent(div); info.current.open({ map: map.current, anchor: m });
      });
      markers.current.push(m);
      bounds.extend(pos);
    }
    if (pins.length > 1) map.current.fitBounds(bounds, 48);
    else if (pins.length === 1) { map.current.setCenter(bounds.getCenter()); map.current.setZoom(13); }
  }, [ready, pins.map((p) => p.id).join(","), lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className={`relative ${heightClass} w-full border border-border bg-muted`}>
        <div ref={el} className="absolute inset-0" />
        {error && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">{EL(lang, "The map could not load. Use the list view instead.", "Ο χάρτης δεν φόρτωσε. Χρησιμοποιήστε τη λίστα.")}</p>}
      </div>
      {note && <p className="text-xs text-muted-foreground mt-2">
        {EL(lang, `${pins.length} of ${listings.length} places shown on the map — only those with officially verified coordinates.`,
          `${pins.length} από ${listings.length} μέρη στον χάρτη — μόνο όσα έχουν επιβεβαιωμένες συντεταγμένες.`)}
      </p>}
    </div>
  );
}
