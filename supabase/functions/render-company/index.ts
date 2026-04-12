import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BASE_URL = "https://businesshub.cy";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function renderCompanyHtml(c: any): string {
  const title = `${escapeHtml(c.company_name)} — Cyprus Company Profile | BusinessHub.cy`;
  const description = escapeHtml(
    `${c.company_name}${c.city ? ` in ${c.city}` : ""} — ${c.activity_description || "Registered company in Cyprus"}. Registration, NACE code, and business details.`
  );
  const url = `${BASE_URL}/directory/company/${c.slug}`;
  const ogImage = `${BASE_URL}/og-default.png`;

  const cityLabel = c.city || "";
  const citySlug = c.city_slug || "";

  // Breadcrumb JSON-LD
  const breadcrumbs = [
    { name: "Home", item: BASE_URL },
    { name: "Directory", item: `${BASE_URL}/directory` },
  ];
  if (citySlug && cityLabel) {
    breadcrumbs.push({ name: cityLabel, item: `${BASE_URL}/directory/city/${citySlug}` });
  }
  breadcrumbs.push({ name: c.company_name, item: url });

  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  });

  const orgLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: c.company_name,
    url,
    ...(c.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: c.address,
        ...(c.city && { addressLocality: c.city }),
        addressCountry: "CY",
      },
    }),
    ...(c.registration_no && { taxID: c.registration_no }),
    ...(c.activity_description && { description: c.activity_description }),
    ...(c.registration_date && { foundingDate: c.registration_date }),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="BusinessHub.cy">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <script type="application/ld+json">${breadcrumbLd}</script>
  <script type="application/ld+json">${orgLd}</script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8f9fa; color: #1a1a2e; }
    .container { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    nav.breadcrumb { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    nav.breadcrumb a { color: #c9a84c; text-decoration: none; }
    nav.breadcrumb a:hover { text-decoration: underline; }
    h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-dissolved { background: #fee2e2; color: #991b1b; }
    .badge-type { background: #f3f4f6; color: #374151; margin-left: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .info-card { padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600; }
    .info-value { margin-top: 4px; font-size: 15px; }
    footer { text-align: center; padding: 32px 16px; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 40px; }
    footer a { color: #c9a84c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> › <a href="/directory">Directory</a>${
        citySlug && cityLabel
          ? ` › <a href="/directory/city/${escapeHtml(citySlug)}">${escapeHtml(cityLabel)}</a>`
          : ""
      } › ${escapeHtml(c.company_name)}
    </nav>

    <h1>${escapeHtml(c.company_name)}</h1>
    <div style="margin-bottom: 16px;">
      <span class="badge ${c.organisation_status === "Active" ? "badge-active" : "badge-dissolved"}">${escapeHtml(c.organisation_status || "Unknown")}</span>
      ${c.organisation_type ? `<span class="badge badge-type">${escapeHtml(c.organisation_type)}</span>` : ""}
      ${c.organisation_sub_type ? `<span class="badge badge-type">${escapeHtml(c.organisation_sub_type)}</span>` : ""}
    </div>

    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">City</div>
        <div class="info-value">${escapeHtml(c.city || "—")}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Activity</div>
        <div class="info-value">${escapeHtml(c.activity_description || "—")}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Organisation Type</div>
        <div class="info-value">${escapeHtml(c.organisation_type || "—")}</div>
      </div>
      ${c.nace_code ? `<div class="info-card"><div class="info-label">NACE Code</div><div class="info-value">${escapeHtml(c.nace_code)}</div></div>` : ""}
      ${c.registration_date ? `<div class="info-card"><div class="info-label">Registration Date</div><div class="info-value">${escapeHtml(c.registration_date)}</div></div>` : ""}
      ${c.address ? `<div class="info-card" style="grid-column: span 2;"><div class="info-label">Address</div><div class="info-value">${escapeHtml(c.address)}</div></div>` : ""}
    </div>
  </div>

  <footer>
    <p>© ${new Date().getFullYear()} <a href="${BASE_URL}">BusinessHub.cy</a> — Cyprus Business Intelligence Platform</p>
    <p><a href="/directory">Browse all companies</a> · <a href="/directory-home">Business Directory</a></p>
  </footer>
</body>
</html>`;
}

function renderIndexHtml(companies: any[]): string {
  const rows = companies
    .map(
      (c) =>
        `<tr><td><a href="/directory/company/${escapeHtml(c.slug)}">${escapeHtml(c.company_name)}</a></td><td>${escapeHtml(c.city || "—")}</td><td>${escapeHtml(c.organisation_status || "—")}</td></tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Top 1000 Companies — BusinessHub.cy</title>
  <meta name="description" content="Browse the top 1,000 priority companies in Cyprus from the BusinessHub.cy company registry.">
  <link rel="canonical" href="${BASE_URL}/directory">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #f8f9fa; color: #1a1a2e; }
    h1 { font-size: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { background: #1a1a2e; color: #fff; }
    a { color: #c9a84c; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Top 1,000 Companies in Cyprus</h1>
  <p>Priority index of the most established active companies in the <a href="${BASE_URL}/directory">BusinessHub.cy directory</a>.</p>
  <table>
    <thead><tr><th>Company</th><th>City</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const slug = url.searchParams.get("slug");
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
  };

  // Single company render
  if (slug) {
    const { data: company, error } = await supabase
      .from("directory_companies")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !company) {
      return new Response("<html><body><h1>Company not found</h1></body></html>", {
        status: 404,
        headers,
      });
    }

    return new Response(renderCompanyHtml(company), { headers });
  }

  // Index page — top 1000 active companies by registration date (oldest = most established)
  const { data: companies } = await supabase
    .from("directory_companies")
    .select("slug, company_name, city, organisation_status")
    .eq("organisation_status", "Active")
    .order("registration_date", { ascending: true })
    .limit(1000);

  return new Response(renderIndexHtml(companies || []), { headers });
});
