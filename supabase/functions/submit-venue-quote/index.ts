import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { canAttemptDelivery, looksLikeBot, overLimit, QUOTE_EMAIL_READY, quoteEmail, validateQuote, type QuoteInput } from "../_shared/venueQuote.ts";
import { requireTrustedCaller } from "../_shared/requireTrustedCaller.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
// deno-lint-ignore no-explicit-any
type Sb = any;

async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/** Venue that may receive quotes, with its verified recipient — always looked up here, never taken from the request. */
async function quoteVenue(sb: Sb, id: string) {
  const { data: v } = await sb.from("tour_listings").select("id,name_en,status,category,quote_enabled").eq("id", id).maybeSingle();
  if (!v || v.status !== "published" || v.category !== "conference-venues" || !v.quote_enabled) return null;
  const { data: c } = await sb.from("tour_venue_contacts").select("email,verified_at").eq("listing_id", id).maybeSingle();
  if (!c?.verified_at || !c.email) return null;
  return { id: v.id as string, name: v.name_en as string, email: c.email as string };
}

/** Sends the email once. A row already sent or mid-send is left alone, so retries never duplicate a send. */
async function deliver(sb: Sb, requestId: string): Promise<string> {
  const { data: claimed } = await sb.from("venue_quote_deliveries")
    .update({ status: "sending" }).eq("request_id", requestId).in("status", ["pending", "failed", "not_configured"]).select("recipient_email,attempts").maybeSingle();
  if (!claimed) { const { data } = await sb.from("venue_quote_deliveries").select("status").eq("request_id", requestId).maybeSingle(); return data?.status ?? "missing"; }
  const attempts = (claimed.attempts ?? 0) + 1;
  if (!QUOTE_EMAIL_READY) {
    await sb.from("venue_quote_deliveries").update({ status: "not_configured", attempts, last_error: "No verified email sender domain is set up yet" }).eq("request_id", requestId);
    return "not_configured";
  }
  try {
    const { data: q } = await sb.from("venue_quote_requests").select("*").eq("id", requestId).single();
    const msg = quoteEmail(q.venue_name, q as QuoteInput);
    // Wire the project's app-email sender here once the domain is verified; idempotency key = request id.
    const { error } = await sb.functions.invoke("send-transactional-email", {
      body: { templateName: "venue-quote-request", recipientEmail: claimed.recipient_email, idempotencyKey: `venue-quote-${requestId}`, replyTo: q.email, templateData: { ...q, ...msg } },
    });
    if (error) throw new Error(error.message);
    await sb.from("venue_quote_deliveries").update({ status: "sent", attempts, last_error: null, sent_at: new Date().toISOString() }).eq("request_id", requestId);
    return "sent";
  } catch (e) {
    await sb.from("venue_quote_deliveries").update({ status: "failed", attempts, last_error: String((e as Error).message).slice(0, 500) }).eq("request_id", requestId);
    return "failed";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: Record<string, unknown>;
  try { raw = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Staff retry of a failed send.
  if (raw?.action === "retry") {
    const caller = await requireTrustedCaller(req, sb);
    if (!caller.ok) return json({ error: caller.error }, caller.status);
    const id = String(raw.request_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid request id" }, 400);
    return json({ ok: true, status: await deliver(sb, id) });
  }

  const parsed = validateQuote(raw);
  if (!parsed.ok) return json({ error: "Please check the form", fields: parsed.errors }, 400);
  const b = parsed.data;
  if (looksLikeBot(b)) return json({ ok: true });

  // Idempotent: the same form submission (request_key) is saved and sent once, however many times it is retried.
  const { data: existing } = await sb.from("venue_quote_requests").select("id").eq("request_key", b.request_key).maybeSingle();
  if (existing) return json({ ok: true, id: existing.id, duplicate: true });

  if (!QUOTE_EMAIL_READY) return json({ error: "Quote requests are not available yet." }, 503);
  const venue = await quoteVenue(sb, b.venue_id);
  if (!venue) return json({ error: "This venue is not accepting quote requests yet." }, 409);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const clientHash = await hash(`${ip}|${req.headers.get("user-agent") ?? ""}`);
  const [{ count: byClient }, { count: byEmail }] = await Promise.all([
    sb.from("venue_quote_requests").select("id", { count: "exact", head: true }).eq("client_hash", clientHash).gte("created_at", new Date(Date.now() - 3600_000).toISOString()),
    sb.from("venue_quote_requests").select("id", { count: "exact", head: true }).ilike("email", b.email).gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
  ]);
  if (overLimit(byClient ?? 0, byEmail ?? 0)) return json({ error: "Too many requests. Please try again later." }, 429);

  const { data: row, error } = await sb.from("venue_quote_requests").insert({
    listing_id: venue.id, venue_name: venue.name, request_key: b.request_key, full_name: b.full_name, organisation: b.organisation, email: b.email,
    event_type: b.event_type, preferred_dates: b.preferred_dates, delegate_count: b.delegate_count, room_layout: b.room_layout,
    catering: b.catering, av_requirements: b.av_requirements, details: b.details, language: b.language, client_hash: clientHash,
  }).select("id").single();
  if (error) {
    if (error.code === "23505") { const { data: again } = await sb.from("venue_quote_requests").select("id").eq("request_key", b.request_key).maybeSingle(); return json({ ok: true, id: again?.id, duplicate: true }); }
    console.error("quote insert failed", error.message);
    return json({ error: "Could not save your request" }, 500);
  }
  await sb.from("venue_quote_deliveries").insert({ request_id: row.id, recipient_email: venue.email });

  const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
  if (admins?.length) await sb.from("notifications").insert(admins.map((a: { user_id: string }) => ({
    user_id: a.user_id, type: "venue_quote", title: `Quote request: ${venue.name}`, body: `${b.organisation} · ${b.delegate_count} delegates`, href: "/editorial?tab=tourism",
  })));

  const status = await deliver(sb, row.id);
  return json({ ok: true, id: row.id, delivery: status });
});
