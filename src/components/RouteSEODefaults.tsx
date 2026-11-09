import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { canonicalUrl, SITE_DESCRIPTION, SITE_IMAGE, SITE_NAME, SITE_TITLE } from "@/lib/seo";

/**
 * Site-wide head defaults for every route. Pages that render <SEOHead> override
 * these; pages that don't still get a canonical/og:url pointing at themselves.
 * The matching tags in index.html carry data-rh so they are replaced, not duplicated.
 */
export function RouteSEODefaults() {
  const { pathname } = useLocation();
  const url = canonicalUrl(pathname);
  return (
    <Helmet>
      <title>{SITE_TITLE}</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={SITE_TITLE} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={SITE_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SITE_TITLE} />
      <meta name="twitter:description" content={SITE_DESCRIPTION} />
      <meta name="twitter:image" content={SITE_IMAGE} />
    </Helmet>
  );
}
