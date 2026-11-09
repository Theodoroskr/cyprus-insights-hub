import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import {
  articleLink, buildPostMessage, countPostedToday, cyprusClock, pickArticles, postsThisRun, LAST_POST_HOUR,
  type CandidateArticle,
} from "../_shared/facebookPosting.ts";

const GRAPH_VERSION = "v21.0";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_facebook_pages";
const FIRST_POST_HOUR = 7;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Read-only Graph call through the connection (uses the stored token). */
async function graphViaGateway(path: string, query: Record<string, string> = {}) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const fbKey = Deno.env.get("UDC_FACEBOOK_PAGES_API_KEY");
  if (!lovableKey || !fbKey) throw new Error("Facebook connection is not set up");
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${GATEWAY_URL}/${GRAPH_VERSION}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": fbKey },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Facebook [${res.status}]: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function listPages(): Promise<{ id: string; name: string; canPost: boolean }[]> {
  const out: { id: string; name: string; canPost: boolean }[] = [];
  let after: string | undefined;
  for (let i = 0; i < 5; i++) {
    const q: Record<string, string> = { fields: "id,name,tasks", limit: "100" };
    if (after) q.after = after;
    const r = await graphViaGateway("/me/accounts", q);
    for (const p of r.data ?? []) out.push({ id: p.id, name: p.name, canPost: (p.tasks ?? []).includes("CREATE_CONTENT") });
    after = r.paging?.next ? r.paging?.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}

async function pageToken(pageId: string): Promise<string> {
  const r = await graphViaGateway(`/${encodeURIComponent(pageId)}`, { fields: "access_token" });
  if (!r.access_token) throw new Error("This Facebook token cannot post to the chosen page");
  return r.access_token;
}

async function publish(pageId: string, token: string, message: string, link: string): Promise<string> {
  const body = new URLSearchParams({ message, link, access_token: token });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pageId)}/feed`, { method: "POST", body });
  const text = await res.text();
  if (!res.ok) throw new Error(`Facebook [${res.status}]: ${text.slice(0, 500)}`);
  return JSON.parse(text).id as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);

  let action = "run";
  let force = false;
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (typeof body?.action === "string" && ["run", "list_pages"].includes(body.action)) action = body.action;
    // "Post now" from the dashboard may run outside posting hours, but still respects the daily limit.
    force = body?.force === true && caller.via === "admin";
  } catch { /* defaults */ }

  try {
    if (action === "list_pages") return json({ pages: await listPages() });

    const { data: settings } = await sb.from("facebook_autopost_settings").select("*").eq("id", true).maybeSingle();
    if (!settings?.enabled || !settings.page_id) return json({ skipped: "Automatic posting is switched off or no page is chosen" });

    const now = new Date();
    const { hour } = cyprusClock(now);
    if (!force && (hour < FIRST_POST_HOUR || hour > LAST_POST_HOUR)) return json({ skipped: "Outside posting hours" });

    const since = new Date(now.getTime() - 30 * 3600_000).toISOString();
    const { data: recent } = await sb.from("facebook_posts").select("created_at")
      .eq("page_id", settings.page_id).eq("status", "posted").gte("created_at", since);
    const postedToday = countPostedToday((recent ?? []).map((r) => r.created_at), now);
    const quota = force
      ? Math.min(Math.max(0, settings.daily_limit - postedToday), 3)
      : postsThisRun(settings.daily_limit, postedToday, now);
    if (quota === 0) {
      await sb.from("facebook_autopost_settings").update({ last_run_at: now.toISOString() }).eq("id", true);
      return json({ posted: 0, postedToday, reason: "Daily limit reached" });
    }

    const { data: candidates, error } = await sb.from("cna_articles")
      .select("id,title,summary,what_happened,vertical,source_id,published_at")
      .eq("status", "published")
      .gte("published_at", new Date(now.getTime() - 36 * 3600_000).toISOString())
      .lte("published_at", now.toISOString())
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const ids = (candidates ?? []).map((c) => c.id);
    const { data: done } = ids.length
      ? await sb.from("facebook_posts").select("article_id").eq("page_id", settings.page_id).in("article_id", ids)
      : { data: [] };
    const picks = pickArticles((candidates ?? []) as CandidateArticle[], new Set((done ?? []).map((d) => d.article_id)), quota);
    if (!picks.length) {
      await sb.from("facebook_autopost_settings").update({ last_run_at: now.toISOString(), last_error: null }).eq("id", true);
      return json({ posted: 0, postedToday, reason: "No new stories" });
    }

    const token = await pageToken(settings.page_id);
    const results = [];
    let lastError: string | null = null;
    for (const a of picks) {
      try {
        const fbId = await publish(settings.page_id, token, buildPostMessage(a), articleLink(a.id));
        await sb.from("facebook_posts").insert({ article_id: a.id, page_id: settings.page_id, fb_post_id: fbId, status: "posted" });
        results.push({ id: a.id, ok: true });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        await sb.from("facebook_posts").insert({ article_id: a.id, page_id: settings.page_id, status: "failed", error: lastError.slice(0, 1000) });
        results.push({ id: a.id, ok: false, error: lastError });
      }
    }
    await sb.from("facebook_autopost_settings").update({ last_run_at: now.toISOString(), last_error: lastError }).eq("id", true);
    return json({ posted: results.filter((r) => r.ok).length, postedToday, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const { data: prev } = await sb.from("facebook_autopost_settings").select("last_error").eq("id", true).maybeSingle();
    await sb.from("facebook_autopost_settings").update({ last_run_at: new Date().toISOString(), last_error: msg.slice(0, 1000) }).eq("id", true);
    // Alert admins once when posting starts failing (e.g. the token expired).
    if (action === "run" && !prev?.last_error) {
      const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
      const rows = (admins ?? []).map((a) => ({
        user_id: a.user_id, type: "facebook_autopost", title: "Facebook auto-posting stopped",
        body: "Posting to the Facebook page failed. The token may have expired.", href: "/editorial?tab=facebook",
      }));
      if (rows.length) await sb.from("notifications").insert(rows);
    }
    console.error("post-to-facebook failed:", msg);
    return json({ error: msg }, 500);
  }
});
