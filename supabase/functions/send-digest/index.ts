import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional frequency filter from request body
    let targetFrequency = "weekly";
    try {
      const body = await req.json();
      if (body?.frequency) targetFrequency = body.frequency;
    } catch {
      // No body or invalid JSON — use default
    }

    // 1. Get all users with matching digest frequency
    const { data: preferences, error: prefsError } = await supabase
      .from("user_preferences")
      .select("user_id, verticals, digest_frequency")
      .eq("digest_frequency", targetFrequency);

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
      throw new Error(prefsError.message);
    }

    if (!preferences || preferences.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users subscribed to " + targetFrequency + " digest", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get recent published articles (last 7 days for weekly, last 1 day for daily)
    const daysBack = targetFrequency === "daily" ? 1 : 7;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const { data: articles, error: articlesError } = await supabase
      .from("cna_articles")
      .select("id, title, vertical, summary, what_happened, why_it_matters, what_to_do, published_at, source_url, tags")
      .eq("status", "published")
      .gte("published_at", since.toISOString())
      .order("published_at", { ascending: false })
      .limit(50);

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
      throw new Error(articlesError.message);
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new articles to digest", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. For each user, filter articles by their selected verticals and create notification
    const results = [];

    for (const pref of preferences) {
      const userVerticals = pref.verticals && pref.verticals.length > 0
        ? pref.verticals
        : ["compliance", "fintech", "sme", "general"]; // All verticals if none selected

      const userArticles = articles.filter(
        (a: any) => userVerticals.includes(a.vertical)
      );

      if (userArticles.length === 0) {
        results.push({ user_id: pref.user_id, skipped: true, reason: "no matching articles" });
        continue;
      }

      // Build digest summary
      const topArticles = userArticles.slice(0, 5);
      const digestTitle = targetFrequency === "daily"
        ? `Daily Intelligence Briefing — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
        : `Weekly Intelligence Briefing — Week of ${since.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

      const digestBody = topArticles
        .map((a: any, i: number) => {
          const verticalLabel: Record<string, string> = {
            compliance: "🛡️ Compliance",
            fintech: "💳 FinTech",
            sme: "🏢 SME",
            general: "📰 General",
          };
          return `${i + 1}. [${verticalLabel[a.vertical] || "📰"}] ${a.title}\n   → ${a.what_happened || a.summary || ""}`;
        })
        .join("\n\n");

      const fullBody = `${digestBody}\n\n📊 ${userArticles.length} articles matched your interests this ${targetFrequency === "daily" ? "day" : "week"}.`;

      // Create in-app notification
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: pref.user_id,
          type: "digest",
          title: digestTitle,
          body: fullBody,
          href: "/dashboard",
          read: false,
        });

      if (notifError) {
        console.error(`Notification error for ${pref.user_id}:`, notifError);
        results.push({ user_id: pref.user_id, error: notifError.message });
      } else {
        results.push({ user_id: pref.user_id, articles_count: userArticles.length, sent: true });
      }
    }

    const sentCount = results.filter((r: any) => r.sent).length;

    return new Response(
      JSON.stringify({
        success: true,
        frequency: targetFrequency,
        total_users: preferences.length,
        sent: sentCount,
        total_articles: articles.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Digest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
