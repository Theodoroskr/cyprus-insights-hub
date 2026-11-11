import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { canonicalUrl, readStaticPreview, SITE_DESCRIPTION, SITE_IMAGE, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";

// Captured once, before React touches the head: the served page's own preview tags
// (per-story files written at publish time) and the address they belong to.
const INITIAL_PATH = typeof window !== "undefined" ? canonicalUrl(window.location.pathname) : "";
const INITIAL_PREVIEW = typeof document !== "undefined" ? readStaticPreview(document) : null;

/**
 * Site-wide head defaults for every route. Pages that render <SEOHead> override
 * these; pages that don't still get a canonical/og:url pointing at themselves.
 * The matching tags in index.html carry data-rh so they are replaced, not duplicated.
 * On the first page loaded, the served page's own preview tags are kept instead of the
 * generic ones, so share robots that snapshot before the story loads still see the story.
 */
export function RouteSEODefaults() {
  const { pathname } = useLocation();
  const url = canonicalUrl(pathname);
  const own = INITIAL_PREVIEW && url === INITIAL_PATH ? INITIAL_PREVIEW : null;
  const title = own?.title ?? SITE_TITLE;
  const description = own?.description ?? SITE_DESCRIPTION;
  const image = own?.image ?? SITE_IMAGE;
  const ownImage = image.startsWith(`${SITE_URL}/images/og-`);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={own?.type ?? "website"} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />
      {ownImage && <meta property="og:image:width" content="1200" />}
      {ownImage && <meta property="og:image:height" content="630" />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
