import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { isGreek, translateToEnglish, translateToGreek } from "../_shared/translateToEnglish.ts";
import { requireTrustedCaller, deniedResponse } from "../_shared/requireTrustedCaller.ts";

/** Backfill: translates saved Greek articles into English, a few at a time. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 10, 1), 25);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const caller = await requireTrustedCaller(req, supabase);
    if (!caller.ok) return deniedResponse(caller, corsHeaders);

    // mode "greek": Greek headline + summary for recent Cyprus Edition stories (shown on BusinessHub.gr).
    if (body?.mode === "greek") {
      const n = Math.min(Math.max(Number(body?.limit) || 20, 1), 60);
      const { data: list, error: e1 } = await supabase.from("cna_articles").select("id,title,summary")
        .eq("status", "published").contains("edition", ["cy"]).is("title_el", null)
        .order("published_at", { ascending: false }).limit(n);
      if (e1) throw e1;
      let done = 0; const errs: string[] = [];
      const work = [...(list ?? [])];
      await Promise.all(Array.from({ length: 6 }, async () => {
        for (let r = work.shift(); r; r = work.shift()) {
          try {
            const t = await translateToGreek({ title: r.title, summary: r.summary }, apiKey);
            if (t.title) { await supabase.from("cna_articles").update({ title_el: t.title, summary_el: t.summary || null }).eq("id", r.id); done++; }
          } catch (e) { errs.push(`${r.id}: ${(e as Error).message}`); }
        }
      }));
      return json({ translated: done, errors: errs });
    }

    const { data: rows, error } = await supabase
      .from("cna_articles")
      .select("id,title,summary,what_happened,why_it_matters,what_to_do,body_markdown")
      .is("original_language", null)
      .or("title.match.[α-ωΑ-Ω]{4},body_markdown.match.[α-ωΑ-Ω]{4},summary.match.[α-ωΑ-Ω]{4}")
      .limit(limit * 2);
    if (error) throw error;

    let translated = 0, skipped = 0;
    const errors: string[] = [];
    for (const r of rows ?? []) {
      if (translated >= limit) break;
      const all = [r.title, r.summary, r.what_happened, r.body_markdown].join(" ");
      if (!isGreek(all)) {
        await supabase.from("cna_articles").update({ original_language: "en" }).eq("id", r.id);
        skipped++;
        continue;
      }
      try {
        const t = await translateToEnglish({
          title: r.title, summary: r.summary, what_happened: r.what_happened,
          why_it_matters: r.why_it_matters, what_to_do: r.what_to_do,
          body_markdown: r.body_markdown?.slice(0, 20000),
        }, apiKey);
        await supabase.from("cna_articles").update({ ...t, original_language: "el" }).eq("id", r.id);
        translated++;
      } catch (e) {
        errors.push(`${r.id}: ${(e as Error).message}`);
        if (/ 40[23] /.test((e as Error).message)) break;
      }
    }
    return json({ translated, skipped, errors });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
