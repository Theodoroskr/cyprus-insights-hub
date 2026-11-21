import { CY_HOST, grHref } from "@/lib/edition";

/** The three editions of the network, in switcher order. Kept apart from the reading language. */
export type NetworkEdition = "intl" | "cy" | "gr";

export const INTL_HOST = "https://bhubnetwork.com";

export const NETWORK_EDITIONS: { key: NetworkEdition; en: string; el: string; brand: string }[] = [
  { key: "intl", en: "International", el: "Διεθνή", brand: "BHub Network" },
  { key: "cy", en: "Cyprus", el: "Κύπρος", brand: "BusinessHub.cy" },
  { key: "gr", en: "Greece", el: "Ελλάδα", brand: "BusinessHub Ελλάδα" },
];

/** Until the International homepage exists, the International edition opens the international news list. */
export const INTL_PATH = "/news?scope=international";

export interface EditionLink { key: NetworkEdition; label: string; href: string; external: boolean }

/**
 * Switcher links for the current host. On businesshub.gr only the Greece edition is served,
 * so Cyprus and International open on businesshub.cy.
 */
export function editionLinks(lang: "en" | "el", onGr: boolean): EditionLink[] {
  return NETWORK_EDITIONS.map((e) => {
    const label = lang === "el" ? e.el : e.en;
    if (e.key === "gr") return { key: e.key, label, href: onGr ? "/" : grHref("/greece", false), external: false };
    const path = e.key === "cy" ? "/" : INTL_PATH;
    return onGr ? { key: e.key, label, href: `${CY_HOST}${path}`, external: true } : { key: e.key, label, href: path, external: false };
  });
}

/** Which edition a page belongs to, for highlighting the switcher. */
export function currentNetworkEdition(edition: "cy" | "gr", pathname: string, search: string): NetworkEdition {
  if (edition === "gr") return "gr";
  if (pathname === "/news" && new URLSearchParams(search).get("scope") === "international") return "intl";
  return "cy";
}
