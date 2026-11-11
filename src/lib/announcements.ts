import type { Lang } from "@/lib/academy";

export type Section = "listed" | "deals";
export type Announcement = {
  id: string; slug: string; section: Section; announcement_type: string; status: string;
  company_name: string; directory_company_id: string | null; suggested_company_id: string | null; company_match_status: string;
  title: string; original_title: string | null; summary: string | null; sector: string | null; source_language: string | null;
  source_published_at: string | null; event_date: string | null; canonical_url: string | null; primary_source_url: string | null;
  discovery_url: string | null; primary_verified: boolean; ingested_at: string; source_id: string | null; external_ids: string[];
  amount: number | null; currency: string | null; investors: string[]; buyer: string | null; deal_stage: string | null;
  cyprus_location: string | null; cyprus_tags: string[]; tags: string[]; routing_note: string | null; merged_into: string | null;
  published_at: string | null; created_at: string; updated_at: string;
};
export type AnnouncementLink = { id: string; announcement_id: string; url: string; role: string; language: string | null; source_name: string | null; title: string | null; published_at: string | null };
export type TimelineEntry = { id: string; announcement_id: string; entry_date: string | null; stage: string | null; title: string; summary: string | null; source_url: string | null };

type L = { en: string; el: string };
export const TYPE_LABEL: Record<string, L> = {
  financial_results: { en: "Financial results", el: "Οικονομικά αποτελέσματα" },
  dividend: { en: "Dividend", el: "Μέρισμα" },
  buyback: { en: "Share buyback", el: "Επαναγορά μετοχών" },
  shareholding: { en: "Major shareholding", el: "Σημαντική συμμετοχή" },
  acquisition: { en: "Acquisition", el: "Εξαγορά" },
  board: { en: "Board & management", el: "Διοικητικό συμβούλιο" },
  funding_round: { en: "Funding round", el: "Γύρος χρηματοδότησης" },
  strategic_investment: { en: "Strategic investment", el: "Στρατηγική επένδυση" },
  project_expansion: { en: "Project / expansion", el: "Έργο / επέκταση" },
  other: { en: "Other", el: "Άλλο" },
};
export const LISTED_TYPE_KEYS = ["financial_results", "dividend", "buyback", "shareholding", "acquisition", "board"];
export const DEAL_TYPE_KEYS = ["funding_round", "strategic_investment", "acquisition", "project_expansion"];
export const STAGE_LABEL: Record<string, L> = {
  announced: { en: "Announced", el: "Ανακοινώθηκε" }, signed: { en: "Signed", el: "Υπογράφηκε" },
  completed: { en: "Completed", el: "Ολοκληρώθηκε" }, cancelled: { en: "Cancelled", el: "Ακυρώθηκε" },
};
export const CY_TAG_LABEL: Record<string, L> = {
  listed_in_cyprus: { en: "Listed in Cyprus", el: "Εισηγμένη στην Κύπρο" },
  based_in_cyprus: { en: "Based in Cyprus", el: "Με έδρα την Κύπρο" },
  founded_in_cyprus: { en: "Founded in Cyprus", el: "Ιδρύθηκε στην Κύπρο" },
  investing_in_cyprus: { en: "Investing in Cyprus", el: "Επενδύει στην Κύπρο" },
};
export const UI: Record<string, L> = {
  pageTitle: { en: "Company Announcements", el: "Εταιρικές Ανακοινώσεις" },
  intro: { en: "Official disclosures from Cyprus-listed companies and publicly announced funding and investment deals, each with its source.", el: "Επίσημες ανακοινώσεις εισηγμένων εταιρειών της Κύπρου και δημόσια ανακοινωμένες συμφωνίες χρηματοδότησης και επενδύσεων, με την πηγή τους." },
  listed: { en: "Listed Company Disclosures", el: "Ανακοινώσεις Εισηγμένων" },
  deals: { en: "Funding & Investment Deals", el: "Χρηματοδοτήσεις & Επενδύσεις" },
  search: { en: "Search company, buyer or investor", el: "Αναζήτηση εταιρείας, αγοραστή ή επενδυτή" },
  allTypes: { en: "All types", el: "Όλοι οι τύποι" }, allSectors: { en: "All sectors", el: "Όλοι οι τομείς" },
  allStages: { en: "All stages", el: "Όλα τα στάδια" }, allTags: { en: "Any Cyprus connection", el: "Κάθε σύνδεση με Κύπρο" },
  anyDate: { en: "Any date", el: "Οποτεδήποτε" }, d30: { en: "Last 30 days", el: "Τελευταίες 30 ημέρες" }, d90: { en: "Last 90 days", el: "Τελευταίες 90 ημέρες" }, d365: { en: "Last 12 months", el: "Τελευταίοι 12 μήνες" },
  none: { en: "No announcements match these filters yet.", el: "Δεν υπάρχουν ανακοινώσεις για αυτά τα φίλτρα." },
  amount: { en: "Amount", el: "Ποσό" }, investors: { en: "Investors", el: "Επενδυτές" }, buyer: { en: "Buyer", el: "Αγοραστής" },
  stage: { en: "Stage", el: "Στάδιο" }, location: { en: "Cyprus location", el: "Τοποθεσία" }, source: { en: "Source", el: "Πηγή" },
  sources: { en: "Sources", el: "Πηγές" }, timeline: { en: "Timeline", el: "Χρονολόγιο" }, related: { en: "Related BusinessHub coverage", el: "Σχετική κάλυψη BusinessHub" },
  profile: { en: "Company profile", el: "Προφίλ εταιρείας" }, back: { en: "All announcements", el: "Όλες οι ανακοινώσεις" },
  verified: { en: "Primary source verified", el: "Επαληθευμένη πρωτογενής πηγή" }, reported: { en: "Reported — primary source not yet confirmed", el: "Αναφέρθηκε — η πρωτογενής πηγή δεν έχει επιβεβαιωθεί" },
  summaryNote: { en: "Summary written by BusinessHub. Read the original filing for full details.", el: "Περίληψη από το BusinessHub. Δείτε την πρωτότυπη ανακοίνωση για όλες τις λεπτομέρειες." },
  published: { en: "Published", el: "Δημοσιεύθηκε" }, eventDate: { en: "Event date", el: "Ημερομηνία γεγονότος" }, original: { en: "Original title", el: "Αρχικός τίτλος" },
  primary: { en: "Primary source", el: "Πρωτογενής πηγή" }, supporting: { en: "Supporting source", el: "Συμπληρωματική πηγή" }, discovery: { en: "Where we found it", el: "Πού το βρήκαμε" },
  companyAnnouncements: { en: "Announcements", el: "Ανακοινώσεις" }, viewAll: { en: "View all", el: "Όλες" },
};
export const t = (key: keyof typeof UI | string, lang: Lang) => (UI[key] ? UI[key][lang] : key);
export const label = (map: Record<string, L>, key: string | null | undefined, lang: Lang) => (key && map[key] ? map[key][lang] : key ?? "");

const SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };
/** Amount in its original currency, compact; "Not disclosed" when no amount was announced */
export function formatDealAmount(amount: number | null | undefined, currency: string | null | undefined, lang: Lang = "en"): string {
  if (amount == null || !isFinite(amount) || amount <= 0) return lang === "el" ? "Δεν ανακοινώθηκε" : "Not disclosed";
  const abs = amount;
  const [v, unit] = abs >= 1e9 ? [abs / 1e9, "bn"] : abs >= 1e6 ? [abs / 1e6, "m"] : abs >= 1e3 ? [abs / 1e3, "k"] : [abs, ""];
  const num = `${Number(v.toFixed(v >= 100 ? 0 : 1))}${unit}`;
  const code = (currency || "").toUpperCase();
  return SYMBOL[code] ? `${SYMBOL[code]}${num}` : code ? `${code} ${num}` : num;
}

export const announcementDate = (a: Pick<Announcement, "source_published_at" | "created_at">) => a.source_published_at ?? a.created_at;
export const fmtDate = (d: string | null | undefined, lang: Lang) => (d ? new Date(d).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
