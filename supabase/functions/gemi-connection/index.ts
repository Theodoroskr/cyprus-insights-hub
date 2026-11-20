import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { cleanGemiKey, GEMI_KEY_NAME, GEMI_SOURCE_SLUG, testGemiKey, type GemiTest } from "../_shared/gemi.ts";

/**
 * Admin-only GEMI access key setting. The key is stored in the service-only `internal_secrets`
 * table and is never returned to the browser. Actions: status, save (tests first), test, remove.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const caller = await requireTrustedCaller(req, supabase);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    if (caller.via === "cron") return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "status";

    const stored = async () => {
      const { data } = await supabase.from("internal_secrets").select("value, created_at").eq("name", GEMI_KEY_NAME).maybeSingle();
      return data as { value: string; created_at: string } | null;
    };
    const record = async (t: GemiTest) => {
      const now = new Date().toISOString();
      await supabase.from("open_data_sources").update({
        last_checked_at: now, ...(t.ok ? { last_success_at: now, last_error: null } : { last_error: `Connection test: ${t.message}` }),
      }).eq("slug", GEMI_SOURCE_SLUG);
    };
    const status = async () => {
      const row = await stored();
      const { data: src } = await supabase.from("open_data_sources").select("last_checked_at, last_success_at, last_error").eq("slug", GEMI_SOURCE_SLUG).maybeSingle();
      const lastOk = !!src?.last_checked_at && src.last_checked_at === src.last_success_at;
      return { configured: !!row, saved_at: row?.created_at ?? null, last_checked_at: src?.last_checked_at ?? null, last_ok: src?.last_checked_at ? lastOk : null, last_error: src?.last_error ?? null };
    };

    if (action === "status") return json(await status());

    if (action === "save") {
      const key = cleanGemiKey(body?.key);
      if (!key) return json({ error: "That doesn't look like an access key (one line, no spaces, 8–256 characters)." }, 400);
      const t = await testGemiKey(key);
      if (t.rejected) { await record(t); return json({ saved: false, test: t, ...(await status()) }); }
      await supabase.from("internal_secrets").delete().eq("name", GEMI_KEY_NAME);
      const { error } = await supabase.from("internal_secrets").insert({ name: GEMI_KEY_NAME, value: key });
      if (error) throw error;
      await record(t);
      // A key that passed the test starts the first import straight away (in the background; the daily run carries on after).
      let importStarted = false;
      if (t.ok) {
        const run = fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ingest-gemi`, {
          method: "POST",
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => undefined);
        // deno-lint-ignore no-explicit-any
        (globalThis as any).EdgeRuntime?.waitUntil?.(run);
        importStarted = true;
      }
      return json({ saved: true, import_started: importStarted, test: t, ...(await status()) });
    }

    if (action === "test") {
      const row = await stored();
      if (!row) return json({ error: "No GEMI access key saved yet." }, 400);
      const t = await testGemiKey(row.value);
      await record(t);
      return json({ test: t, ...(await status()) });
    }

    if (action === "remove") {
      await supabase.from("internal_secrets").delete().eq("name", GEMI_KEY_NAME);
      return json({ removed: true, ...(await status()) });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
