import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { assessSource } from "../_shared/openDataHealth.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);
  try {
    const { data: sources, error } = await sb.from("open_data_sources").select("*").eq("enabled", true).neq("module", "catalog");
    if (error) throw error;
    const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
    const results = [];
    let alerts = 0;
    for (const s of sources ?? []) {
      const h = assessSource(s);
      const changed = h.state !== s.alert_state;
      const upd: Record<string, unknown> = { alert_state: h.state, alert_reason: h.reason };
      if (changed && h.state !== "ok") {
        upd.alerted_at = new Date().toISOString();
        const title = `${h.state === "stale_period" ? "No new month" : h.state === "error" ? "Check failed" : "Missed check"}: ${s.title_en}`;
        const rows = (admins ?? []).map((a) => ({ user_id: a.user_id, type: "data_source_alert", title, body: h.reason, href: "/editorial?tab=open-data" }));
        if (rows.length) await sb.from("notifications").insert(rows);
        alerts++;
      }
      // Bypass the updated_at trigger noise is fine; only health columns change.
      await sb.from("open_data_sources").update(upd).eq("id", s.id);
      results.push({ slug: s.slug, ...h, alerted: changed && h.state !== "ok" });
    }
    return json({ success: true, alerts, results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
