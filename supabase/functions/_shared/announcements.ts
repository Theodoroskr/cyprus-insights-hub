// Company Announcements: pure rules shared by the importer, the news scraper and unit tests.
// No network or database access in this file.

export type AnnouncementType =
  | "financial_results" | "dividend" | "buyback" | "shareholding" | "acquisition" | "board"
  | "funding_round" | "strategic_investment" | "project_expansion" | "other";
export type NewsVertical = "general" | "sme" | "fintech" | "compliance" | "regtech";

export const LISTED_TYPES: AnnouncementType[] = ["financial_results", "dividend", "buyback", "shareholding", "acquisition", "board"];
export const DEAL_TYPES: AnnouncementType[] = ["funding_round", "strategic_investment", "acquisition", "project_expansion"];
export const DEAL_STAGES = ["announced", "signed", "completed", "cancelled"] as const;
export const CYPRUS_TAGS = ["listed_in_cyprus", "based_in_cyprus", "founded_in_cyprus", "investing_in_cyprus"] as const;

// ---------- Cyprus Stock Exchange (OAM) disclosures ----------

/** CSE OAM information categories that map straight to a disclosure type */
const OAM_CATEGORY_TYPES: Record<number, AnnouncementType> = {
  16: "financial_results", 19: "financial_results", 20: "financial_results", 21: "financial_results",
  22: "financial_results", 34: "financial_results", 35: "financial_results", 27: "financial_results",
  28: "dividend",
  49: "buyback", 50: "buyback",
  44: "shareholding", 45: "shareholding", 47: "shareholding", 48: "shareholding",
  26: "acquisition", 30: "acquisition", 32: "acquisition",
  31: "board",
};

/** Notices about an upcoming meeting or date, not the disclosure itself */
const NOTICE_ONLY = /\b(date of (the )?announcement|meeting of the board|board meeting|examination of (the )?(h\d|first|financial)|convening|notice of (the )?(agm|egm|general meeting)|financial calendar|dispersion|pdmr|disclosure of transactions)\b/i;

/** Classify an exchange or issuer announcement; null = not a type this section covers */
export function classifyDisclosure(categoryId: number | null | undefined, title: string): AnnouncementType | null {
  const t = (title || "").toLowerCase();
  if (categoryId != null && OAM_CATEGORY_TYPES[categoryId]) return OAM_CATEGORY_TYPES[categoryId];
  if (categoryId === 46 || categoryId === 56 || categoryId === 42 || categoryId === 43) return null;
  if (NOTICE_ONLY.test(t)) return null;
  if (/dividend|μέρισμα/.test(t)) return "dividend";
  if (/own shares|buy-?back|repurchase|επαναγορ/.test(t)) return "buyback";
  if (/major hold|tr-1|notification of (the )?acquisition or disposal of major|significant (share)?holding/.test(t)) return "shareholding";
  if (/acqui|merger|takeover|tender offer|disposal of|sale of (its |the )?(stake|subsidiary|shares in)|εξαγορ|συγχώνευσ/.test(t)) return "acquisition";
  if (/results|financial statements|financial report|interim report|quarterly report|profit warning|trading update|αποτελέσματα|οικονομικές καταστάσεις/.test(t)) return "financial_results";
  if (/appointment|resignation|director|board of directors|board committees|chief executive|\bceo\b|\bcfo\b|senior executive|top management|διορισμ|παραίτησ/.test(t)) return "board";
  return null;
}

export type OamItem = {
  id: number;
  translationId?: number | null;
  referencedListingId?: number | null;
  name?: string | null;
  nameEnglish?: string | null;
  publicationTimestamp: number;
  informationCategoryId?: number | null;
  infoLanguagesNameEn?: string | null;
  industriesName?: string | null;
  versionContent?: string | null;
  translationVersionContent?: string | null;
};

export type OamGroup = {
  members: OamItem[];
  /** The member that carries the English text (or the only member) */
  english: OamItem;
  /** The first-filed member (its language is the source language) */
  original: OamItem;
  publishedAt: number;
};

/** Greek and English versions (and corrections) of one filing are linked by translationId / referencedListingId */
export function groupOamItems(items: OamItem[]): OamGroup[] {
  const parent = new Map<number, number>();
  const find = (x: number): number => { let r = x; while (parent.get(r) !== undefined && parent.get(r) !== r) r = parent.get(r)!; parent.set(x, r); return r; };
  const ids = new Set(items.map((i) => i.id));
  for (const i of items) parent.set(i.id, i.id);
  const union = (a: number, b: number) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  for (const i of items) {
    if (i.translationId && ids.has(i.translationId)) union(i.id, i.translationId);
    if (i.referencedListingId && ids.has(i.referencedListingId)) union(i.id, i.referencedListingId);
  }
  const groups = new Map<number, OamItem[]>();
  for (const i of items) { const r = find(i.id); groups.set(r, [...(groups.get(r) ?? []), i]); }
  return [...groups.values()].map((members) => {
    members.sort((a, b) => a.publicationTimestamp - b.publicationTimestamp || a.id - b.id);
    const english = members.find((m) => /english/i.test(m.infoLanguagesNameEn ?? "")) ?? members.find((m) => !isGreekText(m.nameEnglish ?? "")) ?? members[0];
    return { members, english, original: members[0], publishedAt: members[0].publicationTimestamp };
  }).sort((a, b) => b.publishedAt - a.publishedAt);
}

export const oamCardUrl = (item: Pick<OamItem, "id" | "translationId">) =>
  `https://publicoam.cse.com.cy/card-details/${item.id}/${item.translationId || 0}tr`;

export const oamLanguage = (item: OamItem) => (/greek/i.test(item.infoLanguagesNameEn ?? "") ? "el" : "en");

// ---------- duplicates ----------

export const isGreekText = (s: string) => /[\u0370-\u03FF]/.test(s || "");

const STOP = new Set(["the", "of", "and", "for", "to", "a", "an", "in", "on", "by", "at", "with", "plc", "ltd", "public", "company", "limited", "group", "announcement", "s", "re"]);
export function titleTokens(s: string): Set<string> {
  return new Set((s || "").toLowerCase().replace(/[^a-z0-9α-ω\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)));
}
export function titleSimilarity(a: string, b: string): number {
  const A = titleTokens(a), B = titleTokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export type EventKey = { companyKey: string; type: AnnouncementType; date: string; title: string };
const dayDiff = (a: string, b: string) => Math.abs(Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / 86400000;

/**
 * Same company + same type + close dates (+ similar title) = one event.
 * Buybacks are reported daily, so they only match on the exact same date.
 */
export function isSameEvent(a: EventKey, b: EventKey): boolean {
  if (!a.companyKey || a.companyKey !== b.companyKey || a.type !== b.type) return false;
  const diff = dayDiff(a.date, b.date);
  const window = a.type === "buyback" ? 0 : a.type === "funding_round" || a.type === "acquisition" || a.type === "strategic_investment" || a.type === "project_expansion" ? 14 : 3;
  if (diff > window) return false;
  const sim = titleSimilarity(a.title, b.title);
  return sim >= 0.3 || (diff === 0 && a.type !== "board");
}

// ---------- association news routing ----------

export type Route = { vertical: NewsVertical; dealReview: boolean; reason: string };

const AMOUNT = /(€|eur\b|euro|\$|usd|£|gbp)\s?\d[\d.,]*\s?(k|m|bn|mn|million|billion|εκατ)?|\d[\d.,]*\s?(million|billion|εκατομμύρια|εκατ\.?)\s?(euro|eur|€|usd|dollars|ευρώ)?/i;
const TRANSACTION = /\b(acquires|acquired|has acquired|completes? (the )?acquisition|acquisition of|takeover of|merger (with|of|between)|raises|raised|closes? (a |its )?.{0,20}round|funding round|seed round|pre-seed|series [a-e]\b|invests?|invested|investment (of|worth|project)|new (plant|factory|facility|headquarters|hotel|data cent(re|er))|expan(sion|ds) (of|into|its)|εξαγορ|επένδυσ)/i;
const ROUTINE = /\b(memorandum of understanding|\bmou\b|trade forum|business forum|expressions? of interest|trade mission|business delegation|delegation|webinar|seminar|conference|networking|b2b meetings?|partnership agreement|cooperation agreement|μνημόνιο|επιχειρηματική αποστολή|φόρουμ)\b/i;

/** A specific investment, transaction or qualifying expansion (not a forum, MoU or routine partnership) */
export function looksLikeDeal(text: string): boolean {
  const t = text || "";
  if (!TRANSACTION.test(t)) return false;
  const hasAmount = AMOUNT.test(t);
  if (ROUTINE.test(t)) return hasAmount && /\b(acqui|invest|raise|round)/i.test(t);
  return hasAmount || /\b(acquires|acquired|has acquired|acquisition of|takeover of|raises|raised|series [a-e]\b|seed round)\b/i.test(t);
}

export function classifyDealType(text: string): AnnouncementType {
  const t = (text || "").toLowerCase();
  if (/acqui|takeover|merger|εξαγορ|buys\b/.test(t)) return "acquisition";
  if (/round|raises|raised|seed|series [a-e]\b|venture|funding/.test(t)) return "funding_round";
  if (/plant|factory|facility|expan|project|hotel|headquarters|data cent/.test(t)) return "project_expansion";
  return "strategic_investment";
}

/**
 * Per-item routing for association sources (content_sources.routing_profile).
 * Returns null for sources without a routing profile.
 */
export function routeSourceItem(profile: string | null | undefined, title: string, body = ""): Route | null {
  if (!profile) return null;
  const text = `${title}\n${body}`;
  const deal = looksLikeDeal(text);
  switch (profile) {
    case "ccci":
      return { vertical: "general", dealReview: deal, reason: deal ? "Named investment project — flagged for deal review" : "Chamber news (trade missions, delegations, partnerships) → Business News" };
    case "oeb": {
      const sme = /\b(sme|smes|small (and medium|business)|entrepreneur|grant|scheme|subsid|training|vat|μικρομεσαί|σχέδιο)\b/i.test(text);
      return { vertical: sme ? "sme" : "general", dealReview: false, reason: sme ? "Employer update for small firms → SME Resources" : "Employer update / policy / consultation → Business News" };
    }
    case "citea":
      return { vertical: "fintech", dealReview: deal, reason: deal ? "Specific funding round, acquisition or expansion — flagged for deal review" : "Technology partnership / ecosystem news → Technology News" };
    case "icpac":
      return { vertical: "compliance", dealReview: false, reason: "ICPAC notice (sanctions, AML, audit, accounting) → ComplianceHub" };
    case "cybar":
      return { vertical: "compliance", dealReview: false, reason: "Bar Association notice (legal, AML, FATF, administrative services) → ComplianceHub" };
    default:
      return null;
  }
}

/** `{year}` in a source path is replaced with the current (or configured) archive year */
export const resolveSourcePath = (path: string, now = new Date()) => (path || "").replace(/\{year\}/g, String(now.getUTCFullYear()));

export const industryLabel = (s?: string | null) => (s || "").replace(/^\d+-/, "").trim() || null;
