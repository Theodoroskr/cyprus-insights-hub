import { Helmet } from "react-helmet-async";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface SEOHeadProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  breadcrumbs?: BreadcrumbItem[];
  jsonLd?: Record<string, any>;
}

const SITE_NAME = "BusinessHub.cy";
const BASE_URL = "https://businesshub.cy";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export function SEOHead({
  title,
  description = "Cyprus business intelligence platform — compliance, fintech, trade, and company directory.",
  path = "",
  image,
  type = "website",
  breadcrumbs,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  const breadcrumbJsonLd = breadcrumbs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${BASE_URL}${item.href}`,
        })),
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Breadcrumb JSON-LD */}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}

      {/* Additional JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
