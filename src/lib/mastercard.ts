import { supabase } from "@/integrations/supabase/client";

export const INFOCREDIT_URL = "https://www.infocreditgroup.com";

/** Must match the list accepted by the enquiry backend. */
export const INTERESTS = [
  "Mastercard SpendingPulse", "Consumer Spending Intelligence", "Retail Market Analytics",
  "Tourism Spending Intelligence", "Economic Research", "Sector Benchmarking", "Other Mastercard Solutions",
] as const;
export type Interest = (typeof INTERESTS)[number];

export const INTERESTS_EL: Record<Interest, string> = {
  "Mastercard SpendingPulse": "Mastercard SpendingPulse",
  "Consumer Spending Intelligence": "Ανάλυση καταναλωτικών δαπανών",
  "Retail Market Analytics": "Αναλύσεις λιανικής αγοράς",
  "Tourism Spending Intelligence": "Ανάλυση τουριστικών δαπανών",
  "Economic Research": "Οικονομική έρευνα",
  "Sector Benchmarking": "Συγκριτική ανάλυση κλάδων",
  "Other Mastercard Solutions": "Άλλες λύσεις Mastercard",
};

export const INDUSTRIES = [
  "Banking & Financial Services", "Retail", "Shopping Centres", "Hospitality & Tourism", "Real Estate & Property Development",
  "Investment", "Market Research", "Government & Public Sector", "Technology", "Professional Services", "Other",
];

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_requested", label: "Proposal Requested" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
] as const;

export const RESEARCH_CATEGORIES = [
  "Economic Outlook", "Consumer Spending", "Retail Intelligence", "Tourism & Travel",
  "Digital Economy", "SME Trends", "Financial Services", "Market Research", "Economic Research",
];

export type Lang = "en" | "el";

/** Approved partner wording. Never call Infocredit an exclusive or authorised reseller. */
export const COPY = {
  en: {
    ctaTitle: "Unlock Deeper Economic & Consumer Spending Intelligence",
    ctaBody: "Explore Mastercard research and discover how additional market intelligence can support your business decisions.",
    fullTitle: "Need More Detailed Market Intelligence?",
    fullBody: "Access to additional Mastercard economic intelligence, consumer spending insights and specialised market analytics may be available through commercial arrangements.",
    fullContact: "Contact Infocredit Group, a local Mastercard partner in Cyprus, to discuss your requirements and available solutions.",
    partner: "Local Mastercard partner in Cyprus",
    request: "Request More Information",
    contact: "Contact Infocredit Group",
    explore: "Explore Mastercard research",
    disclaimer: "Availability of Mastercard data and solutions is subject to confirmation and applicable commercial arrangements.",
  },
  el: {
    ctaTitle: "Αποκτήστε Βαθύτερη Γνώση για την Οικονομία και τις Καταναλωτικές Δαπάνες",
    ctaBody: "Εξερευνήστε τις έρευνες της Mastercard και δείτε πώς πρόσθετα στοιχεία αγοράς μπορούν να στηρίξουν τις επιχειρηματικές σας αποφάσεις.",
    fullTitle: "Χρειάζεστε Πιο Αναλυτικά Στοιχεία Αγοράς;",
    fullBody: "Η πρόσβαση σε πρόσθετα οικονομικά δεδομένα της Mastercard, αναλύσεις καταναλωτικών δαπανών και εξειδικευμένες πληροφορίες αγοράς ενδέχεται να διατίθεται μέσω εμπορικών συμφωνιών.",
    fullContact: "Επικοινωνήστε με την Infocredit Group, τοπικό συνεργάτη της Mastercard στην Κύπρο, για να συζητήσουμε τις ανάγκες σας και τις διαθέσιμες λύσεις.",
    partner: "Τοπικός συνεργάτης της Mastercard στην Κύπρο",
    request: "Ζητήστε Περισσότερες Πληροφορίες",
    contact: "Επικοινωνία με Infocredit Group",
    explore: "Εξερευνήστε τις έρευνες Mastercard",
    disclaimer: "Η διαθεσιμότητα δεδομένων και λύσεων της Mastercard υπόκειται σε επιβεβαίωση και στις ισχύουσες εμπορικές συμφωνίες.",
  },
} as const;

/** Anonymous funnel counters (no personal data). Submissions are counted by the backend. */
const seenViews = new Set<string>();

export function trackCta(event: "view" | "open" | "outbound", placement: string, interest?: string) {
  if (event === "view") {
    const key = `${placement}|${window.location.pathname}`;
    if (seenViews.has(key)) return;
    seenViews.add(key);
  }
  // Query builders only run when awaited/then'd.
  supabase.from("cta_events").insert({ event, placement: placement.slice(0, 60), path: window.location.pathname.slice(0, 200), interest: interest ?? null }).then(() => {});
}

export function conversionRate(opens: number, submits: number): number | null {
  return opens > 0 ? Math.round((submits / opens) * 1000) / 10 : null;
}
