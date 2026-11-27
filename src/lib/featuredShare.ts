/** Share links for a company named in a story, tagged so visits it brings in can be counted. */
export type SharePlatform = "linkedin" | "facebook" | "x" | "copy";

export function featuredStoryUrl(storyUrl: string, platform: SharePlatform, companySlug: string): string {
  const u = new URL(storyUrl);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_medium", "featured_company");
  u.searchParams.set("utm_campaign", companySlug || "company");
  return u.toString();
}

export function featuredShareHref(storyUrl: string, platform: Exclude<SharePlatform, "copy">, companySlug: string, title: string): string {
  const url = encodeURIComponent(featuredStoryUrl(storyUrl, platform, companySlug));
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${url}`;
}

/** Company slug from its profile link, e.g. /directory/company/acme-ltd → acme-ltd. */
export function slugFromHref(href: string | null): string {
  return href ? href.split("/").filter(Boolean).pop() ?? "" : "";
}
