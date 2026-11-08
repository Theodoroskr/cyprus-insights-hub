import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { INTERESTS } from "./interests.ts";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });



const Body = z.object({
  full_name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).regex(/^[+()\d\s.-]*$/, "Invalid phone").optional().or(z.literal("")),
  country: z.string().trim().min(2).max(80),
  industry: z.string().trim().min(2).max(80),
  interest: z.enum(INTERESTS),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  language: z.enum(["en", "el"]).default("en"),
  privacy_ack: z.literal(true),
  marketing_consent: z.boolean().default(false),
  origin_path: z.string().max(200).optional(),
  placement: z.string().max(60).optional(),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot: must stay empty
  started_at: z.number().optional(),
});

const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|proton(mail)?|gmx|mail)\./i;

async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: "Please check the form", fields: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  // Bots: filled honeypot or submitted faster than a human could type. Pretend success.
  if (b.website || (b.started_at && Date.now() - b.started_at < 3000)) return json({ ok: true });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const clientHash = await hash(`${ip}|${req.headers.get("user-agent") ?? ""}`);
  const emailHash = await hash(b.email.toLowerCase());
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: byClient }, { count: byEmail }] = await Promise.all([
    sb.from("commercial_enquiries").select("id", { count: "exact", head: true }).eq("client_hash", clientHash).gte("created_at", hourAgo),
    sb.from("commercial_enquiries").select("id", { count: "exact", head: true }).ilike("email", b.email).gte("created_at", dayAgo),
  ]);
  if ((byClient ?? 0) >= 3 || (byEmail ?? 0) >= 3) return json({ error: "Too many enquiries. Please try again later." }, 429);

  const { data: row, error } = await sb.from("commercial_enquiries").insert({
    full_name: b.full_name, company: b.company, email: b.email, phone: b.phone || null, country: b.country,
    industry: b.industry, interest: b.interest, message: b.message || null, language: b.language,
    privacy_ack: true, marketing_consent: b.marketing_consent, origin_path: b.origin_path ?? null,
    placement: b.placement ?? null, client_hash: clientHash,
  }).select("id").single();
  if (error) { console.error("insert failed", error.message, emailHash); return json({ error: "Could not save your enquiry" }, 500); }

  await sb.from("cta_events").insert({ event: "submit", placement: (b.placement ?? "unknown").slice(0, 60), path: b.origin_path?.slice(0, 200) ?? null, interest: b.interest });

  // Notify authorised staff (admins) in the app; no personal data in the notification body beyond company.
  const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
  if (admins?.length) {
    await sb.from("notifications").insert(admins.map((a) => ({
      user_id: a.user_id, type: "commercial_enquiry", title: `New enquiry: ${b.interest}`,
      body: `${b.company} (${b.industry}, ${b.country})${FREE_MAIL.test(b.email) ? " · personal email" : ""}`,
      href: "/editorial?tab=mastercard",
    })));
  }
  return json({ ok: true, id: row.id });
});
