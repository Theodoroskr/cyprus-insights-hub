// Runs before `vite build` (prebuild hook); writes public/rss.xml (all stories)
// and public/rss/<hub>.xml from published articles so feeds live on the site's
// own domain. If the database can't be reached, the existing files are kept.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  RSS_HUBS,
  EDITION_FEEDS,
  inEditionFeed,
  EDITION_MIX,
  mixFeed,
  RSS_ITEM_LIMIT,
  buildRssFeed,
  newsToItem,
  selectItems,
  storyToItem,
  type NewsRow,
  type StoryRow,
} from "../src/lib/rss";
import { GREECE_RSS_PATH, greeceRss, greeceRssItem, type GreeceRow } from "../src/lib/greeceFeeds";

function readEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const file = resolve(".env");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
      if (m) env[m[1]] = m[2];
    }
  }
  return { ...env, ...(process.env as Record<string, string>) };
}

const env = readEnv();
const API_URL = env.VITE_SUPABASE_URL;
const API_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function get<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()) as T[];
}

const NEWS_COLS = "select=id,title,summary,what_happened,image_url,vertical,published_at";

async function main() {
  if (!API_URL || !API_KEY) throw new Error("database URL/key not set");

  const [latest, stories, ...perHub] = await Promise.all([
    get<NewsRow>(
      "cna_articles",
      `${NEWS_COLS}&status=eq.published&edition=cs.{cy}&published_at=not.is.null&order=published_at.desc&limit=${RSS_ITEM_LIMIT}`,
    ),
    get<StoryRow>(
      "directory_articles",
      `select=slug,title,excerpt,cover_image,article_type,published_at&is_published=eq.true&published_at=not.is.null&order=published_at.desc&limit=${RSS_ITEM_LIMIT}`,
    ),
    ...RSS_HUBS.map((h) =>
      get<NewsRow>(
        "cna_articles",
        `${NEWS_COLS}&status=eq.published&edition=cs.{cy}&vertical=eq.${h.vertical}&published_at=not.is.null&order=published_at.desc&limit=${RSS_ITEM_LIMIT}`,
      ),
    ),
  ]);

  const allItems = selectItems([...latest.map(newsToItem), ...stories.map(storyToItem)]);
  writeFileSync(
    resolve("public/rss.xml"),
    buildRssFeed(
      {
        title: "BusinessHub.cy — Cyprus Edition",
        description: "Latest Cyprus business, fintech, compliance and regtech intelligence from BusinessHub.cy.",
        selfPath: "/rss.xml",
      },
      allItems,
    ),
  );

  const hubDir = resolve("public/rss");
  if (!existsSync(hubDir)) mkdirSync(hubDir, { recursive: true });
  RSS_HUBS.forEach((h, i) => {
    const items = selectItems(perHub[i].map(newsToItem));
    writeFileSync(
      resolve(hubDir, `${h.key}.xml`),
      buildRssFeed(
        {
          title: `BusinessHub.cy — ${h.label}`,
          description: `Latest ${h.label} stories from BusinessHub.cy, Cyprus Edition.`,
          selfPath: `/rss/${h.key}.xml`,
          pagePath: h.key === "business" ? "/news" : `/${h.key}`,
        },
        items,
      ),
    );
  });

  // Edition feeds, each mixing in the other editions' stories (shares in EDITION_MIX).
  type PoolRow = NewsRow & GreeceRow & { tags: string[] | null; edition: string[] | null };
  const cols = `${NEWS_COLS},title_el,summary_el,gr_section,tags,edition&status=eq.published&published_at=not.is.null&order=published_at.desc&limit=400`;
  const [cyPool, greece] = await Promise.all([
    get<PoolRow>("cna_articles", `${cols}&edition=cs.{cy}`),
    get<PoolRow>("cna_articles", `${cols}&edition=cs.{gr}`),
  ]);
  const cyRows = cyPool.filter((r) => inEditionFeed(r, "cyprus"));
  const intlRows = cyPool.filter((r) => inEditionFeed(r, "international"));
  const en = (rows: PoolRow[]) => rows.map(newsToItem);
  const el = (rows: PoolRow[]) => rows.filter((r) => r.title_el?.trim()).map(greeceRssItem); // Greek feed stays in Greek
  const feeds = {
    cyprus: mixFeed(en(cyRows), [{ items: en(intlRows), share: EDITION_MIX.cyprus.international }, { items: en(greece), share: EDITION_MIX.cyprus.greece }]),
    international: mixFeed(en(intlRows), [{ items: en(greece), share: EDITION_MIX.international.greece }, { items: en(cyRows), share: EDITION_MIX.international.cyprus }]),
  };
  for (const f of EDITION_FEEDS) {
    writeFileSync(
      resolve(hubDir, `${f.key}.xml`),
      buildRssFeed({ title: `BHub Network — ${f.label}`, description: `Latest ${f.label} business stories from BHub Network.`, selfPath: `/rss/${f.key}.xml`, pagePath: f.pagePath }, feeds[f.key]),
    );
  }
  const grItems = mixFeed(greece.map(greeceRssItem), [{ items: el(intlRows), share: EDITION_MIX.greece.international }, { items: el(cyRows), share: EDITION_MIX.greece.cyprus }]);
  writeFileSync(resolve(`public${GREECE_RSS_PATH}`), greeceRss(greece, undefined, undefined, grItems));

  console.log(`rss written: ${allItems.length} items in /rss.xml, ${RSS_HUBS.length} hub feeds, ${greece.length} Greece stories`);
}

main().catch((err) => {
  console.warn(`rss not regenerated, keeping existing files: ${err instanceof Error ? err.message : err}`);
});
