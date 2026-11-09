/**
 * IndexNow: tells Bing (and other IndexNow engines — Yandex, Seznam, Naver) about new pages
 * the moment they exist, instead of waiting for the next publish to refresh the sitemap.
 * Google does not use IndexNow; it finds new stories through the sitemap and site links.
 * The key is public by design and must also be served at KEY_LOCATION on the site.
 */
export const SITE_HOST = "businesshub.cy";
export const SITE_ORIGIN = `https://${SITE_HOST}`;
export const INDEXNOW_KEY = "9c4ebd5f970033eecf01b2ee3b75e90e";
export const KEY_LOCATION = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow accepts up to 10,000 URLs per request; keep batches small and steady. */
export const MAX_URLS_PER_RUN = 500;
/** How far back to look for new pages each run. */
export const LOOKBACK_HOURS = 72;

export interface PageCandidate {
  kind: "article" | "news" | "interview" | "resource";
  idOrSlug: string;
}

export function pageUrl(p: PageCandidate): string {
  const seg = encodeURIComponent(p.idOrSlug);
  switch (p.kind) {
    case "article": return `${SITE_ORIGIN}/article/${seg}`;
    case "news": return `${SITE_ORIGIN}/news/${seg}`;
    case "interview": return `${SITE_ORIGIN}/interviews/${seg}`;
    case "resource": return `${SITE_ORIGIN}/resources/${seg}`;
  }
}

/** URLs not yet submitted, de-duplicated, capped to one run's batch. */
export function urlsToSubmit(candidates: string[], alreadySubmitted: Set<string>, max = MAX_URLS_PER_RUN): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of candidates) {
    if (!u.startsWith(`${SITE_ORIGIN}/`) || seen.has(u) || alreadySubmitted.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= max) break;
  }
  return out;
}

export function buildIndexNowPayload(urlList: string[]) {
  return { host: SITE_HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList };
}

/** 200 = accepted, 202 = accepted, key validation pending. Anything else is retried next run. */
export function isAccepted(status: number): boolean {
  return status === 200 || status === 202;
}
