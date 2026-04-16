import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the latest month from trade_monthly_totals
    const { data: latestMonth } = await supabase
      .from("trade_monthly_totals")
      .select("*")
      .order("date_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestMonth) {
      return new Response(JSON.stringify({ message: "No trade data found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetMonth = latestMonth.date_month;

    // Check if insight already exists for this month
    const { data: existing } = await supabase
      .from("trade_ai_insights")
      .select("id")
      .eq("date_month", targetMonth)
      .eq("insight_type", "monthly_summary")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Insight already exists for " + targetMonth }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch supporting data in parallel
    const [kpiRes, countriesRes, sectorsRes, trendRes] = await Promise.all([
      supabase
        .from("trade_kpi_snapshots")
        .select("*")
        .eq("date_month", targetMonth)
        .maybeSingle(),
      supabase
        .from("trade_country_monthly")
        .select("*, trade_countries(country_name, eu_member)")
        .eq("date_month", targetMonth)
        .order("rank_position", { ascending: true })
        .limit(10),
      supabase
        .from("trade_sector_monthly")
        .select("*")
        .eq("date_month", targetMonth)
        .order("rank_position", { ascending: true })
        .limit(10),
      supabase
        .from("trade_monthly_totals")
        .select("*")
        .order("date_month", { ascending: false })
        .limit(6),
    ]);

    const kpi = kpiRes.data;
    const topCountries = countriesRes.data ?? [];
    const topSectors = sectorsRes.data ?? [];
    const recentTrend = trendRes.data ?? [];

    // Build context for the AI
    const monthLabel = new Date(targetMonth + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const prompt = `You are a senior trade economist writing an executive briefing on Cyprus imports for ${monthLabel}.

DATA:
- Total imports: €${((kpi?.total_imports_eur ?? 0) / 1_000_000).toFixed(1)}M
- MoM growth: ${kpi?.mom_growth_pct ?? "N/A"}%
- YoY growth: ${kpi?.yoy_growth_pct ?? "N/A"}%
- EU share: ${kpi?.eu_share_pct ?? "N/A"}%, Non-EU: ${kpi?.non_eu_share_pct ?? "N/A"}%
- Top import sector: ${kpi?.top_import_sector ?? "N/A"} (€${((kpi?.top_import_sector_value_eur ?? 0) / 1_000_000).toFixed(1)}M)
- Top 5 countries share: ${kpi?.top_5_countries_share_pct ?? "N/A"}%

Top 10 source countries:
${topCountries.map((c: any, i: number) => `${i + 1}. ${c.trade_countries?.country_name ?? "Unknown"} - €${(c.total_imports_eur / 1_000_000).toFixed(1)}M (${c.country_share_pct?.toFixed(1) ?? "?"}%) ${c.trade_countries?.eu_member ? "[EU]" : "[Non-EU]"}`).join("\n")}

Top 10 sectors:
${topSectors.map((s: any, i: number) => `${i + 1}. ${s.sector_name} - €${(s.total_imports_eur / 1_000_000).toFixed(1)}M (${s.sector_share_pct?.toFixed(1) ?? "?"}%)`).join("\n")}

Recent 6-month trend (imports €M):
${recentTrend.reverse().map((t: any) => `${t.date_month}: €${(t.total_imports_eur / 1_000_000).toFixed(1)}M`).join("\n")}

Write a 3-4 paragraph executive summary covering:
1. Headline takeaway for the month
2. Key shifts in country composition or EU/non-EU balance
3. Sector dynamics and notable changes
4. Forward-looking implications for Cyprus businesses

Keep it factual, data-driven, and under 300 words. Do not use markdown headers. Write in flowing prose.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior trade analyst specializing in Cyprus and EU trade flows. Write concise, executive-level summaries." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices?.[0]?.message?.content;

    if (!summaryText) {
      throw new Error("No content returned from AI");
    }

    // Generate a title
    const titleResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: `Write a short headline (max 10 words) for this Cyprus trade summary for ${monthLabel}. No quotes, no punctuation at the end:\n\n${summaryText}` },
        ],
      }),
    });

    let title = `Cyprus Trade Summary — ${monthLabel}`;
    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      const generatedTitle = titleData.choices?.[0]?.message?.content?.trim();
      if (generatedTitle && generatedTitle.length < 80) {
        title = generatedTitle;
      }
    }

    // Store in database
    const { error: insertError } = await supabase
      .from("trade_ai_insights")
      .insert({
        date_month: targetMonth,
        insight_type: "monthly_summary",
        title,
        summary_text: summaryText,
        is_published: true,
        supporting_metrics_json: {
          total_imports_eur: kpi?.total_imports_eur,
          mom_growth_pct: kpi?.mom_growth_pct,
          yoy_growth_pct: kpi?.yoy_growth_pct,
          eu_share_pct: kpi?.eu_share_pct,
          top_country: topCountries[0]?.trade_countries?.country_name,
          top_sector: kpi?.top_import_sector,
        },
      });

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, title, month: targetMonth }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-trade-insight error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
