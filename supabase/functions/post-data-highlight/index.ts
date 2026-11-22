import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { cyprusClock } from "../_shared/facebookPosting.ts";
import {
  chooseTopic, cyprusBankingPost, cyprusEconomyPost, cyprusPropertyPost, cyprusTourismPost, dataLink, greecePulsePost,
  integrityPost, longMessage, rowsToday, shortMessage, type DataPost, type SeriesMap,
} from "../_shared/dataPosts.ts";
import { facebookPhotoPost, linkedinLinkPost, xPost } from "../_shared/socialPublish.ts";

// One post a day built from the latest official figures, on every social account that has posting switched on.
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Cyprus-time hour of the daily post; the schedule fires at 08:00 and 09:00 UTC so this hour is hit in summer and winter time. */
const POST_HOUR = 11;

const STAT_CODES = [
  "gdp_growth", "hicp_all", "unemployment", "gr_travellers", "gr_travel_receipts",
  "cbc_rate_mortgage", "cbc_rate_deposit", "cbc_hh_deposits", "cbc_hh_housing_loans",
];

async function loadPosts(sb: SupabaseClient): Promise<DataPost[]> {
  const since = new Date(Date.now() - 3 * 365 * 86400_000).toISOString().slice(0, 10);
  const { data: ds, error } = await sb.from("stat_datasets").select("id,code").in("code", STAT_CODES);
  if (error) throw error;
  const codeOf = new Map((ds ?? []).map((d) => [d.id, d.code as string]));
  const series: SeriesMap = {};
  for (let from = 0; ; from += 1000) {
    const { data, error: e } = await sb.from("stat_observations").select("dataset_id,geo,period,value")
      .in("dataset_id", [...codeOf.keys()]).eq("status", "published").gte("period_date", since)
      .order("period_date").range(from, from + 999);
    if (e) throw e;
    for (const r of data ?? []) (series[codeOf.get(r.dataset_id)!] ??= []).push({ geo: r.geo, period: r.period, value: Number(r.value) });
    if (!data || data.length < 1000) break;
  }

  const recent = new Date(Date.now() - 800 * 86400_000).toISOString().slice(0, 10);
  const { data: re } = await sb.from("re_sale_contracts").select("period_date,district_code,contract_count")
    .eq("status", "published").gte("period_date", recent).limit(5000);
  const { data: tour } = await sb.from("tourism_arrivals_monthly").select("period_date,arrivals")
    .eq("status", "published").eq("kind", "total").eq("country_code", "total").gte("period_date", recent).limit(1000);

  const { data: ed } = await sb.from("cpi_editions").select("edition_year,countries_covered,eu_avg")
    .eq("status", "published").order("edition_year", { ascending: false }).limit(1).maybeSingle();
  let cpi = null;
  if (ed) {
    const { data: res } = await sb.from("cpi_results").select("country_iso3,score,rank,rank_tied")
      .eq("edition_year", ed.edition_year).eq("status", "published").in("country_iso3", ["CYP", "GRC"]);
    cpi = {
      year: ed.edition_year, countries: ed.countries_covered, euAvg: ed.eu_avg === null ? null : Number(ed.eu_avg),
      results: (res ?? []).map((r) => ({ iso3: r.country_iso3, score: Number(r.score), rank: r.rank, tied: r.rank_tied })),
    };
  }

  return [
    greecePulsePost(series),
    cyprusEconomyPost(series),
    cyprusBankingPost(series),
    cyprusPropertyPost((re ?? []).filter((r) => r.contract_count !== null).map((r) => ({ period: String(r.period_date).slice(0, 7), district: r.district_code, count: Number(r.contract_count) }))),
    cyprusTourismPost((tour ?? []).filter((r) => r.arrivals !== null).map((r) => ({ period: String(r.period_date).slice(0, 7), arrivals: Number(r.arrivals) }))),
    integrityPost(cpi),
  ].filter(Boolean) as DataPost[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Managed daily schedule (Bearer cron secret), or an admin previewing / posting now.
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
    const { data: history } = await sb.from("social_data_posts").select("topic,fingerprint,platform,status,created_at")
      .gte("created_at", new Date(now.getTime() - 90 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(1000);
    const today = rowsToday(history ?? [], now);
    const postedToday = today.filter((r) => r.status === "posted");

    const posts = await loadPosts(sb);
    // A partly finished day keeps its topic, so a retry fills in the missing accounts with the same post.
    const asked = preview && typeof body?.topic === "string" ? posts.find((p) => p.topic === body.topic) : undefined;
    const pick = asked ?? (postedToday.length
      ? posts.find((p) => p.topic === postedToday[0].topic) ?? null
      : chooseTopic(posts, history ?? []));
    if (!pick) return json({ posted: 0, reason: "No figures available" });

    const messages = { facebook: longMessage(pick, "facebook"), linkedin: longMessage(pick, "linkedin"), x: shortMessage(pick) };
    if (preview) {
      if (!isAdmin) return json({ error: "Admins only" }, 403);
      return json({ topics: posts.map((p) => p.topic), topic: pick.topic, fingerprint: pick.fingerprint, image: pick.image, messages, postedToday: postedToday.map((r) => r.platform) });
    }
    if (!force && cyprusClock(now).hour !== POST_HOUR) return json({ posted: 0, reason: "Not posting hour" });
    if (today.length && !force) return json({ posted: 0, reason: "Already ran today", topic: pick.topic });

    const [{ data: fb }, { data: lis }, { data: xs }] = await Promise.all([
      sb.from("facebook_autopost_settings").select("enabled,page_id").eq("id", true).maybeSingle(),
      sb.from("linkedin_autopost_settings").select("enabled,organization_urn").eq("id", true).maybeSingle(),
      sb.from("x_autopost_settings").select("enabled").eq("id", true).maybeSingle(),
    ]);
    const done = new Set(postedToday.map((r) => r.platform));
    const jobs: { platform: "facebook" | "linkedin" | "x"; run: () => Promise<string> }[] = [];
    if (fb?.enabled && fb.page_id && !done.has("facebook")) jobs.push({ platform: "facebook", run: () => facebookPhotoPost(fb.page_id, pick.image, messages.facebook) });
    if (lis?.enabled && lis.organization_urn && !done.has("linkedin")) {
      jobs.push({ platform: "linkedin", run: () => linkedinLinkPost(lis.organization_urn, { text: messages.linkedin, link: dataLink(pick, "linkedin"), title: pick.headline, imageUrl: pick.image }) });
    }
    if (xs?.enabled && !done.has("x")) jobs.push({ platform: "x", run: () => xPost(messages.x) });

    const results = [];
    for (const j of jobs) {
      try {
        const id = await j.run();
        await sb.from("social_data_posts").insert({ topic: pick.topic, fingerprint: pick.fingerprint, platform: j.platform, post_id: id, message: messages[j.platform] });
        results.push({ platform: j.platform, ok: true, id });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`data post to ${j.platform} failed:`, msg);
        await sb.from("social_data_posts").insert({ topic: pick.topic, fingerprint: pick.fingerprint, platform: j.platform, status: "failed", error: msg.slice(0, 1000), message: messages[j.platform] });
        results.push({ platform: j.platform, ok: false, error: msg });
      }
    }
    return json({ topic: pick.topic, posted: results.filter((r) => r.ok).length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("post-data-highlight failed:", msg);
    return json({ error: msg }, 500);
  }
});
