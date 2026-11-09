// Pure helpers used by scripts/generate-sitemap.ts to build the sitemap files
// served from the site's own domain.

export const SITE_URL = "https://businesshub.cy";

/** Max URLs per child sitemap (the protocol allows 50,000). */
export const COMPANIES_PER_SITEMAP = 20000;

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const DISTRICTS = ["nicosia", "limassol", "larnaca", "paphos", "famagusta"];

export const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/directory", changefreq: "daily", priority: "0.9" },
  { path: "/directory/cysec-licensed-firms", changefreq: "weekly", priority: "0.8" },
  { path: "/news", changefreq: "daily", priority: "0.8" },
  { path: "/fintech", changefreq: "weekly", priority: "0.8" },
  { path: "/compliance", changefreq: "weekly", priority: "0.8" },
  { path: "/regtech", changefreq: "weekly", priority: "0.8" },
  { path: "/sme", changefreq: "weekly", priority: "0.8" },
  { path: "/interviews", changefreq: "weekly", priority: "0.7" },
  { path: "/trade", changefreq: "weekly", priority: "0.7" },
  { path: "/real-estate", changefreq: "monthly", priority: "0.7" },
  { path: "/tourism", changefreq: "monthly", priority: "0.7" },
  { path: "/economy", changefreq: "weekly", priority: "0.7" },
  { path: "/intelligence/mastercard", changefreq: "monthly", priority: "0.6" },
  { path: "/intelligence/mastercard/spendingpulse", changefreq: "monthly", priority: "0.5" },
  { path: "/open-data", changefreq: "monthly", priority: "0.5" },
  ...DISTRICTS.map((d) => ({ path: `/real-estate/${d}`, changefreq: "monthly" as const, priority: "0.6" })),
  ...DISTRICTS.map((d) => ({ path: `/directory/city/${d}`, changefreq: "weekly" as const, priority: "0.7" })),
  { path: "/resources", changefreq: "weekly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/cookies", changefreq: "yearly", priority: "0.2" },
];

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildUrlset(entries: SitemapEntry[], base = SITE_URL): string {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${escapeXml(base + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** `files` are paths relative to the site root, e.g. "/sitemaps/static.xml". */
export function buildSitemapIndex(files: string[], base = SITE_URL): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...files.map((f) => `  <sitemap><loc>${escapeXml(base + f)}</loc></sitemap>`),
    "</sitemapindex>",
    "",
  ].join("\n");
}

/** Splits a list into consecutive chunks of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Date part (YYYY-MM-DD) of a timestamp, or undefined if missing/invalid. */
export function dateOnly(ts: string | null | undefined): string | undefined {
  if (!ts) return undefined;
  const m = /^\d{4}-\d{2}-\d{2}/.exec(ts);
  return m ? m[0] : undefined;
}
