export * from "../../supabase/functions/_shared/funding";
import type { CallState } from "../../supabase/functions/_shared/funding";

export type Lang = "en" | "el";
/** Signed-out visitors see exactly this many editor-picked calls. */
export const PREVIEW_LIMIT = 3;
export const RETURN_KEY = "bh_return_to";

type L = Record<string, { en: string; el: string }>;
export const SECTORS: L = {
  tourism: { en: "Tourism & hospitality", el: "Τουρισμός & φιλοξενία" },
  research_innovation: { en: "Research & innovation", el: "Έρευνα & καινοτομία" },
  digital: { en: "Digital & cyber", el: "Ψηφιακά & κυβερνοασφάλεια" },
  energy: { en: "Energy", el: "Ενέργεια" },
  environment_climate: { en: "Environment & climate", el: "Περιβάλλον & κλίμα" },
  sme_business: { en: "SMEs & business", el: "ΜμΕ & επιχειρήσεις" },
  agriculture: { en: "Agriculture & rural", el: "Γεωργία & ύπαιθρος" },
  fisheries: { en: "Fisheries & aquaculture", el: "Αλιεία & υδατοκαλλιέργεια" },
  culture: { en: "Culture & creative", el: "Πολιτισμός & δημιουργικότητα" },
  education_training: { en: "Education & training", el: "Εκπαίδευση & κατάρτιση" },
  employment: { en: "Employment", el: "Απασχόληση" },
  health: { en: "Health", el: "Υγεία" },
  transport: { en: "Transport", el: "Μεταφορές" },
  other: { en: "Other", el: "Άλλο" },
};
export const INSTRUMENTS: L = {
  grant: { en: "Grant", el: "Επιχορήγηση" }, subsidy: { en: "Subsidy", el: "Επιδότηση" }, voucher: { en: "Voucher", el: "Κουπόνι" },
  loan: { en: "Loan", el: "Δάνειο" }, guarantee: { en: "Guarantee", el: "Εγγύηση" }, equity: { en: "Equity", el: "Συμμετοχή στο κεφάλαιο" },
  prize: { en: "Prize", el: "Βραβείο" }, tax_incentive: { en: "Tax incentive", el: "Φορολογικό κίνητρο" }, other: { en: "Other instrument", el: "Άλλο μέσο" },
};
export const APPLICANTS: L = {
  sme: { en: "SMEs", el: "ΜμΕ" }, large_enterprise: { en: "Large companies", el: "Μεγάλες επιχειρήσεις" }, startup: { en: "Start-ups", el: "Νεοφυείς" },
  research_org: { en: "Research organisations", el: "Ερευνητικοί οργανισμοί" }, university: { en: "Universities", el: "Πανεπιστήμια" },
  public_body: { en: "Public bodies", el: "Δημόσιοι φορείς" }, ngo: { en: "NGOs", el: "ΜΚΟ" }, individual: { en: "Individuals", el: "Ιδιώτες" },
  farmer: { en: "Farmers", el: "Γεωργοί" }, any: { en: "Any eligible entity", el: "Κάθε επιλέξιμος φορέας" },
};
export const GEOGRAPHY: L = {
  cyprus: { en: "Cyprus", el: "Κύπρος" }, eu: { en: "EU-wide", el: "Πανευρωπαϊκό" },
  cross_border: { en: "Cross-border", el: "Διασυνοριακό" }, international: { en: "International", el: "Διεθνές" },
};
export const VIEWS: Record<CallState, { en: string; el: string }> = {
  open: { en: "Open", el: "Ανοικτές" }, upcoming: { en: "Upcoming", el: "Προσεχώς" },
  ongoing: { en: "Ongoing (no fixed deadline)", el: "Συνεχείς" }, closed: { en: "Closed", el: "Έκλεισαν" },
};

export const lbl = (map: L, key: string | null | undefined, lang: Lang) => (key ? map[key]?.[lang] ?? key : "");

/** Deadline as published: a date alone stays a date; a time is shown only when the issuer gave one. */
export function formatDeadline(date: string | null | undefined, time: string | null | undefined, lang: Lang): string {
  if (!date) return lang === "el" ? "Χωρίς σταθερή προθεσμία" : "No fixed deadline";
  const [y, m, d] = date.split("-").map(Number);
  const s = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return time ? `${s}, ${time}` : s;
}

export function formatEur(n: number | null | undefined): string | null {
  if (n == null) return null;
  return "€" + (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}m` : Number(n).toLocaleString("en-GB"));
}

export interface FundingFilters { view: CallState; q: string; sector: string; applicant: string; instrument: string; geography: string; programme: string; within: string }

export function readFilters(sp: URLSearchParams): FundingFilters {
  const v = sp.get("view");
  return {
    view: (v === "upcoming" || v === "ongoing" || v === "closed" ? v : "open") as CallState,
    q: sp.get("q") ?? "", sector: sp.get("sector") ?? "", applicant: sp.get("applicant") ?? "", instrument: sp.get("type") ?? "",
    geography: sp.get("geo") ?? "", programme: sp.get("programme") ?? "", within: sp.get("within") ?? "",
  };
}

/** Days → last date that still counts for the "deadline within" filter. */
export function deadlineCutoff(within: string, today: Date = new Date()): string | null {
  const days = Number(within);
  if (!days) return null;
  const d = new Date(today.getTime() + days * 86400_000);
  return d.toISOString().slice(0, 10);
}

/** Where /explore/funding sends people: the same shared records, filtered to Tourism. */
export const TOURISM_FUNDING_HREF = "/funding?sector=tourism";
