import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const gatewayUrl = Deno.env.get("LOVABLE_AI_GATEWAY_URL")!;
    const gatewayKey = Deno.env.get("LOVABLE_AI_GATEWAY_API_KEY")!;

    const { offset = 0, batch_size = 60 } = await req.json().catch(() => ({}));

    // Get distinct Greek activities
    const { data: rows, error } = await supabase
      .rpc("get_greek_activities", { _offset: offset, _limit: batch_size });

    // Fallback: raw SQL via a simple query
    let activities: string[] = [];
    if (error || !rows) {
      // Use direct query approach
      const { data: fallback } = await supabase
        .from("directory_companies")
        .select("activity_description")
        .not("activity_description", "is", null)
        .limit(50000);
      
      if (fallback) {
        const greekRegex = /[α-ωά-ώΑ-ΩΆ-Ώ]/;
        const unique = [...new Set(
          fallback.map((r: any) => r.activity_description as string).filter((d: string) => greekRegex.test(d))
        )];
        activities = unique.slice(offset, offset + batch_size);
      }
    } else {
      activities = rows.map((r: any) => r.activity_description);
    }

    if (activities.length === 0) {
      return new Response(JSON.stringify({ done: true, message: "No more Greek activities" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Translating ${activities.length} activities (offset ${offset})`);

    // Translate via AI
    const numbered = activities.map((a, i) => `${i + 1}. ${a}`).join("\n");
    const aiResp = await fetch(`${gatewayUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You translate Greek business activity descriptions to English. Return ONLY a JSON object where keys are the exact Greek text and values are English translations. No markdown fences.`,
          },
          { role: "user", content: `Translate:\n${numbered}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) throw new Error(`AI error: ${await aiResp.text()}`);

    const aiData = await aiResp.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const translations: Record<string, string> = JSON.parse(content);
    console.log(`Got ${Object.keys(translations).length} translations`);

    // Apply updates
    let updated = 0;
    for (const [greek, english] of Object.entries(translations)) {
      const { count } = await supabase
        .from("directory_companies")
        .update({ activity_description: english as string })
        .eq("activity_description", greek)
        .select("id", { count: "exact", head: true });
      updated += count || 0;
    }

    return new Response(
      JSON.stringify({
        batch_offset: offset,
        activities_in_batch: activities.length,
        translated: Object.keys(translations).length,
        rows_updated: updated,
        next_offset: offset + batch_size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
