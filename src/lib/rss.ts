// Pure helpers used by scripts/generate-rss.ts to build the RSS feeds
// served from the site's own domain (/rss.xml and /rss/<hub>.xml).

import { SITE_URL, escapeXml } from "./sitemap";
import { isInternationalStory } from "./storyOrigin";
import { mixByShare } from "./editionMix";

/** How many of the newest stories each feed carries. */
export const RSS_ITEM_LIMIT = 50;

export const RSS_HUBS = [
  { key: "business", vertical: "general", label: "Business" },
  { key: "fintech", vertical: "fintech", label: "FinTech" },
  { key: "compliance", vertical: "compliance", label: "Compliance" },
  { key: "regtech", vertical: "regtech", label: "RegTech" },
  { key: "sme", vertical: "sme", label: "SME" },
] as const;

export interface RssItem {
  title: string;
  path: string;
  description: string;
  publishedAt: string;
  category?: string;
  imageUrl?: string | null;
}

export interface NewsRow {
  id: string;
  title: string | null;
  summary: string | null;
  what_happened: string | null;
  image_url: string | null;
  vertical: string | null;
  published_at: string | null;
}

export interface StoryRow {
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  cover_image: string | null;
  article_type: string | null;
  published_at: string | null;
}

/** Strip Markdown/HTML and shorten to a social-post-friendly length. */
export function plainSummary(text: string | null | undefined, max = 300): string {
  const plain = (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

export function hubLabel(vertical: string | null | undefined): string | undefined {
  return RSS_HUBS.find((h) => h.vertical === vertical)?.label;
}

export function newsToItem(row: NewsRow): RssItem | null {
  if (!row.title || !row.published_at) return null;
  return {
    title: row.title.trim(),
    path: `/article/${row.id}`,
    description: plainSummary(row.summary || row.what_happened),
    publishedAt: row.published_at,
    category: hubLabel(row.vertical),
    imageUrl: row.image_url,
  };
}

export function storyToItem(row: StoryRow): RssItem | null {
  if (!row.slug || !row.title || !row.published_at) return null;
  const interview = row.article_type === "interview";
  return {
    title: row.title.trim(),
    path: `/${interview ? "interviews" : "news"}/${encodeURIComponent(row.slug)}`,
    description: plainSummary(row.excerpt),
    publishedAt: row.published_at,
    category: interview ? "Interviews" : "Business",
    imageUrl: row.cover_image,
  };
}

/** Newest first, no repeated links, capped at `limit`. */
export function selectItems(items: (RssItem | null)[], limit = RSS_ITEM_LIMIT): RssItem[] {
  const seen = new Set<string>();
  return items
    .filter((i): i is RssItem => !!i && !Number.isNaN(Date.parse(i.publishedAt)))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter((i) => (seen.has(i.path) ? false : (seen.add(i.path), true)))
    .slice(0, limit);
}

function absoluteImage(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return base + url;
  return null;
}

export interface FeedMeta {
  title: string;
  description: string;
  /** Feed file path on the site, e.g. "/rss.xml". */
  selfPath: string;
  /** Page the feed represents, e.g. "/" or "/fintech". */
  pagePath?: string;
  /** Feed language; English unless set (the Greece feed is "el"). */
  language?: string;
}

const HUB_IMAGES: Record<string, string> = {
  FinTech: "/images/og-fintechhub.png",
  Compliance: "/images/og-compliancehub.png",
  RegTech: "/images/og-regtechhub.png",
};

/** Branded picture for a story that has no photo of its own. */
export function fallbackImage(category?: string): string {
  return (category && HUB_IMAGES[category]) || "/images/og-businesshub.png";
}

export function buildRssFeed(meta: FeedMeta, items: RssItem[], base = SITE_URL, now = new Date()): string {
  const lastBuild = items[0] ? new Date(items[0].publishedAt) : now;
  const body = items.map((i) => {
    const link = escapeXml(base + i.path);
    const img = absoluteImage(i.imageUrl, base) ?? base + fallbackImage(i.category);
    const type = /\.png(\?|$)/i.test(img) ? "image/png" : /\.webp(\?|$)/i.test(img) ? "image/webp" : "image/jpeg";
    return [
      "    <item>",
      `      <title>${escapeXml(i.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${new Date(i.publishedAt).toUTCString()}</pubDate>`,
      i.category ? `      <category>${escapeXml(i.category)}</category>` : null,
      `      <description>${escapeXml(i.description)}</description>`,
      `      <media:content url="${escapeXml(img)}" medium="image" type="${type}" />`,
      `      <enclosure url="${escapeXml(img)}" type="${type}" length="0" />`,
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
    "  <channel>",
    `    <title>${escapeXml(meta.title)}</title>`,
    `    <link>${escapeXml(base + (meta.pagePath ?? "/"))}</link>`,
    `    <description>${escapeXml(meta.description)}</description>`,
    `    <language>${meta.language ?? "en"}</language>`,
    `    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(base + meta.selfPath)}" rel="self" type="application/rss+xml" />`,
    "    <image>",
    `      <url>${escapeXml(base + "/apple-touch-icon.png")}</url>`,
    `      <title>${escapeXml(meta.title)}</title>`,
    `      <link>${escapeXml(base + (meta.pagePath ?? "/"))}</link>`,
    "    </image>",
    ...body,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/** Edition feeds: Cyprus = Cyprus stories, International = neither Cyprus nor Greece. Greece has its own feed (greeceFeeds.ts). */
export const EDITION_FEEDS = [
  { key: "cyprus", label: "Cyprus", pagePath: "/news?scope=cyprus" },
  { key: "international", label: "International", pagePath: "/intl" },
] as const;
export type EditionFeedKey = (typeof EDITION_FEEDS)[number]["key"];
export interface RssFeedLink {
  label: string;
  /** Feed file on the site, e.g. "/rss/cyprus.xml". */
  path: string;
  /** Short qualifier shown beside the label, e.g. "Greek". */
  note?: string;
}

export interface RssFeedGroup {
  title: string;
  /** One line telling a reader what this group is for. */
  blurb: string;
  feeds: RssFeedLink[];
}

/** Every feed the site publishes, grouped the way the footer presents them. */
export const RSS_FEED_GROUPS: RssFeedGroup[] = [
  {
    title: "Editions",
    blurb: "One edition's own stories, with a slice of the others.",
    feeds: [
      { label: "Cyprus", path: "/rss/cyprus.xml" },
      { label: "Greece", path: "/rss/greece.xml", note: "Greek" },
      { label: "International", path: "/rss/international.xml" },
    ],
  },
  {
    title: "Topics",
    blurb: "A single subject, across every edition.",
    feeds: RSS_HUBS.map((h) => ({ label: h.label, path: `/rss/${h.key}.xml` })),
  },
  {
    title: "Everything",
    blurb: "The whole site in one feed.",
    feeds: [{ label: "All stories", path: "/rss.xml" }],
  },
];

/** Flat list of every advertised feed, for tests and feed auto-discovery. */
export const RSS_FEED_LINKS: RssFeedLink[] = RSS_FEED_GROUPS.flatMap((g) => g.feeds);

const GREECE_RE = /\b(greece|greek|hellenic|athens|thessaloniki|piraeus)\b|(ελλάδ|ελλην|αθήν)/i;
type ScopeRow = NewsRow & { tags?: string[] | null; edition?: string[] | null };

export function inEditionFeed(row: ScopeRow, feed: EditionFeedKey): boolean {
  const intl = isInternationalStory(row);
  if (feed === "cyprus") return !intl;
  if (!intl) return false;
  if ((row.edition ?? []).includes("gr")) return false;
  return !GREECE_RE.test([row.title, row.summary, row.what_happened].filter(Boolean).join(" "));
}

/** Share of each other edition's stories mixed into an edition feed; the rest is the edition's own. */
export const EDITION_MIX = {
  international: { greece: 0.15, cyprus: 0.1 },
  greece: { international: 0.25, cyprus: 0.1 },
  cyprus: { international: 0.25, greece: 0.15 }, // same as the Cyprus homepage (CYPRUS_HOME_MIX)
} as const;

/** Mix other editions' items into an edition feed by share (see `mixByShare`); invalid dates dropped, no link twice, newest first. */
export function mixFeed(own: (RssItem | null)[], others: { items: (RssItem | null)[]; share: number }[], limit = RSS_ITEM_LIMIT): RssItem[] {
  const clean = (pool: (RssItem | null)[]) => selectItems(pool, Number.MAX_SAFE_INTEGER);
  return mixByShare(clean(own), others.map((o) => ({ items: clean(o.items), share: o.share })), limit, (i) => i.path, (i) => Date.parse(i.publishedAt));
}
