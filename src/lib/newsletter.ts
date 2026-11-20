// Weekly briefing builder: picks stories (Cyprus vs International split), live banners,
// and renders email-safe HTML (tables + inline styles) for any email tool.
import { isInternationalStory } from "./storyOrigin";
import { articlePath } from "./articleUrl";
import { isSameHeadline } from "../../supabase/functions/_shared/facebookPosting";
import { ownStoryImage } from "../../supabase/functions/_shared/genericImage";

export const SITE = "https://businesshub.cy";

export interface NewsletterStory {
  id: string;
  title: string;
  summary: string | null;
  what_happened: string | null;
  why_it_matters: string | null;
  image_url: string | null;
  vertical: string | null;
  tags: string[] | null;
  published_at: string | null;
}

export interface NewsletterBanner {
  id: string;
  name: string;
  slot_id: string;
  image_url: string | null;
  click_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export const isInternational = (s: NewsletterStory) => isInternationalStory(s);

/** Score = views this week first, then having its own picture, then recency. */
function rank(stories: NewsletterStory[], views: Record<string, number>): NewsletterStory[] {
  return [...stories].sort((a, b) =>
    (views[b.id] ?? 0) - (views[a.id] ?? 0)
    || Number(!!ownStoryImage(b.image_url)) - Number(!!ownStoryImage(a.image_url))
    || (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

/** Drop stories whose headline repeats one ranked above it. */
export function dedupeStories(stories: NewsletterStory[]): NewsletterStory[] {
  const out: NewsletterStory[] = [];
  for (const s of stories) if (!out.some((o) => isSameHeadline(o.title, s.title))) out.push(s);
  return out;
}

/** Take up to n, at most 2 per section on the first pass so one section can't fill the issue. */
function takeVaried(pool: NewsletterStory[], n: number): NewsletterStory[] {
  const out: NewsletterStory[] = [], per: Record<string, number> = {};
  for (const s of pool) {
    if (out.length >= n) break;
    const v = s.vertical ?? "general";
    if ((per[v] ?? 0) < 2) { out.push(s); per[v] = (per[v] ?? 0) + 1; }
  }
  for (const s of pool) { if (out.length >= n) break; if (!out.includes(s)) out.push(s); }
  return out;
}

/**
 * Pick `total` stories with `cyprusShare` (0–1) of them from Cyprus, the rest International.
 * If one side runs short, the other side fills the gap. Cyprus stories come first.
 */
export function pickStories(stories: NewsletterStory[], views: Record<string, number>, total: number, cyprusShare: number): NewsletterStory[] {
  const pool = dedupeStories(rank(stories, views));
  const local = pool.filter((s) => !isInternational(s));
  const intl = pool.filter((s) => isInternational(s));
  let wantLocal = Math.round(total * cyprusShare);
  let wantIntl = total - wantLocal;
  if (intl.length < wantIntl) { wantLocal += wantIntl - intl.length; wantIntl = intl.length; }
  if (local.length < wantLocal) { wantIntl = Math.min(intl.length, wantIntl + wantLocal - local.length); wantLocal = local.length; }
  return [...takeVaried(local, wantLocal), ...takeVaried(intl, wantIntl)];
}

/** Banners that are switched on, have a picture and are within their dates; paid ones before house ads. */
export function liveBanners(banners: NewsletterBanner[], now: Date = new Date()): NewsletterBanner[] {
  const t = now.getTime();
  const seen = new Set<string>();
  return banners
    .filter((b) => b.is_active && !!b.image_url
      && (!b.starts_at || new Date(b.starts_at).getTime() <= t)
      && (!b.ends_at || new Date(b.ends_at).getTime() > t))
    .sort((a, b) => Number(/\(house\)/i.test(a.name)) - Number(/\(house\)/i.test(b.name)))
    .filter((b) => { const k = b.image_url!; if (seen.has(k)) return false; seen.add(k); return true; });
}

export function withUtm(url: string, campaign: string): string {
  const abs = url.startsWith("/") ? SITE + url : url;
  try {
    const u = new URL(abs);
    u.searchParams.set("utm_source", "newsletter");
    u.searchParams.set("utm_medium", "email");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch { return abs; }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (s: string | null | undefined) => (s ?? "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
function clip(s: string, n: number) { return s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, "") + "…"; }
const https = (u: string | null) => (u && u.startsWith("https://") ? u : null);

const SECTION: Record<string, string> = { fintech: "FinTech", compliance: "Compliance", regtech: "RegTech", sme: "SMEs", general: "Business", tourism: "Tourism", energy: "Energy" };
const isPressRelease = (s: NewsletterStory) => (s.tags ?? []).some((t) => t?.toLowerCase() === "press release");

export interface NewsletterOptions {
  issue: number;
  dateLabel: string;
  campaign: string;
  intro: string;
  preheader?: string;
  stories: NewsletterStory[];
  banners: { top?: NewsletterBanner | null; mid?: NewsletterBanner | null; footer?: NewsletterBanner | null };
}

export function defaultSubject(issue: number, lead?: NewsletterStory): string {
  return `The Cyprus Business Briefing #${issue}${lead ? `: ${clip(lead.title, 70)}` : ""}`;
}

const NAVY = "#002147", GOLD = "#C4A05A", INK = "#1a1a1a", MUTED = "#5b6472", LINE = "#e3e6ea", PAPER = "#f4f5f7";
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

function bannerRow(b: NewsletterBanner | null | undefined, campaign: string): string {
  if (!b?.image_url) return "";
  const href = b.click_url ? withUtm(b.click_url, campaign) : SITE;
  return `<tr><td style="padding:16px 24px;" align="center">
<div style="font:10px ${SANS};letter-spacing:1px;color:${MUTED};text-transform:uppercase;padding-bottom:4px;">Advertisement</div>
<a href="${esc(href)}" target="_blank"><img src="${esc(b.image_url)}" alt="${esc(b.name.replace(/\s*\(house\)\s*/i, ""))}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;"></a>
</td></tr>`;
}

function label(s: NewsletterStory): string {
  const parts = [isInternational(s) ? "International" : SECTION[s.vertical ?? ""] ?? "Business"];
  if (isPressRelease(s)) parts.push("Press release");
  return parts.join(" · ").toUpperCase();
}

function storyText(s: NewsletterStory): { body: string; why: string } {
  return { body: clip(plain(s.what_happened) || plain(s.summary), 240), why: clip(plain(s.why_it_matters), 180) };
}

function leadRow(s: NewsletterStory, campaign: string): string {
  const href = withUtm(articlePath(s.id, s.title), campaign);
  const img = https(ownStoryImage(s.image_url));
  const { body, why } = storyText(s);
  return `<tr><td style="padding:8px 24px 20px;">
${img ? `<a href="${esc(href)}" target="_blank"><img src="${esc(img)}" alt="" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;margin-bottom:14px;"></a>` : ""}
<div style="font:bold 11px ${SANS};letter-spacing:1px;color:${GOLD};padding-bottom:6px;">${esc(label(s))}</div>
<a href="${esc(href)}" target="_blank" style="font:bold 24px/1.25 ${SERIF};color:${INK};text-decoration:none;">${esc(s.title)}</a>
${body ? `<p style="font:15px/1.55 ${SANS};color:${INK};margin:10px 0 0;">${esc(body)}</p>` : ""}
${why ? `<p style="font:14px/1.5 ${SANS};color:${MUTED};margin:8px 0 0;"><strong style="color:${NAVY};">Why it matters:</strong> ${esc(why)}</p>` : ""}
<p style="margin:12px 0 0;"><a href="${esc(href)}" target="_blank" style="font:bold 13px ${SANS};color:${NAVY};">Read the full story →</a></p>
</td></tr>`;
}

function storyRow(s: NewsletterStory, campaign: string): string {
  const href = withUtm(articlePath(s.id, s.title), campaign);
  const img = https(ownStoryImage(s.image_url));
  const { body, why } = storyText(s);
  const text = `<div style="font:bold 10px ${SANS};letter-spacing:1px;color:${GOLD};padding-bottom:4px;">${esc(label(s))}</div>
<a href="${esc(href)}" target="_blank" style="font:bold 17px/1.3 ${SERIF};color:${INK};text-decoration:none;">${esc(s.title)}</a>
${body ? `<p style="font:14px/1.5 ${SANS};color:${INK};margin:6px 0 0;">${esc(clip(body, 180))}</p>` : ""}
${why ? `<p style="font:13px/1.45 ${SANS};color:${MUTED};margin:6px 0 0;"><strong style="color:${NAVY};">Why it matters:</strong> ${esc(why)}</p>` : ""}`;
  return `<tr><td style="padding:14px 24px;border-top:1px solid ${LINE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${img ? `<td width="132" valign="top" style="padding-right:14px;"><a href="${esc(href)}" target="_blank"><img src="${esc(img)}" alt="" width="132" height="88" style="display:block;width:132px;height:88px;object-fit:cover;border:0;"></a></td>` : ""}
<td valign="top">${text}</td></tr></table></td></tr>`;
}

function sectionHead(title: string): string {
  return `<tr><td style="padding:22px 24px 6px;"><div style="font:bold 12px ${SANS};letter-spacing:2px;color:${NAVY};text-transform:uppercase;border-bottom:2px solid ${NAVY};padding-bottom:6px;">${esc(title)}</div></td></tr>`;
}

export function buildNewsletterHtml(o: NewsletterOptions): string {
  const local = o.stories.filter((s) => !isInternational(s));
  const intl = o.stories.filter((s) => isInternational(s));
  const lead = local[0] ?? intl[0];
  const restLocal = local.filter((s) => s !== lead);
  const restIntl = intl.filter((s) => s !== lead);
  const home = withUtm("/", o.campaign);
  const preheader = o.preheader ?? o.stories.slice(0, 3).map((s) => s.title).join(" · ");
  const intro = o.intro.trim() ? o.intro.trim().split(/\n{2,}/).map((p) => `<p style="font:15px/1.55 ${SANS};color:${INK};margin:0 0 10px;">${esc(p).replace(/\n/g, "<br>")}</p>`).join("") : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Cyprus Business Briefing #${o.issue}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(clip(preheader, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:20px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${LINE};">
<tr><td style="background:${NAVY};padding:20px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><a href="${esc(home)}" target="_blank" style="text-decoration:none;"><span style="font:bold 26px ${SERIF};color:#ffffff;">BusinessHub</span><span style="font:bold 26px ${SERIF};color:${GOLD};">.cy</span></a>
<div style="font:bold 10px ${SANS};letter-spacing:2px;color:${GOLD};padding-top:4px;">CYPRUS EDITION</div></td>
<td align="right" valign="middle" style="font:12px ${SANS};color:#ffffff;">Issue #${o.issue}<br>${esc(o.dateLabel)}</td>
</tr></table></td></tr>
<tr><td style="padding:22px 24px 6px;">
<div style="font:bold 28px/1.2 ${SERIF};color:${INK};">The Cyprus Business Briefing</div>
<div style="font:13px ${SANS};color:${MUTED};padding-top:4px;">The week's Cyprus business news, with a look at what moved abroad.</div>
${intro ? `<div style="padding-top:14px;">${intro}</div>` : ""}
</td></tr>
${bannerRow(o.banners.top, o.campaign)}
${lead ? sectionHead("Lead story") + leadRow(lead, o.campaign) : ""}
${restLocal.length ? sectionHead("Cyprus this week") + restLocal.map((s) => storyRow(s, o.campaign)).join("\n") : ""}
${bannerRow(o.banners.mid, o.campaign)}
${restIntl.length ? sectionHead("International") + restIntl.map((s) => storyRow(s, o.campaign)).join("\n") : ""}
<tr><td align="center" style="padding:24px;"><a href="${esc(home)}" target="_blank" style="display:inline-block;background:${NAVY};color:#ffffff;font:bold 14px ${SANS};padding:12px 22px;text-decoration:none;">More news on BusinessHub.cy</a></td></tr>
${bannerRow(o.banners.footer, o.campaign)}
<tr><td style="background:${PAPER};padding:18px 24px;font:12px/1.5 ${SANS};color:${MUTED};" align="center">
You are receiving this because you signed up for the briefing at <a href="${esc(home)}" style="color:${NAVY};">businesshub.cy</a>.<br>
Questions or press releases: <a href="mailto:info@businesshub.cy" style="color:${NAVY};">info@businesshub.cy</a> ·
<a href="mailto:info@businesshub.cy?subject=Unsubscribe" style="color:${NAVY};">Unsubscribe</a><br>
BusinessHub.cy — Cyprus Edition
</td></tr>
</table></td></tr></table>
</body></html>`;
}
