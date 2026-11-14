/** The BusinessHub top menu: nine main links, with every section listed behind the Menu button. */

export type NavLink = { label: string; href: string };
export type NavItem = NavLink & { children?: NavLink[] };

export const PRIMARY_NAV: NavItem[] = [
  { label: "News", href: "/news", children: [{ label: "All news", href: "/news" }, { label: "Company Announcements", href: "/company-announcements" }, { label: "Energy / Ενέργεια", href: "/energy" }] },
  { label: "Rankings", href: "/rankings" },
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
];

export const MENU_SECTIONS: { title: string; links: NavLink[] }[] = [
  { title: "News", links: [
    { label: "All news", href: "/news" },
    { label: "Company Announcements", href: "/company-announcements" },
    { label: "Energy news", href: "/energy/news" },
    { label: "Interviews", href: "/interviews" },
  ] },
  { title: "Data & rankings", links: [
    { label: "Cyprus Rankings", href: "/rankings" },
    { label: "Economy", href: "/economy" },
    { label: "Trade", href: "/trade" },
    { label: "Real Estate", href: "/real-estate" },
    { label: "Tourism statistics", href: "/tourism" },
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
    { label: "EnergyHub.cy — Energy / Ενέργεια", href: "/energy" },
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
