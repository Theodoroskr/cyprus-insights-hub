import { translateWith } from "./translateToEnglish.ts";
import { readsInEnglish } from "./kimdisEnglish.ts";
// English translations for KIMDIS notices (titles, contracting authorities) and CPV category names, via Lovable AI.
// Only what the site shows is translated: open tenders and contract awards.

type Item = { id: string; text: string };

const NOTICE_RULES = "You translate Greek public-procurement records into clear British English for business readers. "
  + "Translate faithfully and completely; do not summarise, add or omit anything. Keep reference numbers, law numbers, amounts and dates exactly; Greek-lettered reference codes (e.g. ΑΔΑ codes like Ρ1ΦΝ46ΜΑΖΤ-ΨΜΞ) stay as written, but write the labels ΑΔΑ as 'ADA' and ΑΔΑΜ as 'ADAM'. "
  + "Contracting authorities: use the official English form where one exists (e.g. ΔΗΜΟΣ ΑΘΗΝΑΙΩΝ → Municipality of Athens, ΥΠΟΥΡΓΕΙΟ ΟΙΚΟΝΟΜΙΚΩΝ → Ministry of Finance, ΠΕΡΙΦΕΡΕΙΑ → Region of), "
  + "otherwise translate the type and transliterate the place name. Never answer in capitals, even when the Greek is written in capitals: titles in sentence case, authority names in title case. Keep acronyms as written. Remove quotation marks that wrap the whole text.";
const CPV_RULES = "Each item is a CPV 2008 code with its official Greek description. Return the official English CPV 2008 description for that code "
  + "(as published by the EU Publications Office). If unsure, translate the Greek description faithfully. Text only, no code.";

async function translateBatch(items: Item[], system: string, apiKey: string): Promise<Map<string, string>> {
  // Field keys must be plain identifiers; each item gets a short positional key.
  const fields = Object.fromEntries(items.map((it, i) => [`f${i}`, it.text]));
  let got: Record<string, unknown>;
  try { got = await translateWith(fields, apiKey, system); }
  catch (e) {
    // One retry for a busy translator (429/5xx); anything else waits for the next run.
    if (!/ (429|5\d\d) /.test((e as Error).message)) throw e;
    await new Promise((r) => setTimeout(r, 5000));
    got = await translateWith(fields, apiKey, system);
  }
  const out = new Map<string, string>();
  items.forEach((it, i) => {
    const v = got[`f${i}`];
    const en = typeof v === "string" ? v.trim() : "";
    // Only real translations: unchanged or still-Greek answers are left for the next run.
    if (en && en !== it.text && readsInEnglish(en, it.text)) out.set(it.id, en.slice(0, 2000));
  });
  return out;
}

async function pool<T>(work: T[], n: number, fn: (x: T) => Promise<void>) {
  await Promise.all(Array.from({ length: n }, async () => { for (let x = work.shift(); x; x = work.shift()) await fn(x); }));
}

// deno-lint-ignore no-explicit-any
export async function translateNotices(sb: any, apiKey: string, opts: { limit: number; cpvLimit: number; deadlineMs: number }) {
  const now = new Date().toISOString();
  const { data: rows, error } = await sb.from("gr_procurement_notices")
    .select("reference_number,title,authority_name")
    .is("translated_at", null)
    .or(`kind.eq.award,and(kind.eq.tender,cancelled.eq.false,deadline_at.gt.${now})`)
    .order("deadline_at", { ascending: true, nullsFirst: false })
    .limit(opts.limit);
  if (error) throw error;
  const list = (rows ?? []) as { reference_number: string; title: string; authority_name: string | null }[];
  const batches: typeof list[] = [];
  for (let i = 0; i < list.length; i += 15) batches.push(list.slice(i, i + 15));
  let done = 0; const errors: string[] = [];
  const hasGreek = (t: string | null) => !!t && /[\u0370-\u03FF\u1F00-\u1FFF]/.test(t);
  const noticeWork = pool(batches, 4, async (b) => {
    // Records already written in English need no translation.
    for (const r of b.filter((x) => !hasGreek(x.title) && !hasGreek(x.authority_name))) {
      await sb.from("gr_procurement_notices").update({ title_en: r.title, authority_name_en: r.authority_name, translated_at: new Date().toISOString() }).eq("reference_number", r.reference_number);
      done++;
    }
    b = b.filter((x) => hasGreek(x.title) || hasGreek(x.authority_name));
    if (!b.length) return;
    const items: Item[] = b.flatMap((r) => [{ id: `t:${r.reference_number}`, text: r.title }, ...(r.authority_name ? [{ id: `a:${r.reference_number}`, text: r.authority_name }] : [])]);
    try {
      const got = await translateBatch(items, NOTICE_RULES, apiKey);
      for (const r of b) {
        const title_en = hasGreek(r.title) ? got.get(`t:${r.reference_number}`) : r.title;
        const authority_name_en = !r.authority_name ? null : hasGreek(r.authority_name) ? got.get(`a:${r.reference_number}`) ?? null : r.authority_name;
        // Mark a record done only when both its title and its buyer read in English; otherwise the next round retries it.
        if (!title_en || (r.authority_name && !authority_name_en)) continue;
        const { error: e } = await sb.from("gr_procurement_notices").update({
          title_en, authority_name_en, translated_at: new Date().toISOString(),
        }).eq("reference_number", r.reference_number).eq("title", r.title);
        if (!e) done++;
      }
    } catch (e) { if (errors.length < 5) errors.push((e as Error).message.slice(0, 200)); }
  });

  const { data: cpvs } = await sb.from("gr_cpv_labels").select("code,label_el").is("label_en", null).limit(opts.cpvLimit);
  const cpvBatches: { code: string; label_el: string }[][] = [];
  for (let i = 0; i < (cpvs ?? []).length; i += 50) cpvBatches.push(cpvs.slice(i, i + 50));
  let cpvDone = 0;
  const cpvWork = pool(cpvBatches, 3, async (b) => {
    if (Date.now() > opts.deadlineMs) return;
    try {
      const got = await translateBatch(b.map((c) => ({ id: c.code, text: `${c.code}: ${c.label_el}` })), CPV_RULES, apiKey);
      for (const c of b) {
        const en = got.get(c.code);
        if (en) { await sb.from("gr_cpv_labels").update({ label_en: en, updated_at: new Date().toISOString() }).eq("code", c.code); cpvDone++; }
      }
    } catch (e) { if (errors.length < 5) errors.push((e as Error).message.slice(0, 200)); }
  });
  await Promise.all([noticeWork, cpvWork]);
  const { count: noticesLeft } = await sb.from("gr_procurement_notices").select("reference_number", { count: "exact", head: true })
    .is("translated_at", null).or(`kind.eq.award,and(kind.eq.tender,cancelled.eq.false,deadline_at.gt.${now})`);
  const { count: cpvLeft } = await sb.from("gr_cpv_labels").select("code", { count: "exact", head: true }).is("label_en", null);
  return { notices: done, notices_left: noticesLeft ?? 0, cpv: cpvDone, cpv_left: cpvLeft ?? 0, errors };
}
