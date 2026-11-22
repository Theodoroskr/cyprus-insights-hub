import { useLocation } from "react-router-dom";
import { CY_HOST, INTL_DOMAIN_LIVE, INTL_HOST, INTL_PATH, grHref, greeceUrl, onGrHost, onIntlHost, useEdition } from "@/lib/edition";

export { INTL_HOST, INTL_PATH };

/** The three editions of the network, in switcher order. Kept apart from the reading language. */
export type NetworkEdition = "intl" | "cy" | "gr";

/** Which address the visitor is on: businesshub.gr, bhubnetwork.com (once it carries the International edition), else the Cyprus site. */
export type HostKind = NetworkEdition;

export const NETWORK_EDITIONS: { key: NetworkEdition; en: string; el: string; brand: string }[] = [
  { key: "intl", en: "International", el: "Διεθνή", brand: "BHub Network" },
  { key: "cy", en: "Cyprus", el: "Κύπρος", brand: "BusinessHub.cy" },
  { key: "gr", en: "Greece", el: "Ελλάδα", brand: "BusinessHub Ελλάδα" },
];

export interface EditionLink { key: NetworkEdition; label: string; href: string; external: boolean }

export function currentHost(): HostKind {
  if (onGrHost()) return "gr";
  if (onIntlHost()) return "intl";
  return "cy";
}

/** Home of the International edition as written on the given host. */
export function intlHome(host: HostKind, live: boolean = INTL_DOMAIN_LIVE): { href: string; external: boolean } {
  if (host === "intl") return { href: "/", external: false };
  if (live) return { href: `${INTL_HOST}/`, external: true };
  if (host === "gr") return { href: `${CY_HOST}${INTL_PATH}`, external: true };
  return { href: INTL_PATH, external: false };
}

/** Home of the Cyprus edition as written on the given host. */
export function cyprusHome(host: HostKind): { href: string; external: boolean } {
  return host === "cy" ? { href: "/", external: false } : { href: `${CY_HOST}/`, external: true };
}

/** Home of the Greece edition as written on the given host. */
export function greeceHome(host: HostKind, english = false): { href: string; external: boolean } {
  const q = english ? "?lang=en" : "";
  if (host === "gr") return { href: `/${q}`, external: false };
  if (host === "intl") return { href: `${greeceUrl("/greece")}${q}`, external: true };
  return { href: `${grHref("/greece", false)}${q}`, external: false };
}

/** Switcher links for the current host: each edition opens on the address that serves it. */
export function editionLinks(lang: "en" | "el", host: HostKind, live: boolean = INTL_DOMAIN_LIVE, from?: NetworkEdition): EditionLink[] {
  // From the International edition (English only) the Greece edition opens in English.
  const english = from === "intl" || (from === undefined && host === "intl");
  return NETWORK_EDITIONS.map((e) => {
    const label = lang === "el" ? e.el : e.en;
    const to = e.key === "intl" ? intlHome(host, live) : e.key === "cy" ? cyprusHome(host) : greeceHome(host, english);
    return { key: e.key, label, ...to };
  });
}

/** Where the network name points: the International edition, at the address of the current host. */
export function networkHome(host: HostKind, live: boolean = INTL_DOMAIN_LIVE): { href: string; external: boolean } {
  return intlHome(host, live);
}

/** Which edition a page belongs to, for the logo, the menu and the switcher. */
export function currentNetworkEdition(edition: "cy" | "gr", pathname: string, host: HostKind = "cy"): NetworkEdition {
  if (edition === "gr") return "gr";
  if (pathname === INTL_PATH || pathname.startsWith(`${INTL_PATH}/`) || (host === "intl" && pathname === "/")) return "intl";
  return "cy";
}

export function useNetworkEdition(): NetworkEdition {
  const { pathname } = useLocation();
  return currentNetworkEdition(useEdition(), pathname, currentHost());
}
