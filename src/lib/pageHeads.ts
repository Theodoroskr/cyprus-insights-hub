// Own title/description for each section page, written into that page's HTML at publish
// time so search robots (which read the HTML before the site's code runs) see a distinct
// page with a self-referencing canonical, not a copy of the homepage.
import { escapeAttr, plainText } from "./storyPreview";

const SITE = "https://businesshub.cy";

export interface PageHead { path: string; title: string; description: string; image?: string; type?: string }

const D = (path: string, title: string, description: string): [string, { title: string; description: string }] => [path, { title, description }];

export const SECTION_HEADS: Record<string, { title: string; description: string }> = Object.fromEntries([
  D("/directory", "Cyprus Business Directory — Company Search", "Search registered Cyprus companies by name, city and activity, with registration details and regulator licences."),
  D("/directory/cysec-licensed-firms", "CySEC-Licensed Firms in Cyprus", "Investment firms and fund managers licensed by the Cyprus Securities and Exchange Commission, from the official register."),
  D("/news", "Cyprus Business News & Insights", "The latest Cyprus business, finance, compliance, fintech and regtech news from official and trusted sources, in English."),
  D("/fintech", "FinTechHub — Cyprus Digital Finance News", "MiCA, DORA, AML and licensing news for Cyprus fintech and payments firms."),
  D("/compliance", "ComplianceHub — Cyprus AML, Sanctions & Regulatory Compliance", "Cyprus compliance news, AML and sanctions alerts, a regulatory calendar and practical guidance for compliance officers."),
  D("/compliance/regulatory-updates", "Cyprus Regulatory Updates — ComplianceHub", "Circulars, directives and announcements from Cyprus and EU regulators, each linked to the official document."),
  D("/compliance/sanctions", "Sanctions Updates for Cyprus Firms — ComplianceHub", "EU, UN and national sanctions changes relevant to Cyprus obliged entities."),
  D("/compliance/deadlines", "Cyprus Compliance Deadlines — ComplianceHub", "Upcoming regulatory reporting and compliance deadlines for Cyprus firms."),
  D("/compliance/guidance", "Cyprus Compliance Guidance — ComplianceHub", "Official guidance and practical notes for Cyprus compliance officers."),
  D("/regtech", "RegTechHub — DORA, Cyber & RegTech in Cyprus", "DORA readiness, the RegTech vendor landscape, cyber and ICT risk for Cyprus regulated firms."),
  D("/sme", "SMEHub — News, Funding & Tools for Cyprus Small Businesses", "Business news, grants, tax deadlines and practical tools for small and medium-sized enterprises in Cyprus."),
  D("/energy", "EnergyHub.cy — Cyprus Energy News", "Cyprus energy news for business: electricity prices, solar and storage, the grid, regulation, projects, natural gas and efficiency."),
  D("/energy/news", "Energy News Archive — Cyprus | EnergyHub.cy", "Searchable archive of Cyprus energy news by topic: electricity, solar, grid, policy, projects, gas and efficiency."),
  D("/explore", "TourismHub — Explore Cyprus", "Officially sourced guide to Cyprus destinations, attractions, events and conference venues."),
  D("/explore/nicosia-countryside", "Nicosia City & Countryside — TourismHub", "Villages, sights and events in Nicosia city and countryside, with verified visitor details."),
  D("/explore/conference-venues", "Conference & Meeting Venues in Cyprus — TourismHub", "Hotels and venues in Cyprus with meeting rooms, capacities and quote requests."),
  D("/explore/news", "Tourism & Hospitality News — Cyprus | TourismHub", "Cyprus tourism and hospitality news: arrivals, hotels, airlines, grants and policy."),
  D("/interviews", "Interviews — Cyprus Business Leaders", "Interviews with Cyprus business, finance and policy leaders."),
  D("/trade", "Cyprus Trade & Import Analytics — CYSTAT Trade Data", "Cyprus import and export trends, top trading partners and product categories from official CYSTAT statistics."),
  D("/real-estate", "Cyprus Real Estate Intelligence — Sales & Transfers", "Official Cyprus property sale contracts and transfers by district and month, from the Department of Lands and Surveys."),
  D("/tourism", "Cyprus Tourism Statistics — Arrivals by Month", "Monthly tourist arrivals to Cyprus by country of residence, from CYSTAT."),
  D("/economy", "Cyprus Economy Dashboard — Official Indicators", "Inflation, GDP, unemployment and other Cyprus economic indicators from CYSTAT and Eurostat."),
  D("/rankings", "Cyprus Rankings — Companies & Markets", "Rankings of Cyprus companies and markets built only from official data, each list sourced."),
  D("/funding", "Funding & Subsidies for Cyprus Businesses", "Open grants, subsidies and EU funding calls for Cyprus businesses, verified against official call documents."),
  D("/company-announcements", "Cyprus Company Announcements", "Disclosures and announcements from Cyprus listed and private companies, each linked to its filing."),
  D("/financial-literacy", "Financial Literacy Cyprus", "Practical money guides, research and tools for households and small businesses in Cyprus."),
  D("/financial-literacy/academy", "Financial Literacy Academy — Cyprus", "Short lessons on budgeting, credit, saving and investing for Cyprus residents."),
  D("/financial-literacy/observatory", "Financial Literacy Observatory — Cyprus", "Research findings on financial literacy in Cyprus."),
  D("/financial-literacy/household", "Household Finances in Cyprus", "Household budgeting and money management for Cyprus residents."),
  D("/financial-literacy/cost-of-living", "Cost of Living in Cyprus", "Prices, inflation and cost-of-living data for Cyprus households."),
  D("/financial-literacy/credit", "Credit & Borrowing in Cyprus", "Loans, interest rates and responsible borrowing in Cyprus."),
  D("/financial-literacy/calculators", "Money Calculators — Financial Literacy Cyprus", "Loan, savings and budget calculators for Cyprus residents."),
  D("/financial-literacy/research", "Financial Literacy Research — Cyprus", "Studies and reports on financial literacy in Cyprus and the EU."),
  D("/financial-literacy/campaigns", "Financial Literacy Campaigns — Cyprus", "Public financial education campaigns in Cyprus."),
  D("/financial-literacy/methodology", "Methodology — Financial Literacy Cyprus", "How the Financial Literacy Cyprus figures and findings are sourced and checked."),
  D("/intelligence/mastercard", "Payments Intelligence — Cyprus", "Payments and consumer spending insights for Cyprus businesses."),
  D("/intelligence/mastercard/spendingpulse", "SpendingPulse — Cyprus Consumer Spending", "Consumer spending trends for Cyprus."),
  D("/open-data", "Open Data Sources — BusinessHub.cy", "The official Cyprus and EU datasets behind BusinessHub.cy dashboards, with licences and update checks."),
  D("/resources", "Resource Hub — Cyprus Business Guides & Reports", "Guides, glossaries, compliance tools and reports for doing business in Cyprus."),
  D("/privacy", "Privacy Policy — BusinessHub.cy", "How BusinessHub.cy collects, uses and protects your personal data."),
  D("/terms", "Terms of Service — BusinessHub.cy", "The terms that apply when you use BusinessHub.cy."),
  D("/cookies", "Cookie Policy — BusinessHub.cy", "Which cookies BusinessHub.cy uses and how to change your preferences."),
]);

const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Head text for a fixed section page, including per-district pages. Null for the homepage/unknown. */
export function sectionHead(path: string): PageHead | null {
  const h = SECTION_HEADS[path];
  if (h) return { path, ...h };
  let m = /^\/directory\/city\/([a-z-]+)$/.exec(path);
  if (m) return { path, title: `Companies in ${titleCase(m[1])}, Cyprus — Business Directory`, description: `Registered companies in ${titleCase(m[1])}, Cyprus, by activity, with registration details.` };
  m = /^\/real-estate\/([a-z-]+)$/.exec(path);
  if (m) return { path, title: `${titleCase(m[1])} Property Sales & Transfers — Cyprus Real Estate`, description: `Official property sale contracts and transfers in ${titleCase(m[1])} district, by month.` };
  return null;
}

export function companyHead(c: { slug: string; company_name: string; city?: string | null; activity_description?: string | null; registration_no?: string | null }): PageHead {
  const where = c.city ? ` in ${c.city}` : "";
  return {
    path: `/directory/company/${c.slug}`,
    title: `${plainText(c.company_name, 90)} — Cyprus Company Profile`,
    description: plainText(`${c.company_name}${where}${c.registration_no ? ` (reg. ${c.registration_no})` : ""}: ${c.activity_description || "registered company in Cyprus"}. Registration, activity and licence details.`, 200),
  };
}

/** Copy of the built index.html with this page's own title, description, canonical and share tags. */
export function buildPageHtml(template: string, p: PageHead): string {
  const full = p.title.includes("BusinessHub.cy") || /Hub(\.cy)?\b/.test(p.title) ? p.title : `${p.title} | BusinessHub.cy`;
  const title = escapeAttr(full);
  const desc = escapeAttr(plainText(p.description) || "Cyprus business intelligence from BusinessHub.cy.");
  const url = escapeAttr(`${SITE}${p.path}`);
  const img = escapeAttr(p.image ?? `${SITE}/images/og-businesshub.png`);
  let html = template.replace(/\s*<meta data-rh="true"[^>]*>/g, "").replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  const tags = [
    `<meta data-rh="true" name="description" content="${desc}" />`,
    `<link data-rh="true" rel="canonical" href="${url}" />`,
    `<meta data-rh="true" property="og:type" content="${p.type ?? "website"}" />`,
    `<meta data-rh="true" property="og:site_name" content="BusinessHub.cy" />`,
    `<meta data-rh="true" property="og:url" content="${url}" />`,
    `<meta data-rh="true" property="og:title" content="${title}" />`,
    `<meta data-rh="true" property="og:description" content="${desc}" />`,
    `<meta data-rh="true" property="og:image" content="${img}" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${title}" />`,
    `<meta data-rh="true" name="twitter:description" content="${desc}" />`,
  ].join("\n    ");
  return html.replace("</head>", `    ${tags}\n  </head>`);
}

/** PostgREST filter for companies that get their own indexed page (licences or memberships). */
export const INDEXABLE_COMPANY_FILTER = "or=(cysec_licensed.eq.true,cbc_supervised.eq.true,icpac_registered.eq.true,bar_member.eq.true,cifa_member.eq.true)";
