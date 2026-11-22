import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { cyprusClock } from "../_shared/facebookPosting.ts";
import { itemLink, longMessage, MAX_AGE_DAYS, pickItem, postImage, shortMessage, slotAt, type PostItem, type PostRow } from "../_shared/compliancePosts.ts";
import { facebookPhotoPost, linkedinLinkPost, xPost } from "../_shared/socialPublish.ts";

// Two ComplianceHub regulatory updates a day (10:00 and 16:00 Cyprus time), one per slot, on every social account with posting on.
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function loadItems(sb: SupabaseClient, now: Date): Promise<PostItem[]> {
  const since = new Date(now.getTime() - (MAX_AGE_DAYS + 1) * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await sb.from("compliance_items")
    .select("id,slug,status,is_test,authority,title_en,official_title,summary_en,publication_date,deadline_date,topics")
    .eq("status", "published").eq("is_test", false).gte("publication_date", since)
    .order("publication_date", { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []) as PostItem[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let isAdmin = false;
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    isAdmin = caller.via === "admin";
  }
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const preview = body?.action === "preview";
  const force = body?.force === true && isAdmin;

  try {
    const now = new Date();
    const { data: hist, error: he } = await sb.from("social_compliance_posts").select("item_id,slot,platform,status,image_url,created_at")
      .gte("created_at", new Date(now.getTime() - 120 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(2000);
    if (he) throw he;
    const history = (hist ?? []) as PostRow[];
    // Admin "post now" uses its own slot so it never blocks a scheduled one.
    const slot = force ? `${cyprusClock(now).date}T${String(cyprusClock(now).hour).padStart(2, "0")}-manual` : slotAt(now);
    const slotRows = slot ? history.filter((h) => h.slot === slot) : [];
    const items = await loadItems(sb, now);

    // A partly finished slot keeps its update, so a retry fills in only the accounts still missing.
    const slotItemId = slotRows.find((r) => r.status === "posted")?.item_id;
    let pick: PostItem | null = slotItemId ? items.find((i) => i.id === slotItemId) ?? null : null;
    if (!pick) pick = pickItem(items, history, now);

    if (preview) {
      if (!isAdmin) return json({ error: "Admins only" }, 403);
      if (!pick) return json({ item: null, reason: `No new published regulatory update from the last ${MAX_AGE_DAYS} days` });
      return json({
        item: { id: pick.id, authority: pick.authority, title: pick.title_en, publication_date: pick.publication_date, link: itemLink(pick, "facebook") },
        image: postImage(history), messages: { facebook: longMessage(pick, "facebook"), linkedin: longMessage(pick, "linkedin"), x: shortMessage(pick) },
      });
    }
    if (!slot) return json({ posted: 0, reason: "Not a posting hour" });
    if (!force && slotRows.length) return json({ posted: 0, reason: "This slot already ran", slot });
    if (!pick) return json({ posted: 0, reason: "No new published regulatory update to post", slot });

    const [{ data: fb }, { data: lis }, { data: xs }] = await Promise.all([
      sb.from("facebook_autopost_settings").select("enabled,page_id").eq("id", true).maybeSingle(),
      sb.from("linkedin_autopost_settings").select("enabled,organization_urn").eq("id", true).maybeSingle(),
      sb.from("x_autopost_settings").select("enabled").eq("id", true).maybeSingle(),
    ]);
    const item = pick;
    const image = postImage(history);
    const done = new Set(history.filter((h) => h.item_id === item.id && h.status === "posted").map((h) => h.platform));
    const messages = { facebook: longMessage(item, "facebook"), linkedin: longMessage(item, "linkedin"), x: shortMessage(item) };
    const jobs: { platform: "facebook" | "linkedin" | "x"; run: () => Promise<string> }[] = [];
    if (fb?.enabled && fb.page_id && !done.has("facebook")) jobs.push({ platform: "facebook", run: () => facebookPhotoPost(fb.page_id, image, messages.facebook) });
    if (lis?.enabled && lis.organization_urn && !done.has("linkedin")) {
      jobs.push({ platform: "linkedin", run: () => linkedinLinkPost(lis.organization_urn, { text: messages.linkedin, link: itemLink(item, "linkedin"), title: item.title_en ?? item.official_title, imageUrl: image }) });
    }
    if (xs?.enabled && !done.has("x")) jobs.push({ platform: "x", run: () => xPost(messages.x) });
    if (!jobs.length) return json({ posted: 0, reason: done.size ? "This update is already on every account with posting on" : "No social account has posting switched on", slot });

    const results = [];
    for (const j of jobs) {
      try {
        const id = await j.run();
        await sb.from("social_compliance_posts").insert({ item_id: item.id, slot, platform: j.platform, post_id: id, message: messages[j.platform], image_url: image });
        results.push({ platform: j.platform, ok: true, id });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`compliance post to ${j.platform} failed:`, msg);
        await sb.from("social_compliance_posts").insert({ item_id: item.id, slot, platform: j.platform, status: "failed", error: msg.slice(0, 1000), message: messages[j.platform], image_url: image });
        results.push({ platform: j.platform, ok: false, error: msg });
      }
    }
    return json({ slot, item: item.id, posted: results.filter((r) => r.ok).length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("post-compliance-updates failed:", msg);
    return json({ error: msg }, 500);
  }
});
