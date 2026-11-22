// Generic publishers for posts that are not single stories (e.g. the daily data post).
// Same credentials and connection as post-to-facebook / post-to-linkedin / post-to-x.

const GRAPH_VERSION = "v21.0";
const FB_GATEWAY = "https://connector-gateway.lovable.dev/udc_facebook_pages";
const LI_VERSION = "202609";
const X_URL = "https://api.x.com/2/tweets";

// ---------- Facebook ----------
function fbGatewayHeaders(): Record<string, string> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const fbKey = Deno.env.get("UDC_FACEBOOK_PAGES_API_KEY");
  if (!lovableKey || !fbKey) throw new Error("Facebook connection is not set up");
  return { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": fbKey };
}

async function fbGet(path: string, query: Record<string, string> = {}) {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${FB_GATEWAY}/${GRAPH_VERSION}${path}${qs ? `?${qs}` : ""}`, { headers: fbGatewayHeaders() });
  const text = await res.text();
  if (!res.ok) throw new Error(`Facebook [${res.status}]: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

/** Page token for posting, or null when the connection's token is itself the page token. */
async function fbPageToken(pageId: string): Promise<string | null> {
  try {
    await fbGet("/me/accounts", { fields: "id", limit: "1" });
  } catch (e) {
    if (!String(e).includes("nonexisting field (accounts)")) throw e;
    const me = await fbGet("/me", { fields: "id,name" });
    if (me.id !== pageId) throw new Error(`The Facebook token belongs to "${me.name}", not the chosen page`);
    return null;
  }
  const r = await fbGet(`/${encodeURIComponent(pageId)}`, { fields: "access_token" });
  if (!r.access_token) throw new Error("This Facebook token cannot post to the chosen page");
  return r.access_token;
}

/** Photo post (picture uploaded as a file) with the caption; returns the post id. */
export async function facebookPhotoPost(pageId: string, imageUrl: string, caption: string): Promise<string> {
  const token = await fbPageToken(pageId);
  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error(`Image download failed [${img.status}]`);
  const type = img.headers.get("content-type") ?? "image/png";
  const form = new FormData();
  form.append("message", caption);
  form.append("source", new Blob([await img.arrayBuffer()], { type }), "data.png");
  if (token) form.append("access_token", token);
  const url = `${token ? "https://graph.facebook.com" : FB_GATEWAY}/${GRAPH_VERSION}/${encodeURIComponent(pageId)}/photos`;
  const res = await fetch(url, { method: "POST", headers: token ? {} : fbGatewayHeaders(), body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`Facebook [${res.status}]: ${text.slice(0, 500)}`);
  const r = JSON.parse(text);
  return (r.post_id ?? r.id) as string;
}

// ---------- LinkedIn ----------
function liToken(): string {
  const t = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  if (!t) throw new Error("LinkedIn token is not set up");
  return t;
}

async function li(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.linkedin.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${liToken()}`, "LinkedIn-Version": LI_VERSION, "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json", ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LinkedIn [${res.status}]: ${text.slice(0, 500)}`);
  return { res, body: text ? JSON.parse(text) : {} };
}

async function liUploadImage(owner: string, url: string): Promise<string | null> {
  try {
    const img = await fetch(url);
    if (!img.ok) return null;
    const bytes = new Uint8Array(await img.arrayBuffer());
    const { body } = await li("/rest/images?action=initializeUpload", { method: "POST", body: JSON.stringify({ initializeUploadRequest: { owner } }) });
    const up = await fetch(body.value.uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${liToken()}` }, body: bytes });
    return up.ok ? body.value.image as string : null;
  } catch { return null; }
}

/** Company-page post with a link card and the picture as its thumbnail; returns the post id. */
export async function linkedinLinkPost(org: string, o: { text: string; link: string; title: string; imageUrl: string }): Promise<string> {
  const thumb = await liUploadImage(org, o.imageUrl);
  const article: Record<string, unknown> = { source: o.link, title: o.title.slice(0, 200) };
  if (thumb) article.thumbnail = thumb;
  const { res } = await li("/rest/posts", {
    method: "POST",
    body: JSON.stringify({
      author: org,
      // LinkedIn's "little text" format treats these characters as markup.
      commentary: o.text.replace(/[(){}\[\]<>@|~_*#\\]/g, (c) => `\\${c}`),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { article }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false,
    }),
  });
  return res.headers.get("x-restli-id") ?? "";
}

// ---------- X ----------
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

async function xOauthHeader(method: string, url: string) {
  const k = ["TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN_SECRET"].map((n) => Deno.env.get(n));
  if (k.some((v) => !v)) throw new Error("X keys are not set up");
  const [ck, cs, at, ats] = k as string[];
  const p: Record<string, string> = {
    oauth_consumer_key: ck, oauth_nonce: crypto.randomUUID().replace(/-/g, ""), oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)), oauth_token: at, oauth_version: "1.0",
  };
  const params = Object.keys(p).sort().map((x) => `${enc(x)}=${enc(p[x])}`).join("&");
  const base = `${method}&${enc(url)}&${enc(params)}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${enc(cs)}&${enc(ats)}`), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  p.oauth_signature = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base)))));
  return "OAuth " + Object.keys(p).sort().map((x) => `${enc(x)}="${enc(p[x])}"`).join(", ");
}

export async function xPost(text: string): Promise<string> {
  const res = await fetch(X_URL, {
    method: "POST", headers: { Authorization: await xOauthHeader("POST", X_URL), "Content-Type": "application/json" }, body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`X [${res.status}]: ${body.slice(0, 500)}`);
  return JSON.parse(body)?.data?.id ?? "";
}
