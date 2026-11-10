import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";
import { nicosiaHour } from "../_shared/ecb.ts";
import { comparePubs, relevantPubs, type Pub } from "../_shared/oecdMonitor.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SLUG = "oecd-financial-literacy-cyprus";
const KNOWN_DOI = "10.1787/345ca38a-en";
const UA = "BusinessHub.cy/1.0 (mailto:info@businesshub.cy)";

async function getJson(url: string) {
  let last = "";
  for (let a = 0; a < 3; a++) {
    if (a) await sleep(5000 * a);
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status >= 500) { last = `HTTP ${r.status}`; continue; }
      if (!r.ok) throw new Error(`Crossref HTTP ${r.status}`);
      return await r.json();
    } catch (e) { last = (e as Error).message; }
  }
  throw new Error(`Publication index unavailable (${last})`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let via = "schedule";
  if (authenticateCronRequest(req) !== null) {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);
    via = caller.via;
  }
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (via === "schedule" && typeof body.local_hour === "number" && nicosiaHour(new Date()) !== body.local_hour) return json({ ok: true, status: "skipped" });

  const now = new Date().toISOString();
  const { data: src } = await sb.from("open_data_sources").select("*").eq("slug", SLUG).single();
  if (!src) return json({ error: "Source not registered" }, 404);
  try {
    const q = await getJson("https://api.crossref.org/works?filter=prefix:10.1787,from-pub-date:2024-01-01&query.bibliographic=financial+literacy+cyprus&rows=50&select=DOI,title,issued,deposited");
    const one = await getJson(`https://api.crossref.org/works/${KNOWN_DOI}`);
    const found = relevantPubs([...(q?.message?.items ?? []), one?.message].filter(Boolean));
    const uniq = [...new Map(found.map((f) => [f.doi, f])).values()];
    const known: Pub[] = (src.discovered_resources as { publications?: Pub[] } | null)?.publications ?? [];
    const first = known.length === 0;
    const { added, changed } = comparePubs(uniq, known);
    const latest = uniq.map((p) => p.issued).filter(Boolean).sort().pop() ?? src.latest_period;

    if (!first && (added.length || changed.length)) {
      const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
      const lines = [...added.map((p) => `New: ${p.title} (${p.doi})`), ...changed.map((p) => `Updated metadata: ${p.title} (${p.doi})`)];
      const rows = (admins ?? []).map((a) => ({ user_id: a.user_id, type: "data_source_alert", title: "OECD Cyprus financial literacy: review needed", body: lines.join("\n").slice(0, 900), href: "/editorial?tab=open-data" }));
      if (rows.length) await sb.from("notifications").insert(rows);
    }
    const review = !first && (added.length > 0 || changed.length > 0);
    await sb.from("open_data_sources").update({
      status: review ? "review" : "ok", last_error: review ? `${added.length} new, ${changed.length} updated publication(s) to review` : null,
      last_checked_at: now, last_success_at: now, latest_period: latest,
      discovered_resources: { publications: [...new Map([...known, ...uniq].map((p) => [p.doi, p])).values()], last_result: { added, changed, at: now } },
    }).eq("id", src.id);
    return json({ ok: true, found: uniq.length, added: added.length, changed: changed.length, baseline: first });
  } catch (e) {
    await sb.from("open_data_sources").update({ status: "error", last_error: (e as Error).message.slice(0, 500), last_checked_at: now }).eq("id", src.id);
    return json({ error: (e as Error).message }, 500);
  }
});
