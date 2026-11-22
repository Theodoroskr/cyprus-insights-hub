import { grHref } from "@/lib/edition";
import { intlSectionPath, type IntlSectionSlug } from "@/lib/internationalSections";
import { grLangHref } from "@/lib/edition";
import { cyprusHome, greeceHome, type HostKind, type NetworkEdition } from "@/lib/networkEditions";
/** The BusinessHub top menu: ten main links, with every section listed behind the Menu button. */

export type NavLink = { label: string; href: string };
export type NavItem = NavLink & { children?: NavLink[] };

export const PRIMARY_NAV: NavItem[] = [
  { label: "All news", href: "/news" },
  { label: "Directory", href: "/directory", children: [
    { label: "Business Directory", href: "/directory" },
    { label: "Tourism: Nicosia City & Countryside", href: "/explore/nicosia-countryside" },
    { label: "Conference Venues", href: "/explore/conference-venues" },
  ] },
  { label: "Funding", href: "/funding" },
  { label: "Economy", href: "/economy" },
  { label: "Trade", href: "/trade" },
  { label: "Real Estate", href: "/real-estate" },
  { label: "Compliance", href: "/compliance" },
  { label: "FinTech", href: "/fintech" },
  { label: "RegTech", href: "/regtech" },
  { label: "Energy", href: "/energy" },
];

export const MENU_SECTIONS: { title: string; links: NavLink[] }[] = [
  { title: "News", links: [
    { label: "All news", href: "/news" },
    { label: "Company Announcements", href: "/company-announcements" },
    { label: "Energy news", href: "/energy/news" },
    { label: "Greece", href: "/greece" },
    { label: "Interviews", href: "/interviews" },
  ] },
  { title: "Data & rankings", links: [
    { label: "Cyprus Rankings", href: "/rankings" },
    { label: "Economy", href: "/economy" },
    { label: "Trade", href: "/trade" },
    { label: "Real Estate", href: "/real-estate" },
    { label: "Tourism statistics", href: "/tourism" },
    { label: "Corruption perceptions", href: "/research/corruption-perceptions/cyprus" },
    { label: "Open data sources", href: "/open-data" },
  ] },
  { title: "Directory", links: [
    { label: "Business Directory", href: "/directory" },
    { label: "CySEC-licensed firms", href: "/directory/cysec-licensed-firms" },
    { label: "Who's Who", href: "/whoiswho" },
    { label: "Nicosia City & Countryside", href: "/explore/nicosia-countryside" },
    { label: "Conference Venues", href: "/explore/conference-venues" },
  ] },
  { title: "Hubs", links: [
    { label: "FinTechHub.cy", href: "/fintech" },
    { label: "ComplianceHub.cy", href: "/compliance" },
    { label: "RegTechHub.cy", href: "/regtech" },
    { label: "TourismHub.cy", href: "/explore" },
    { label: "EnergyHub.cy", href: "/energy" },
  ] },
  { title: "Guides & tools", links: [
    { label: "Financial Literacy", href: "/financial-literacy" },
    { label: "Funding & Subsidies", href: "/funding" },
    { label: "SME Toolkit", href: "/sme" },
    { label: "Resource Hub", href: "/resources" },
  ] },
];

/** Menu sections with hidden pages removed (Who's Who stays hidden until it launches). */
export function visibleMenuSections(whoIsWhoPublic: boolean) {
  return MENU_SECTIONS
    .map((s) => ({ ...s, links: s.links.filter((l) => whoIsWhoPublic || l.href !== "/whoiswho") }))
    .filter((s) => s.links.length > 0);
}

/** Top links of the International edition: each opens its own section page (/intl/<section>). */
export function intlNav(host: HostKind): NavItem[] {
  const at = (slug: IntlSectionSlug) => intlSectionPath(slug);
  return [
    { label: "Markets", href: at("markets"), children: [
      { label: "All markets", href: at("markets") },
      { label: "Cyprus edition", href: cyprusHome(host).href },
      { label: "Greece edition", href: greeceHome(host, true).href },
      { label: "Greece–Cyprus comparison", href: "/compare/greece-cyprus" },
    ] },
    { label: "Companies & Investment", href: at("companies") },
    { label: "Fintech", href: at("fintech") },
    { label: "Compliance", href: at("compliance") },
    { label: "Funding", href: at("funding") },
    { label: "Data", href: at("data") },
  ];
}

/** Top links of the Greece edition, in the reading language; every link opens a Greece page. */
export function greeceNav(lang: "en" | "el"): NavItem[] {
  const L = (el: string, en: string) => (lang === "el" ? el : en);
  return [
    { label: L("Επιχειρήσεις", "Business"), href: grLangHref("/greece/business", lang) },
    { label: L("Επενδύσεις", "Investment"), href: grLangHref("/greece/announcements", lang).replace(/(\?|$)/, (m) => (m ? "?tab=deals&" : "?tab=deals")) },
    { label: L("Τράπεζες", "Banking"), href: grLangHref("/greece/banking", lang) },
    { label: "Fintech", href: grLangHref("/greece/fintech", lang) },
    { label: L("Χρηματοδοτήσεις", "Funding"), href: grLangHref("/greece/funding", lang) },
    { label: L("Οικονομικά Στοιχεία", "Data"), href: grLangHref("/greece/business-pulse", lang) },
  ];
}

/** Greece pages linked from the header, so the Greece section row repeats them only on smaller screens. */
export const GREECE_NAV_SLUGS = ["business", "banking", "fintech", "funding", "business-pulse"];

/** The top links for the edition the visitor is reading: Cyprus keeps its own menu. */
export function editionNav(edition: NetworkEdition, lang: "en" | "el", host: HostKind): NavItem[] {
  if (edition === "intl") return intlNav(host);
  if (edition === "gr") return greeceNav(lang);
  return PRIMARY_NAV;
}

/** The edition's own links, listed first in the Menu drawer (the Cyprus menu already holds its sections). */
export function editionMenuSection(edition: NetworkEdition, lang: "en" | "el", host: HostKind): { title: string; links: NavLink[] } | null {
  if (edition === "cy") return null;
  const flat = editionNav(edition, lang, host).flatMap((i) => (i.children ? i.children : [i]));
  return { title: edition === "intl" ? "BHub Network" : "BusinessHub Ελλάδα", links: flat };
}
