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

    // Get all distinct Greek activity descriptions
    const { data: rows, error: fetchErr } = await supabase
      .from("directory_companies")
      .select("activity_description")
      .filter("activity_description", "neq", null)
      .limit(1000);

    if (fetchErr) throw fetchErr;

    // Deduplicate and filter Greek-only
    const greekRegex = /[α-ωά-ώΑ-ΩΆ-Ώ]/;
    const uniqueGreek = [...new Set(
      (rows || [])
        .map((r: any) => r.activity_description as string)
        .filter((d: string) => greekRegex.test(d))
    )];

    // Actually get ALL distinct Greek activities
    const { data: allRows, error: allErr } = await supabase
      .rpc("get_distinct_greek_activities");

    // Fallback: query directly
    let activities: string[] = uniqueGreek;

    // We need all distinct values. Let's paginate.
    const allActivities = new Set<string>();
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page } = await supabase
        .from("directory_companies")
        .select("activity_description")
        .not("activity_description", "is", null)
        .range(offset, offset + pageSize - 1);
      if (!page || page.length === 0) break;
      for (const r of page) {
        const desc = r.activity_description as string;
        if (greekRegex.test(desc)) allActivities.add(desc);
      }
      offset += pageSize;
      if (page.length < pageSize) break;
    }

    activities = [...allActivities];
    console.log(`Found ${activities.length} unique Greek activities to translate`);

    if (activities.length === 0) {
      return new Response(JSON.stringify({ message: "No Greek activities found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Translate in batches of ~50 using Gemini via Lovable AI Gateway
    const BATCH_SIZE = 50;
    const translations: Record<string, string> = {};
    const gatewayUrl = Deno.env.get("LOVABLE_AI_GATEWAY_URL");
    const gatewayKey = Deno.env.get("LOVABLE_AI_GATEWAY_API_KEY");

    if (!gatewayUrl || !gatewayKey) {
      throw new Error("AI Gateway not configured");
    }

    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE);
      const numbered = batch.map((a, idx) => `${idx + 1}. ${a}`).join("\n");

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
              content: "You are a professional translator. Translate Greek business activity descriptions to English. Return ONLY a JSON object mapping the original Greek text to the English translation. No markdown, no code blocks, just pure JSON.",
            },
            {
              role: "user",
              content: `Translate these Greek business activity descriptions to English:\n\n${numbered}`,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error(`AI error batch ${i}: ${errText}`);
        continue;
      }

      const aiData = await aiResp.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      
      // Clean markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(content);
        for (const [greek, english] of Object.entries(parsed)) {
          translations[greek] = english as string;
        }
      } catch (parseErr) {
        console.error(`Parse error batch ${i}:`, parseErr, content.substring(0, 200));
      }

      console.log(`Translated batch ${i / BATCH_SIZE + 1}/${Math.ceil(activities.length / BATCH_SIZE)}`);
    }

    console.log(`Total translations: ${Object.keys(translations).length}`);

    // Apply translations to database
    let updated = 0;
    for (const [greek, english] of Object.entries(translations)) {
      const { count, error: upErr } = await supabase
        .from("directory_companies")
        .update({ activity_description: english })
        .eq("activity_description", greek)
        .select("id", { count: "exact", head: true });

      if (upErr) {
        console.error(`Update error for "${greek}":`, upErr);
      } else {
        updated += count || 0;
      }
    }

    return new Response(
      JSON.stringify({
        unique_activities: activities.length,
        translated: Object.keys(translations).length,
        rows_updated: updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
