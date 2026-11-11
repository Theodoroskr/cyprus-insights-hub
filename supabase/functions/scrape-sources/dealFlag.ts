// Items from association sources that confirm a specific investment/transaction also go to the
// Company Announcements deal review queue (as drafts — never published automatically).
import { extractDealDetails } from "../_shared/announcementAi.ts";
import { classifyDealType } from "../_shared/announcements.ts";

// deno-lint-ignore no-explicit-any
export async function flagDealForReview(sb: any, a: { sourceName: string; title: string; url: string; body: string; language: string; reason: string }) {
  try {
    const { data: known } = await sb.from("company_announcement_sources").select("id").eq("url", a.url).maybeSingle();
    if (known) return;
    const { data: src } = await sb.from("announcement_sources").select("id").eq("slug", "manual").maybeSingle();
    const d = await extractDealDetails({ title: a.title, url: a.url, markdown: a.body });
    const now = new Date().toISOString();
    const { data: ins, error } = await sb.from("company_announcements").insert({
      section: "deals", announcement_type: d?.announcement_type ?? classifyDealType(`${a.title} ${a.body}`), status: "review",
      company_name: d?.company_name || "To be confirmed", title: d?.headline || a.title, original_title: a.title,
      summary: d?.summary ?? null, source_language: a.language, source_published_at: now, event_date: d?.event_date ?? null,
      canonical_url: a.url, discovery_url: a.url, primary_verified: false, source_id: src?.id ?? null,
      amount: d?.amount ?? null, currency: d?.currency ? d.currency.toUpperCase().slice(0, 3) : null, investors: d?.investors ?? [],
      buyer: d?.buyer ?? null, deal_stage: d?.deal_stage ?? "announced", cyprus_location: d?.cyprus_location ?? null,
      cyprus_tags: (d?.cyprus_tags ?? []).filter((t) => ["listed_in_cyprus", "based_in_cyprus", "founded_in_cyprus", "investing_in_cyprus"].includes(t)),
      sector: d?.sector ?? null, routing_note: `${a.sourceName}: ${a.reason}${d && !d.qualifies ? ` — AI doubts it qualifies: ${d.reason}` : ""}`.slice(0, 500),
    }).select("id").single();
    if (error) { console.error("deal flag insert", error.message); return; }
    await sb.from("company_announcement_sources").upsert([{ announcement_id: ins.id, url: a.url, role: "discovery", source_name: a.sourceName, title: a.title, language: a.language, published_at: now }], { onConflict: "url", ignoreDuplicates: true });
  } catch (e) { console.error("deal flag failed", (e as Error).message); }
}
