import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import {
  articleLink, countPostedToday, cyprusClock, pickArticles, postsThisRun, LAST_POST_HOUR, type CandidateArticle,
} from "../_shared/facebookPosting.ts";

// Posts new stories to the BusinessHub X account: same hours, daily cap and duplicate rules as Facebook/LinkedIn.
const FIRST_POST_HOUR = 8;
const X_URL = "https://api.x.com/2/tweets";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

function creds() {
  const k = ["TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN_SECRET"].map((n) => Deno.env.get(n));
  if (k.some((v) => !v)) throw new Error("X keys are not set up");
  return { ck: k[0]!, cs: k[1]!, at: k[2]!, ats: k[3]! };
}

/** OAuth 1.0a header; the JSON body is not part of the signature. */
async function oauthHeader(method: string, url: string) {
  const { ck, cs, at, ats } = creds();
  const p: Record<string, string> = {
    oauth_consumer_key: ck, oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1", oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: at, oauth_version: "1.0",
  };
  const params = Object.keys(p).sort().map((k) => `${enc(k)}=${enc(p[k])}`).join("&");
  const base = `${method}&${enc(url)}&${enc(params)}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${enc(cs)}&${enc(ats)}`), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base)))));
  p.oauth_signature = sig;
  return "OAuth " + Object.keys(p).sort().map((k) => `${enc(k)}="${enc(p[k])}"`).join(", ");
}

/** Headline + link, kept under 280 characters (links count as 23). */
export function buildTweet(a: CandidateArticle): string {
  const title = (a.title ?? "").trim();
  const room = 280 - 23 - 2;
  const t = title.length > room ? title.slice(0, room - 1).trimEnd() + "…" : title;
  return `${t}\n\n${articleLink(a.id)}`;
}

async function tweet(text: string): Promise<string> {
  const res = await fetch(X_URL, {
    method: "POST",
    headers: { Authorization: await oauthHeader("POST", X_URL), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`X [${res.status}]: ${body.slice(0, 500)}`);
  return JSON.parse(body)?.data?.id ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Managed hourly schedule (Bearer cron secret), or an admin pressing "post now".
  let isAdmin = false;
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    isAdmin = caller.via === "admin";
  }
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const force = body?.force === true && isAdmin;

  try {
    const { data: s } = await sb.from("x_autopost_settings").select("*").eq("id", true).maybeSingle();
    if (!s?.enabled && !force) return json({ skipped: "X posting is off" });
    const now = new Date();
    const { hour } = cyprusClock(now);
    if (!force && (hour < FIRST_POST_HOUR || hour > LAST_POST_HOUR)) return json({ skipped: "Outside posting hours" });

    const { data: recent } = await sb.from("x_posts").select("created_at").eq("status", "posted")
      .gte("created_at", new Date(now.getTime() - 30 * 3600_000).toISOString());
    const postedToday = countPostedToday((recent ?? []).map((r) => r.created_at), now);
    const limit = s?.daily_limit ?? 15;
    const quota = force ? Math.min(Math.max(0, limit - postedToday), 1) : Math.min(2, postsThisRun(limit, postedToday, now));
    if (quota === 0) {
      await sb.from("x_autopost_settings").update({ last_run_at: now.toISOString() }).eq("id", true);
      return json({ posted: 0, postedToday, reason: "Daily limit reached" });
    }

    const { data: cands, error } = await sb.from("cna_articles")
      .select("id,title,summary,what_happened,vertical,source_id,published_at,image_url")
      .eq("status", "published")
      .gte("published_at", new Date(now.getTime() - 36 * 3600_000).toISOString())
      .lte("published_at", now.toISOString())
      .order("published_at", { ascending: false }).limit(200);
    if (error) throw error;

    // Every article ever attempted (posted or failed) is skipped; headlines from the last 30 days block re-posts from other sources.
    const { data: postedRows } = await sb.from("x_posts").select("article_id")
      .gte("created_at", new Date(now.getTime() - 30 * 86400_000).toISOString()).limit(1000);
    const postedIds = [...new Set((postedRows ?? []).map((r) => r.article_id))];
    const { data: postedArts } = postedIds.length ? await sb.from("cna_articles").select("title").in("id", postedIds) : { data: [] };
    const postedTitles = (postedArts ?? []).map((r) => r.title).filter(Boolean) as string[];
    const ids = (cands ?? []).map((c) => c.id);
    const { data: done } = ids.length ? await sb.from("x_posts").select("article_id").in("article_id", ids) : { data: [] };
    const picks = pickArticles((cands ?? []) as CandidateArticle[], new Set((done ?? []).map((d) => d.article_id)), quota, postedTitles);
    if (!picks.length) {
      await sb.from("x_autopost_settings").update({ last_run_at: now.toISOString(), last_error: null }).eq("id", true);
      return json({ posted: 0, reason: "No new stories" });
    }

    const results = [];
    let lastError: string | null = null;
    for (const a of picks) {
      try {
        const id = await tweet(buildTweet(a));
        await sb.from("x_posts").insert({ article_id: a.id, tweet_id: id });
        results.push({ id: a.id, ok: true, tweet: id });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        await sb.from("x_posts").insert({ article_id: a.id, status: "failed", error: lastError.slice(0, 1000) });
        results.push({ id: a.id, ok: false, error: lastError });
        if (/\[(401|403|429)\]/.test(lastError)) break; // stop on auth/rate-limit errors
      }
    }
    await sb.from("x_autopost_settings").update({ last_run_at: now.toISOString(), last_error: lastError }).eq("id", true);
    return json({ posted: results.filter((r) => r.ok).length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb.from("x_autopost_settings").update({ last_run_at: new Date().toISOString(), last_error: msg.slice(0, 1000) }).eq("id", true);
    console.error("post-to-x failed:", msg);
    return json({ error: msg }, 500);
  }
});
