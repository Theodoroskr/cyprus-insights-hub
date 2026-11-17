// Pure builders for the Greece edition's own sitemap, Google News sitemap and Greek RSS feed
// (written by scripts/generate-sitemap.ts and scripts/generate-rss.ts). Addresses are on
// businesshub.gr once GR_DOMAIN_LIVE is on, and on businesshub.cy/greece until then.
import { CY_HOST, GR_DOMAIN_LIVE, GR_HOST, GR_SECTIONS, grHref } from "./edition";
import { articlePath } from "./articleUrl";
import { buildNewsSitemap, buildUrlset, dateOnly, recentNews, type SitemapEntry } from "./sitemap";
import { buildRssFeed, plainSummary, selectItems, type RssItem } from "./rss";

export interface GreeceRow {
  id: string;
  title: string | null;
  title_el: string | null;
  summary: string | null;
  summary_el: string | null;
  image_url: string | null;
  published_at: string | null;
  gr_section: string | null;
}

export const GREECE_SITEMAP_PATH = "/sitemap-gr.xml";
export const GREECE_NEWS_SITEMAP_PATH = "/news-sitemap-gr.xml";
export const GREECE_RSS_PATH = "/rss/greece.xml";

export function greeceBase(live = GR_DOMAIN_LIVE): string {
  return live ? GR_HOST : CY_HOST;
}

/** An app path ("/greece/banking", "/article/…") as written on the Greece edition's host. */
export function greecePath(appPath: string, live = GR_DOMAIN_LIVE): string {
  return live ? grHref(appPath, true) : appPath;
}

const greekTitle = (r: GreeceRow) => (r.title_el || r.title || "").trim();

export function greeceSitemap(rows: GreeceRow[], orgSlugs: string[], live = GR_DOMAIN_LIVE): string {
  const entries: SitemapEntry[] = [
    { path: "/greece", changefreq: "daily", priority: "1.0" },
    ...GR_SECTIONS.map((s) => ({ path: `/greece/${s.slug}`, changefreq: "daily" as const, priority: "0.8" })),
    ...orgSlugs.map((slug) => ({ path: `/greece/org/${encodeURIComponent(slug)}`, changefreq: "weekly" as const, priority: "0.6" })),
    ...rows.filter((r) => r.published_at).map((r) => ({
      path: articlePath(r.id, r.title), lastmod: dateOnly(r.published_at), changefreq: "monthly" as const, priority: "0.6",
    })),
  ];
  return buildUrlset(entries.map((e) => ({ ...e, path: greecePath(e.path, live) })), greeceBase(live));
}

/** Greece stories first published in the last 48 hours, with their Greek headline. */
export function greeceNewsSitemap(rows: GreeceRow[], live = GR_DOMAIN_LIVE, now = Date.now()): string {
  const items = recentNews(rows, now)
    .filter((r) => greekTitle(r))
    .map((r) => ({ path: articlePath(r.id, r.title), title: greekTitle(r), publishedAt: r.published_at!, language: "el" }));
  return buildNewsSitemap(items, greeceBase(live), "BusinessHub.gr");
}

export function greeceRssItem(r: GreeceRow): RssItem | null {
  if (!greekTitle(r) || !r.published_at) return null;
  return {
    title: greekTitle(r),
    path: articlePath(r.id, r.title),
    description: plainSummary(r.summary_el || r.summary),
    publishedAt: r.published_at,
    category: GR_SECTIONS.find((s) => s.slug === r.gr_section)?.el,
    imageUrl: r.image_url,
  };
}

export function greeceRss(rows: GreeceRow[], live = GR_DOMAIN_LIVE, now = new Date()): string {
  return buildRssFeed(
    {
      title: "BusinessHub.gr — Ελλάδα",
      description: "Επιχειρηματική ενημέρωση για την Ελλάδα: τράπεζες, εταιρικές ανακοινώσεις, χρηματοδοτήσεις και οικονομικά δεδομένα.",
      selfPath: GREECE_RSS_PATH,
      pagePath: greecePath("/greece", live),
      language: "el",
    },
    selectItems(rows.map(greeceRssItem)),
    greeceBase(live),
    now,
  );
}

/** robots.txt with its Sitemap lines replaced by `sitemaps` (everything else kept as is). */
export function robotsWithSitemaps(robots: string, sitemaps: string[]): string {
  const rules = robots.split("\n").filter((l) => !/^sitemap:/i.test(l.trim())).join("\n").replace(/\n+$/, "");
  return `${rules}\n\n${sitemaps.map((s) => `Sitemap: ${s}`).join("\n")}\n`;
}
