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

    const { translations } = await req.json();

    if (!translations || typeof translations !== "object") {
      return new Response(JSON.stringify({ error: "Pass { translations: { greek: english, ... } }" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const [greek, english] of Object.entries(translations)) {
      const { count, error } = await supabase
        .from("directory_companies")
        .update({ activity_description: english as string })
        .eq("activity_description", greek)
        .select("id", { count: "exact", head: true });

      if (error) {
        errors.push(`${greek}: ${error.message}`);
      } else {
        updated += count || 0;
      }
    }

    return new Response(
      JSON.stringify({
        translations_received: Object.keys(translations).length,
        rows_updated: updated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
