import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BASE_URL = "https://businesshub.cy";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/directory", priority: "0.9", changefreq: "daily" },
  { path: "/fintech", priority: "0.8", changefreq: "weekly" },
  { path: "/compliance", priority: "0.8", changefreq: "weekly" },
  { path: "/regtech", priority: "0.8", changefreq: "weekly" },
  { path: "/sme", priority: "0.8", changefreq: "weekly" },
  { path: "/trade", priority: "0.7", changefreq: "weekly" },
  { path: "/resources", priority: "0.6", changefreq: "weekly" },
  { path: "/directory-home", priority: "0.7", changefreq: "weekly" },
  { path: "/whoiswho", priority: "0.6", changefreq: "weekly" },
  { path: "/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
  { path: "/cookies", priority: "0.2", changefreq: "yearly" },
];

const CITY_SLUGS = ["nicosia", "limassol", "larnaca", "paphos", "famagusta"];

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const headers = { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" };

  // Sitemap index
  if (type === "index") {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap.xml?type=static</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap.xml?type=articles</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap.xml?type=companies-1</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap.xml?type=companies-2</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap.xml?type=companies-3</loc></sitemap>
</sitemapindex>`;
    return new Response(xml, { headers });
  }

  // Static pages + cities
  if (type === "static") {
    const entries = STATIC_PAGES.map(
      (p) => `  <url><loc>${BASE_URL}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
    );
    CITY_SLUGS.forEach((slug) => {
      entries.push(`  <url><loc>${BASE_URL}/directory/city/${slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
    return new Response(xml, { headers });
  }

  // Articles
  if (type === "articles") {
    const { data: articles } = await supabase
      .from("cna_articles")
      .select("id, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000);

    const entries = (articles || []).map(
      (a) => `  <url><loc>${BASE_URL}/article/${a.id}</loc><lastmod>${a.published_at?.split("T")[0] || ""}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
    );
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
    return new Response(xml, { headers });
  }

  // Companies (paginated — 20K per sitemap, 3 sitemaps = 60K)
  if (type.startsWith("companies-")) {
    const page = parseInt(type.split("-")[1]) - 1;
    const PAGE_SIZE = 20000;
    const { data: companies } = await supabase
      .from("directory_companies")
      .select("slug")
      .order("company_name")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const entries = (companies || []).map(
      (c) => `  <url><loc>${BASE_URL}/directory/company/${escapeXml(c.slug)}</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`
    );
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
    return new Response(xml, { headers });
  }

  return new Response("Not found", { status: 404 });
});
