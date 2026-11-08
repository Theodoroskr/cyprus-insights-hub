import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { discoverPortalLinks } from "../_shared/tourismParse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Admin tool: read a data.gov.cy dataset page and register it (disabled) with the files/links it lists. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await requireTrustedCaller(req, sb);
  if (!caller.ok) return deniedResponse(caller, corsHeaders);

  let body: { url?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  const m = String(body.url ?? "").match(/^https:\/\/data\.gov\.cy\/(?:en|el)\/dataset\/(\d+)/);
  if (!m) return json({ error: "Paste a data.gov.cy dataset link, e.g. https://data.gov.cy/en/dataset/1007" }, 400);
  const url = `https://data.gov.cy/en/dataset/${m[1]}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) return json({ error: `Portal returned HTTP ${res.status}` }, 502);
  const html = await res.text();
  const title = (html.match(/<title>([^<|]+)/)?.[1] ?? `Dataset ${m[1]}`).trim();
  const links = discoverPortalLinks(html);

  // Resource pages often hold the real download/upstream link — follow up to 5.
  for (const r of links.filter((l) => l.format === "resource page").slice(0, 5)) {
    try {
      const rr = await fetch(r.url, { signal: AbortSignal.timeout(20000) });
      if (rr.ok) for (const l of discoverPortalLinks(await rr.text())) if (l.format !== "resource page") links.push(l);
    } catch { /* ignore */ }
  }
  const resources = [...new Map(links.filter((l) => l.format !== "resource page").map((l) => [l.url, l])).values()];
  const licence = /creativecommons\.org\/licenses\/by\/4\.0/.test(html) ? "CC BY 4.0" : null;

  const { data: existing } = await sb.from("open_data_sources").select("id, slug").eq("portal_url", url).maybeSingle();
  const row = { title_en: title, portal_url: url, publisher: "data.gov.cy", licence, discovered_resources: resources, last_checked_at: new Date().toISOString(), format: [...new Set(resources.map((r) => r.format))].join(", ") || null };
  if (existing) {
    const { title_en: _t, publisher: _p, ...rest } = row;
    await sb.from("open_data_sources").update(rest).eq("id", existing.id);
  } else {
    await sb.from("open_data_sources").insert({ ...row, slug: `datagov-${m[1]}`, module: "catalog", enabled: false, status: "discovered" });
  }
  return json({ ok: true, title, resources, licence });
});
