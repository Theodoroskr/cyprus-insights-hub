// Pure rules for the daily "official data" social post (used by post-data-highlight and tests).
import { cyprusClock, SITE_URL } from "./facebookPosting.ts";

const LIBRARY_BASE = "https://oralbierakmfxcqncjnz.supabase.co/storage/v1/object/public/banner-images/social-library";

export type DataTopic = "greece-pulse" | "cyprus-economy" | "cyprus-banking" | "cyprus-property" | "cyprus-tourism" | "integrity";

export interface Obs { geo: string; period: string; value: number }
export type SeriesMap = Record<string, Obs[]>;

export interface DataPost {
  topic: DataTopic;
  /** Identifies the releases behind the figures; a new release gives a new fingerprint. */
  fingerprint: string;
  headline: string;
  lines: string[];
  source: string;
  path: string;
  image: string;
  hashtags: string[];
  /** Annual figures: post only when a new edition appears, never as a rerun. */
  onlyWhenNew?: boolean;
}

export interface HistoryRow { topic: string; fingerprint: string; created_at: string; status?: string }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-Q2" → "Q2 2026", "2026-10" → "Oct 2026", "2025" → "2025". */
export function periodLabel(p: string): string {
  const q = /^(\d{4})-?Q([1-4])$/.exec(p);
  if (q) return `Q${q[2]} ${q[1]}`;
  const m = /^(\d{4})-(\d{2})/.exec(p);
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return p;
}

const num = (v: number, d = 0) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v: number, d = 1) => `${num(v, d)}%`;

/** Change against the same period a year earlier, e.g. "up 9.1% on a year earlier". */
export function yoyPhrase(now: number, before: number | undefined): string | null {
  if (before === undefined || !before) return null;
  const ch = ((now - before) / before) * 100;
  if (Math.abs(ch) < 0.05) return "unchanged on a year earlier";
  return `${ch > 0 ? "up" : "down"} ${num(Math.abs(ch), 1)}% on a year earlier`;
}

/** Same period one year earlier ("2026-Q2" → "2025-Q2", "2026-10" → "2025-10"). */
export function yearEarlier(p: string): string {
  return p.replace(/^(\d{4})/, (y) => String(Number(y) - 1));
}

function latest(obs: Obs[] | undefined, geo: string): Obs | undefined {
  return (obs ?? []).filter((o) => o.geo === geo && Number.isFinite(o.value)).sort((a, b) => a.period.localeCompare(b.period)).at(-1);
}
function at(obs: Obs[] | undefined, geo: string, period: string): Obs | undefined {
  return (obs ?? []).find((o) => o.geo === geo && o.period === period);
}

const img = (t: DataTopic) => `${LIBRARY_BASE}/data-${t}.png`;

export function greecePulsePost(s: SeriesMap): DataPost | null {
  const parts: string[] = [], fp: string[] = [];
  const gdp = latest(s.gdp_growth, "EL");
  if (gdp) { parts.push(`📈 Real GDP growth: ${pct(gdp.value)} year on year (${periodLabel(gdp.period)})`); fp.push(`gdp:${gdp.period}`); }
  const inf = latest(s.hicp_all, "EL");
  if (inf) { parts.push(`🛒 Inflation: ${pct(inf.value)} (${periodLabel(inf.period)})`); fp.push(`hicp:${inf.period}`); }
  const un = latest(s.unemployment, "EL");
  if (un) { parts.push(`👷 Unemployment: ${pct(un.value)} (${periodLabel(un.period)})`); fp.push(`un:${un.period}`); }
  const tr = latest(s.gr_travellers, "EL");
  if (tr) {
    const y = yoyPhrase(tr.value, at(s.gr_travellers, "EL", yearEarlier(tr.period))?.value);
    parts.push(`✈️ Inbound travellers: ${num(tr.value)} thousand (${periodLabel(tr.period)}${y ? `, ${y}` : ""})`);
    fp.push(`tr:${tr.period}`);
  }
  const rc = latest(s.gr_travel_receipts, "EL");
  if (rc) {
    const y = yoyPhrase(rc.value, at(s.gr_travel_receipts, "EL", yearEarlier(rc.period))?.value);
    parts.push(`💶 Travel receipts: €${num(rc.value)} million (${periodLabel(rc.period)}${y ? `, ${y}` : ""})`);
    fp.push(`rc:${rc.period}`);
  }
  if (parts.length < 2) return null;
  return {
    topic: "greece-pulse", fingerprint: fp.join("|"), headline: "Greece Business Pulse: the latest official figures for the Greek economy",
    lines: parts, source: "Eurostat, Bank of Greece", path: "/greece/business-pulse?lang=en", image: img("greece-pulse"),
    hashtags: ["#Greece", "#Economy", "#Data"],
  };
}

export function cyprusEconomyPost(s: SeriesMap): DataPost | null {
  const parts: string[] = [], fp: string[] = [];
  const vs = (code: string, geo: string, cmpGeo: string, label: string, emoji: string, tail = "") => {
    const o = latest(s[code], geo);
    if (!o) return;
    const c = at(s[code], cmpGeo, o.period);
    const cmp = c ? ` vs ${pct(c.value)} ${cmpGeo === "EA" ? "in the euro area" : "in the EU"}` : "";
    parts.push(`${emoji} ${label}: ${pct(o.value)}${tail}${cmp} (${periodLabel(o.period)})`);
    fp.push(`${code}:${o.period}`);
  };
  vs("gdp_growth", "CY", "EU27_2020", "Real GDP growth", "📈", " year on year");
  vs("hicp_all", "CY", "EA", "Inflation", "🛒");
  vs("unemployment", "CY", "EU27_2020", "Unemployment", "👷");
  if (parts.length < 2) return null;
  return {
    topic: "cyprus-economy", fingerprint: fp.join("|"), headline: "How the Cyprus economy is doing: the latest official figures",
    lines: parts, source: "Eurostat", path: "/economy", image: img("cyprus-economy"), hashtags: ["#Cyprus", "#Economy", "#Data"],
  };
}

export function cyprusBankingPost(s: SeriesMap): DataPost | null {
  const parts: string[] = [], fp: string[] = [];
  const rate = (code: string, label: string, emoji: string) => {
    const o = latest(s[code], "CY");
    if (!o) return;
    const ea = at(s[code], "EA", o.period);
    parts.push(`${emoji} ${label}: ${pct(o.value, 2)} a year${ea ? ` (euro area ${pct(ea.value, 2)})` : ""}, ${periodLabel(o.period)}`);
    fp.push(`${code}:${o.period}`);
  };
  rate("cbc_rate_mortgage", "New mortgage rate", "🏠");
  rate("cbc_rate_deposit", "Household deposit rate", "🏦");
  const stock = (code: string, label: string, emoji: string) => {
    const o = latest(s[code], "CY");
    if (!o) return;
    const y = yoyPhrase(o.value, at(s[code], "CY", yearEarlier(o.period))?.value);
    parts.push(`${emoji} ${label}: €${num(o.value)} million (${periodLabel(o.period)}${y ? `, ${y}` : ""})`);
    fp.push(`${code}:${o.period}`);
  };
  stock("cbc_hh_deposits", "Household deposits", "💶");
  stock("cbc_hh_housing_loans", "Household housing loans", "🔑");
  if (parts.length < 2) return null;
  return {
    topic: "cyprus-banking", fingerprint: fp.join("|"), headline: "Cyprus banking: household loans, deposits and interest rates",
    lines: parts, source: "Central Bank of Cyprus, ECB", path: "/economy", image: img("cyprus-banking"), hashtags: ["#Cyprus", "#Banking", "#Data"],
  };
}

const DISTRICT_NAMES: Record<string, string> = { NICOSIA: "Nicosia", LIMASSOL: "Limassol", LARNACA: "Larnaca", PAPHOS: "Paphos", FAMAGUSTA: "Famagusta" };

/** Property sale contracts: rows of { period (YYYY-MM), district, count }. */
export function cyprusPropertyPost(rows: { period: string; district: string; count: number }[]): DataPost | null {
  const byPeriod = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!Number.isFinite(r.count)) continue;
    const m = byPeriod.get(r.period) ?? new Map<string, number>();
    m.set(r.district, (m.get(r.district) ?? 0) + r.count);
    byPeriod.set(r.period, m);
  }
  const periods = [...byPeriod.keys()].sort();
  const last = periods.at(-1);
  if (!last) return null;
  const cur = byPeriod.get(last)!;
  // Every district must have reported, or the island total would be understated.
  if (cur.size < 5) return null;
  const total = [...cur.values()].reduce((a, b) => a + b, 0);
  const prev = byPeriod.get(yearEarlier(last));
  const prevTotal = prev && prev.size >= 5 ? [...prev.values()].reduce((a, b) => a + b, 0) : undefined;
  const y = yoyPhrase(total, prevTotal);
  const ranked = [...cur.entries()].sort((a, b) => b[1] - a[1]);
  const lines = [
    `🏠 ${num(total)} property sale contracts filed in ${periodLabel(last)}${y ? `, ${y}` : ""}`,
    `📍 Busiest districts: ${ranked.slice(0, 3).map(([d, n]) => `${DISTRICT_NAMES[d] ?? d} ${num(n)}`).join(" · ")}`,
  ];
  return {
    topic: "cyprus-property", fingerprint: `re:${last}`, headline: `Cyprus property market: ${periodLabel(last)} sales`,
    lines, source: "Department of Lands and Surveys", path: "/real-estate", image: img("cyprus-property"),
    hashtags: ["#Cyprus", "#RealEstate", "#Property"],
  };
}

/** Monthly tourist arrivals (island total), rows of { period (YYYY-MM), arrivals }. */
export function cyprusTourismPost(rows: { period: string; arrivals: number }[]): DataPost | null {
  const by = new Map(rows.filter((r) => Number.isFinite(r.arrivals)).map((r) => [r.period, r.arrivals]));
  const last = [...by.keys()].sort().at(-1);
  if (!last) return null;
  const cur = by.get(last)!;
  const lines = [`✈️ ${num(cur)} tourist arrivals in ${periodLabel(last)}${(() => { const y = yoyPhrase(cur, by.get(yearEarlier(last))); return y ? `, ${y}` : ""; })()}`];
  // Year to date, only when every month of both years is present.
  const [yr, mo] = last.split("-").map(Number);
  const months = Array.from({ length: mo }, (_, i) => String(i + 1).padStart(2, "0"));
  const ytd = months.map((m) => by.get(`${yr}-${m}`));
  const ytdPrev = months.map((m) => by.get(`${yr - 1}-${m}`));
  if (mo > 1 && ytd.every((v) => v !== undefined) && ytdPrev.every((v) => v !== undefined)) {
    const a = ytd.reduce((s, v) => s + v!, 0), b = ytdPrev.reduce((s, v) => s + v!, 0);
    const y = yoyPhrase(a, b);
    lines.push(`📅 January–${MONTHS[mo - 1]} ${yr}: ${num(a)} arrivals${y ? `, ${y.replace("on a year earlier", "on the same months of " + (yr - 1))}` : ""}`);
  }
  return {
    topic: "cyprus-tourism", fingerprint: `tour:${last}`, headline: `Cyprus tourism: ${periodLabel(last)} arrivals`,
    lines, source: "CYSTAT", path: "/tourism", image: img("cyprus-tourism"), hashtags: ["#Cyprus", "#Tourism", "#Data"],
  };
}

export interface CpiInput {
  year: number;
  countries: number | null;
  euAvg: number | null;
  results: { iso3: string; score: number; rank: number | null; tied: boolean | null }[];
}

export function integrityPost(c: CpiInput | null): DataPost | null {
  if (!c) return null;
  const cy = c.results.find((r) => r.iso3 === "CYP"), gr = c.results.find((r) => r.iso3 === "GRC");
  if (!cy && !gr) return null;
  const place = (r: CpiInput["results"][number]) => r.rank ? `, ${r.tied ? "tied " : ""}${r.rank}${ordinal(r.rank)}${c.countries ? ` of ${c.countries}` : ""}` : "";
  const lines: string[] = [];
  if (cy) lines.push(`🇨🇾 Cyprus: ${cy.score}/100${place(cy)}`);
  if (gr) lines.push(`🇬🇷 Greece: ${gr.score}/100${place(gr)}`);
  if (c.euAvg !== null) lines.push(`🇪🇺 EU average: ${c.euAvg}/100`);
  return {
    topic: "integrity", fingerprint: `cpi:${c.year}`, headline: `Corruption Perceptions Index ${c.year}: how Cyprus and Greece score`,
    lines, source: "Transparency International", path: "/research/corruption-perceptions/international", image: img("integrity"),
    hashtags: ["#Cyprus", "#Greece", "#Transparency"], onlyWhenNew: true,
  };
}

function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
}

/** Link to the data page, tagged so visits from these posts can be counted. */
export function dataLink(p: DataPost, platform: string): string {
  const sep = p.path.includes("?") ? "&" : "?";
  return `${SITE_URL}${p.path}${sep}utm_source=${platform}&utm_medium=social&utm_campaign=daily-data`;
}

/** Full text for Facebook and LinkedIn. */
export function longMessage(p: DataPost, platform: "facebook" | "linkedin"): string {
  return [p.headline, "", ...p.lines, "", `Source: ${p.source}.`, `All the figures: ${dataLink(p, platform)}`, "", p.hashtags.join(" ")].join("\n");
}

/** X post: headline + as many figure lines as fit in 280 characters (links count as 23). */
export function shortMessage(p: DataPost): string {
  const link = dataLink(p, "x");
  const fixed = 23 + 2; // link + blank line before it
  let text = p.headline;
  if (text.length + fixed > 280) text = text.slice(0, 280 - fixed - 1).trimEnd() + "…";
  for (const l of p.lines) {
    const next = `${text}\n${l}`;
    if (next.length + fixed <= 280) text = next; else break;
  }
  return `${text}\n\n${link}`;
}

/**
 * Today's topic: a topic with a new release first (the one posted longest ago),
 * otherwise a rerun of the topic posted longest ago. Never the same topic two days running
 * while another is available; annual topics only when their edition is new.
 */
export function chooseTopic(posts: DataPost[], history: HistoryRow[]): DataPost | null {
  const done = history.filter((h) => (h.status ?? "posted") === "posted");
  const lastAt = (t: string) => Math.max(-Infinity, ...done.filter((h) => h.topic === t).map((h) => Date.parse(h.created_at)));
  const newest = [...done].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const seen = new Set(done.map((h) => `${h.topic}|${h.fingerprint}`));
  const byOldest = (list: DataPost[]) => [...list].sort((a, b) => lastAt(a.topic) - lastAt(b.topic));
  const notYesterday = (list: DataPost[]) => {
    const other = list.filter((p) => p.topic !== newest?.topic);
    return other.length ? other : list;
  };
  const fresh = posts.filter((p) => !seen.has(`${p.topic}|${p.fingerprint}`));
  if (fresh.length) return byOldest(notYesterday(fresh))[0];
  const reruns = posts.filter((p) => !p.onlyWhenNew);
  if (!reruns.length) return null;
  return byOldest(notYesterday(reruns))[0];
}

/** Rows (posted or failed) made on the same Cyprus calendar day as `now`. */
export function rowsToday<T extends { created_at: string }>(rows: T[], now: Date): T[] {
  const today = cyprusClock(now).date;
  return rows.filter((r) => cyprusClock(new Date(r.created_at)).date === today);
}
