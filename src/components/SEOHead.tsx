import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { ogImageFor } from "@/lib/ogImage";
import { canonicalUrl, SITE_NAME, SITE_URL } from "@/lib/seo";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface SEOHeadProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  /** Hub vertical — picks the branded share image when `image` is absent. */
  vertical?: string;
  type?: string;
  breadcrumbs?: BreadcrumbItem[];
  jsonLd?: Record<string, any>;
}

const BASE_URL = SITE_URL;

export function SEOHead({
  title,
  description = "Cyprus business intelligence platform — compliance, fintech, trade, and company directory.",
  path,
  image,
  vertical,
  type = "website",
  breadcrumbs,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const location = useLocation();
  // Self-referencing canonical: default to the current route when no path is given.
  const url = canonicalUrl(path ?? location.pathname);
  const ogImage = image || ogImageFor(vertical);

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
