// Runs before `vite build` (prebuild hook); writes public/sitemap.xml (index)
// and public/sitemaps/*.xml so every sitemap URL lives on the site's own domain.
// If the database can't be reached, the existing files are left untouched.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  COMPANIES_PER_SITEMAP,
  STATIC_ENTRIES,
  buildSitemapIndex,
  buildUrlset,
  chunk,
  dateOnly,
  type SitemapEntry,
} from "../src/lib/sitemap";

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

async function fetchAll<T>(table: string, query: string): Promise<T[]> {
  const rows: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${API_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        Range: `${from}-${from + PAGE - 1}`,
      },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const batch = (await res.json()) as T[];
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

async function main() {
  if (!API_URL || !API_KEY) throw new Error("database URL/key not set");

  const [articles, stories, resources, companies, announcements] = await Promise.all([
    fetchAll<{ id: string; published_at: string | null }>(
      "cna_articles",
      "select=id,published_at&status=eq.published&order=published_at.desc.nullslast,id.asc",
    ),
    fetchAll<{ slug: string; article_type: string; published_at: string | null }>(
      "directory_articles",
      "select=slug,article_type,published_at&is_published=eq.true&order=published_at.desc.nullslast,id.asc",
    ),
    fetchAll<{ slug: string }>("resources", "select=slug&is_published=eq.true&order=slug.asc"),
    fetchAll<{ slug: string }>("directory_companies", "select=slug&slug=not.is.null&order=id.asc"),
    fetchAll<{ slug: string; updated_at: string | null }>(
      "company_announcements",
      "select=slug,updated_at&status=eq.published&order=source_published_at.desc.nullslast,id.asc",
    ).catch(() => [] as { slug: string; updated_at: string | null }[]),
  ]);

  const staticEntries: SitemapEntry[] = [
    ...STATIC_ENTRIES,
    ...resources.map((r) => ({ path: `/resources/${encodeURIComponent(r.slug)}`, changefreq: "monthly" as const, priority: "0.6" })),
  ];

  const articleEntries: SitemapEntry[] = [
    ...stories
      .filter((s) => s.slug)
      .map((s) => ({
        path: `/${s.article_type === "interview" ? "interviews" : "news"}/${encodeURIComponent(s.slug)}`,
        lastmod: dateOnly(s.published_at),
        changefreq: "monthly" as const,
        priority: "0.7",
      })),
    ...articles.map((a) => ({
      path: `/article/${a.id}`,
      lastmod: dateOnly(a.published_at),
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
    ...announcements.map((a) => ({
      path: `/company-announcements/${encodeURIComponent(a.slug)}`,
      lastmod: dateOnly(a.updated_at),
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
  ];

  const companyChunks = chunk(
    [...new Set(companies.map((c) => c.slug))].sort(),
    COMPANIES_PER_SITEMAP,
  );

  const outDir = resolve("public/sitemaps");
  if (existsSync(outDir)) {
    for (const f of readdirSync(outDir)) if (f.endsWith(".xml")) rmSync(resolve(outDir, f));
  } else {
    mkdirSync(outDir, { recursive: true });
  }

  const files: string[] = [];
  const write = (name: string, xml: string) => {
    writeFileSync(resolve(outDir, name), xml);
    files.push(`/sitemaps/${name}`);
  };

  write("static.xml", buildUrlset(staticEntries));
  write("articles.xml", buildUrlset(articleEntries));
  companyChunks.forEach((slugs, i) =>
    write(
      `companies-${i + 1}.xml`,
      buildUrlset(slugs.map((s) => ({ path: `/directory/company/${encodeURIComponent(s)}`, changefreq: "monthly", priority: "0.4" }))),
    ),
  );

  writeFileSync(resolve("public/sitemap.xml"), buildSitemapIndex(files));
  console.log(
    `sitemap written: ${staticEntries.length} pages, ${articleEntries.length} articles, ${companies.length} companies in ${files.length} files`,
  );
}

main().catch((err) => {
  console.warn(`sitemap not regenerated, keeping existing files: ${err instanceof Error ? err.message : err}`);
});
