import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import {
  INDEXNOW_ENDPOINT, LOOKBACK_HOURS, buildIndexNowPayload, isAccepted, pageUrl, urlsToSubmit,
  type PageCandidate,
} from "../_shared/indexNow.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Managed schedule (Bearer cron secret) or an admin pressing "run now".
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
  }

  try {
    const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000).toISOString();
    const [arts, dirArts, res] = await Promise.all([
      sb.from("cna_articles").select("id").eq("status", "published").gte("published_at", since).order("published_at", { ascending: false }).limit(1000),
      sb.from("directory_articles").select("slug, article_type").eq("is_published", true).gte("updated_at", since).limit(200),
      sb.from("resources").select("slug").eq("is_published", true).gte("updated_at", since).limit(200),
    ]);
    if (arts.error) throw new Error(`cna_articles: ${arts.error.message}`);

    const candidates: PageCandidate[] = [
      ...(arts.data ?? []).map((a) => ({ kind: "article" as const, idOrSlug: a.id })),
      ...(dirArts.data ?? []).filter((d) => d.slug).map((d) => ({ kind: d.article_type === "interview" ? "interview" as const : "news" as const, idOrSlug: d.slug })),
      ...(res.data ?? []).filter((r) => r.slug).map((r) => ({ kind: "resource" as const, idOrSlug: r.slug })),
    ];
    const urls = candidates.map(pageUrl);
    if (urls.length === 0) return json({ submitted: 0, reason: "no new pages" });

    const { data: done, error: doneErr } = await sb.from("indexnow_submissions").select("url").in("url", urls);
    if (doneErr) throw new Error(`indexnow_submissions: ${doneErr.message}`);
    const batch = urlsToSubmit(urls, new Set((done ?? []).map((d) => d.url)));
    if (batch.length === 0) return json({ submitted: 0, reason: "all already submitted" });

    const resp = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(buildIndexNowPayload(batch)),
    });
    const body = await resp.text();
    if (!isAccepted(resp.status)) {
      console.error(`IndexNow rejected [${resp.status}]: ${body.slice(0, 500)}`);
      return json({ submitted: 0, status: resp.status, details: body.slice(0, 500) }, 502);
    }

    const now = new Date().toISOString();
    const { error: insErr } = await sb.from("indexnow_submissions")
      .upsert(batch.map((url) => ({ url, submitted_at: now, status_code: resp.status })), { onConflict: "url" });
    if (insErr) throw new Error(`record submissions: ${insErr.message}`);

    return json({ submitted: batch.length, status: resp.status });
  } catch (e) {
    console.error("ping-indexnow failed:", e);
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
