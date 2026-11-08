/**
 * Access check for privileged backend functions that write with the service role.
 * A caller is trusted when it is:
 *  - a scheduled job sending the `x-cron-secret` header (value kept in public.internal_secrets, service-only), or
 *  - another backend process using the service-role key as its bearer token, or
 *  - a signed-in user holding the `admin` role.
 * Everything else is rejected before any work is done.
 */

// deno-lint-ignore no-explicit-any
type AnyClient = any;

export type TrustedCaller =
  | { ok: true; via: "cron" | "service" | "admin"; userId?: string }
  | { ok: false; status: number; error: string };

let cachedCronSecret: string | null = null;

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function cronSecret(supabase: AnyClient): Promise<string | null> {
  if (cachedCronSecret) return cachedCronSecret;
  const { data } = await supabase.from("internal_secrets").select("value").eq("name", "cron").maybeSingle();
  cachedCronSecret = data?.value ?? null;
  return cachedCronSecret;
}

export async function getUserFromRequest(req: Request, supabase: AnyClient): Promise<{ id: string } | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id };
}

export async function requireTrustedCaller(req: Request, supabase: AnyClient): Promise<TrustedCaller> {
  const headerSecret = req.headers.get("x-cron-secret") ?? "";
  if (headerSecret) {
    const expected = await cronSecret(supabase);
    if (expected && safeEqual(headerSecret, expected)) return { ok: true, via: "cron" };
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && safeEqual(token, serviceKey)) return { ok: true, via: "service" };

  const user = await getUserFromRequest(req, supabase);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (isAdmin !== true) return { ok: false, status: 403, error: "Admins only" };
  return { ok: true, via: "admin", userId: user.id };
}

export function deniedResponse(result: { status: number; error: string }, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
