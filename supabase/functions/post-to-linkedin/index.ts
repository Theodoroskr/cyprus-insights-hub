import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import {
  articleLink, buildPostMessage, countPostedToday, cyprusClock, hubImage, libraryImageFor, pickArticles, postImageFor,
  postsThisRun, LAST_POST_HOUR, type CandidateArticle,
} from "../_shared/facebookPosting.ts";

const LI_VERSION = "202609";
const FIRST_POST_HOUR = 8;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function token(): string {
  const t = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  if (!t) throw new Error("LinkedIn token is not set up");
  return t;
}

async function li(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.linkedin.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "LinkedIn-Version": LI_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LinkedIn [${res.status}]: ${text.slice(0, 500)}`);
  return { res, body: text ? JSON.parse(text) : {} };
}

/** Company pages this token can post for. */
async function listOrgs() {
  const { body } = await li("/rest/organizationAcls?q=roleAssignee&state=APPROVED&count=50");
  const out: { urn: string; name: string; role: string }[] = [];
  for (const e of body.elements ?? []) {
    const urn = e.organization as string;
    const id = urn.split(":").pop();
    let name = urn;
    try { name = (await li(`/rest/organizations/${id}`)).body.localizedName ?? urn; } catch { /* keep urn */ }
    out.push({ urn, name, role: e.role });
  }
  return out;
}

/** Upload a picture to LinkedIn; returns the image URN or null. */
async function uploadImage(owner: string, url: string): Promise<string | null> {
  try {
    const img = await fetch(url);
    if (!img.ok) return null;
    const bytes = new Uint8Array(await img.arrayBuffer());
    const { body } = await li("/rest/images?action=initializeUpload", {
      method: "POST", body: JSON.stringify({ initializeUploadRequest: { owner } }),
    });
    const up = await fetch(body.value.uploadUrl, {
      method: "PUT", headers: { Authorization: `Bearer ${token()}` }, body: bytes,
    });
    if (!up.ok) return null;
    return body.value.image as string;
  } catch { return null; }
}

async function publish(org: string, a: CandidateArticle, recentlyUsed: string[]) {
  const candidates = [...new Set([postImageFor(a, recentlyUsed), libraryImageFor(a.vertical, recentlyUsed), hubImage(a.vertical)])];
  let imageUrn: string | null = null, imageUrl: string | null = null;
  for (const c of candidates) {
    imageUrn = await uploadImage(org, c);
    if (imageUrn) { imageUrl = c; break; }
  }
  const article: Record<string, unknown> = {
    source: articleLink(a.id),
    title: (a.title ?? "").slice(0, 200),
  };
  if (imageUrn) article.thumbnail = imageUrn;
  const { res } = await li("/rest/posts", {
    method: "POST",
    body: JSON.stringify({
      author: org,
      commentary: buildPostMessage(a).replace(/[(){}\[\]<>@|~_*#\\]/g, (c) => `\\${c}`),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { article },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  return { id: res.headers.get("x-restli-id") ?? "", image: imageUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);

  let action = "run", force = false;
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (typeof body?.action === "string" && ["run", "list_orgs"].includes(body.action)) action = body.action;
    force = body?.force === true && caller.via === "admin";
  } catch { /* defaults */ }

  try {
    if (action === "list_orgs") return json({ organizations: await listOrgs() });

    const { data: s } = await sb.from("linkedin_autopost_settings").select("*").eq("id", true).maybeSingle();
    if (!s?.enabled || !s.organization_urn) return json({ skipped: "LinkedIn posting is off or no company page chosen" });
    const now = new Date();
    const { hour } = cyprusClock(now);
    if (!force && (hour < FIRST_POST_HOUR || hour > LAST_POST_HOUR)) return json({ skipped: "Outside posting hours" });

    const { data: recent } = await sb.from("linkedin_posts").select("created_at")
      .eq("organization_urn", s.organization_urn).eq("status", "posted")
      .gte("created_at", new Date(now.getTime() - 30 * 3600_000).toISOString());
    const postedToday = countPostedToday((recent ?? []).map((r) => r.created_at), now);
    const quota = force ? Math.min(Math.max(0, s.daily_limit - postedToday), 1) : Math.min(1, postsThisRun(s.daily_limit, postedToday, now));
    if (quota === 0) {
      await sb.from("linkedin_autopost_settings").update({ last_run_at: now.toISOString() }).eq("id", true);
      return json({ posted: 0, postedToday, reason: "Daily limit reached" });
    }

    const { data: cands, error } = await sb.from("cna_articles")
      .select("id,title,summary,what_happened,vertical,source_id,published_at,image_url")
      .eq("status", "published")
      .gte("published_at", new Date(now.getTime() - 36 * 3600_000).toISOString())
      .lte("published_at", now.toISOString())
      .order("published_at", { ascending: false }).limit(200);
    if (error) throw error;
    const ids = (cands ?? []).map((c) => c.id);
    const { data: done } = ids.length
      ? await sb.from("linkedin_posts").select("article_id").eq("organization_urn", s.organization_urn).in("article_id", ids)
      : { data: [] };
    const picks = pickArticles((cands ?? []) as CandidateArticle[], new Set((done ?? []).map((d) => d.article_id)), quota);
    if (!picks.length) {
      await sb.from("linkedin_autopost_settings").update({ last_run_at: now.toISOString(), last_error: null }).eq("id", true);
      return json({ posted: 0, reason: "No new stories" });
    }
    const { data: used } = await sb.from("linkedin_posts").select("image_url").eq("status", "posted")
      .not("image_url", "is", null).order("created_at", { ascending: false }).limit(60);
    const recentlyUsed = (used ?? []).map((r) => r.image_url as string);

    const results = [];
    let lastError: string | null = null;
    for (const a of picks) {
      try {
        const r = await publish(s.organization_urn, a, recentlyUsed);
        await sb.from("linkedin_posts").insert({ article_id: a.id, organization_urn: s.organization_urn, li_post_id: r.id, image_url: r.image });
        results.push({ id: a.id, ok: true, post: r.id });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        await sb.from("linkedin_posts").insert({ article_id: a.id, organization_urn: s.organization_urn, status: "failed", error: lastError.slice(0, 1000) });
        results.push({ id: a.id, ok: false, error: lastError });
      }
    }
    await sb.from("linkedin_autopost_settings").update({ last_run_at: now.toISOString(), last_error: lastError }).eq("id", true);
    return json({ posted: results.filter((r) => r.ok).length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb.from("linkedin_autopost_settings").update({ last_run_at: new Date().toISOString(), last_error: msg.slice(0, 1000) }).eq("id", true);
    console.error("post-to-linkedin failed:", msg);
    return json({ error: msg }, 500);
  }
});
