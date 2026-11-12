// ComplianceHub shared types, labels (English/Greek) and pure helpers.
import type { Lang } from "@/lib/academy";

export interface ComplianceItem {
  id: string; slug: string | null; status: string; sections: string[]; authority: string; jurisdiction: string;
  official_id: string | null; canonical_url: string; document_type: string; official_title: string;
  title_en: string | null; title_el: string | null; summary_en: string | null; summary_el: string | null;
  what_changed_en: string | null; what_changed_el: string | null; action_en: string | null; action_el: string | null;
  source_language: string; topics: string[]; sectors: string[];
  publication_date: string | null; application_date: string | null; effective_date: string | null;
  deadline_date: string | null; deadline_type: string | null; deadline_note: string | null;
  legal_act_ref: string | null; regime: string | null; measure_type: string | null; countries: string[];
  audience: string | null; related_acts: string[];
}
export interface ComplianceRef { id: string; item_id: string; authority: string; official_id: string | null; url: string; title: string | null; language: string; published_at: string | null; role: string }

export const PUBLIC_ITEM_COLUMNS = "id, slug, status, sections, authority, jurisdiction, official_id, canonical_url, document_type, official_title, title_en, title_el, summary_en, summary_el, what_changed_en, what_changed_el, action_en, action_el, source_language, topics, sectors, publication_date, application_date, effective_date, deadline_date, deadline_type, deadline_note, legal_act_ref, regime, measure_type, countries, audience, related_acts";

type L = { en: string; el: string };
export const TOPIC_LABELS: Record<string, L> = {
  aml_cft: { en: "AML/CFT", el: "ΚΞΧ/ΧΤ" }, sanctions: { en: "Sanctions", el: "Κυρώσεις" }, mica: { en: "MiCA / crypto-assets", el: "MiCA / κρυπτοστοιχεία" },
  dora: { en: "DORA", el: "DORA" }, licensing: { en: "Licensing", el: "Αδειοδότηση" }, regulatory_reporting: { en: "Regulatory reporting", el: "Εποπτικές αναφορές" },
  payments: { en: "Payments & e-money", el: "Πληρωμές & ηλεκτρονικό χρήμα" }, prudential: { en: "Prudential", el: "Προληπτική εποπτεία" },
  markets: { en: "Markets & funds", el: "Αγορές & ταμεία" }, governance: { en: "Governance", el: "Διακυβέρνηση" },
  consumer_protection: { en: "Consumer protection", el: "Προστασία καταναλωτή" }, other: { en: "Other", el: "Άλλο" },
};
export const PRIMARY_TOPICS = ["aml_cft", "sanctions", "mica", "dora", "licensing", "regulatory_reporting"];
export const SECTOR_LABELS: Record<string, L> = {
  cysec_supervised: { en: "CySEC-supervised entities", el: "Εποπτευόμενες από ΕΚΚ" }, banks: { en: "Banks", el: "Τράπεζες" },
  investment_firms: { en: "Investment firms", el: "ΚΕΠΕΥ" }, fund_managers: { en: "Funds & fund managers", el: "Ταμεία & διαχειριστές" },
  crypto_asset_providers: { en: "Crypto-asset providers", el: "Πάροχοι κρυπτοστοιχείων" }, payment_emi: { en: "Payment & e-money institutions", el: "Ιδρύματα πληρωμών & ηλ. χρήματος" },
  insurance: { en: "Insurance", el: "Ασφαλίσεις" }, administrative_service_providers: { en: "Administrative service providers", el: "Πάροχοι διοικητικών υπηρεσιών" },
  accountants_auditors: { en: "Accountants & auditors", el: "Λογιστές & ελεγκτές" }, lawyers: { en: "Lawyers", el: "Δικηγόροι" },
  gambling: { en: "Betting & gambling", el: "Στοιχηματισμός" }, real_estate: { en: "Real estate", el: "Ακίνητα" }, issuers: { en: "Listed issuers", el: "Εκδότες" },
  all_obliged_entities: { en: "All obliged entities", el: "Όλες οι υπόχρεες οντότητες" }, general_public: { en: "General public", el: "Ευρύ κοινό" },
};
export const DOC_TYPE_LABELS: Record<string, L> = {
  consultation: { en: "Consultation", el: "Διαβούλευση" }, draft_standard: { en: "Draft standard", el: "Σχέδιο προτύπου" },
  adopted_legislation: { en: "Adopted legislation", el: "Νομοθεσία" }, circular: { en: "Circular", el: "Εγκύκλιος" },
  guidance: { en: "Guidance", el: "Καθοδήγηση" }, announcement: { en: "Announcement", el: "Ανακοίνωση" }, decision: { en: "Decision", el: "Απόφαση" },
  report: { en: "Report", el: "Έκθεση" }, notice: { en: "Notice", el: "Ανακοίνωση" }, corrigendum: { en: "Corrigendum", el: "Διορθωτικό" },
};
export const DEADLINE_LABELS: Record<string, L> = {
  consultation_close: { en: "Consultation closes", el: "Λήξη διαβούλευσης" }, filing: { en: "Filing deadline", el: "Προθεσμία υποβολής" },
  application: { en: "Applies from", el: "Εφαρμόζεται από" }, effective: { en: "Takes effect", el: "Τίθεται σε ισχύ" }, other: { en: "Deadline", el: "Προθεσμία" },
};
export const MEASURE_LABELS: Record<string, L> = {
  new_regime: { en: "New measures", el: "Νέα μέτρα" }, listings: { en: "New listings", el: "Νέες καταχωρίσεις" }, delistings: { en: "Delistings", el: "Διαγραφές" },
  amendment: { en: "Amendment", el: "Τροποποίηση" }, extension: { en: "Extension", el: "Παράταση" }, sectoral: { en: "Sectoral measures", el: "Τομεακά μέτρα" },
  implementing: { en: "Implementing act", el: "Εκτελεστική πράξη" }, exemption: { en: "Exemption / derogation", el: "Εξαίρεση / παρέκκλιση" },
  corrigendum: { en: "Corrigendum", el: "Διορθωτικό" }, guidance: { en: "Guidance", el: "Καθοδήγηση" }, other: { en: "Other", el: "Άλλο" },
};
export const FATF_LABELS: Record<string, L> = {
  countermeasures: { en: "Call for action — countermeasures", el: "Έκκληση για δράση — αντίμετρα" },
  enhanced_due_diligence: { en: "Call for action — enhanced due diligence", el: "Έκκληση για δράση — ενισχυμένη δέουσα επιμέλεια" },
  increased_monitoring: { en: "Increased monitoring", el: "Αυξημένη παρακολούθηση" },
};
export const label = (map: Record<string, L>, key: string | null | undefined, lang: Lang) => (key && map[key] ? map[key][lang] : key ?? "");

/** UI strings; Greek falls back to English when missing. */
const EL: Record<string, string> = {
  "Overview": "Επισκόπηση", "Regulatory Updates": "Ρυθμιστικές Εξελίξεις", "Sanctions & Country Risk": "Κυρώσεις & Κίνδυνος Χωρών",
  "Deadlines & Consultations": "Προθεσμίες & Διαβουλεύσεις", "Guidance & Resources": "Καθοδήγηση & Πόροι",
  "Latest regulatory updates": "Πρόσφατες ρυθμιστικές εξελίξεις", "Recent sanctions changes": "Πρόσφατες αλλαγές στις κυρώσεις", "Upcoming deadlines": "Επερχόμενες προθεσμίες",
  "View all": "Όλα", "Official document": "Επίσημο έγγραφο", "Published": "Δημοσίευση", "Applies from": "Εφαρμόζεται από", "Effective": "Ισχύς",
  "Deadline": "Προθεσμία", "What changed": "Τι αλλάζει", "Action or deadline stated by the source": "Ενέργεια ή προθεσμία που αναφέρει η πηγή",
  "Affected sectors": "Επηρεαζόμενοι τομείς", "Topics": "Θέματα", "Official references": "Επίσημες παραπομπές", "Search": "Αναζήτηση",
  "All authorities": "Όλες οι αρχές", "All jurisdictions": "Όλες οι δικαιοδοσίες", "All sectors": "Όλοι οι τομείς", "All topics": "Όλα τα θέματα", "All document types": "Όλοι οι τύποι",
  "Nothing matches these filters yet.": "Δεν υπάρχουν ακόμη αποτελέσματα για αυτά τα φίλτρα.", "Summary in English": "Περίληψη στα αγγλικά", "Summary in Greek": "Περίληψη στα ελληνικά",
  "Summary not yet available — see the official document.": "Η περίληψη δεν είναι ακόμη διαθέσιμη — δείτε το επίσημο έγγραφο.",
  "EU Sanctions Updates": "Ενημερώσεις Κυρώσεων ΕΕ", "Cyprus Sanctions Guidance": "Καθοδήγηση Κυρώσεων Κύπρου", "FATF Country Risk": "Κίνδυνος Χωρών FATF", "Official Lists & Tools": "Επίσημοι Κατάλογοι & Εργαλεία",
  "Legal act": "Νομική πράξη", "Regime": "Καθεστώς", "Measure": "Μέτρο", "Country or territory": "Χώρα ή έδαφος", "Audience": "Αποδέκτες", "Related EU acts": "Σχετικές πράξεις ΕΕ",
  "Clear filters": "Καθαρισμός φίλτρων", "From": "Από", "To": "Έως", "All regimes": "Όλα τα καθεστώτα", "All measure types": "Όλοι οι τύποι μέτρων", "All countries": "Όλες οι χώρες", "All sources": "Όλες οι πηγές",
  "Added": "Προστέθηκαν", "Removed": "Αφαιρέθηκαν", "Category changed": "Αλλαγή κατηγορίας", "No change": "Καμία αλλαγή", "Release": "Έκδοση",
  "Compared with the previous verified release": "Σε σύγκριση με την προηγούμενη επαληθευμένη έκδοση", "Earlier releases": "Προηγούμενες εκδόσεις",
  "No upcoming deadlines have been confirmed yet.": "Δεν έχουν επιβεβαιωθεί ακόμη επερχόμενες προθεσμίες.", "Recently passed": "Πρόσφατα έληξαν",
  "Deadline type": "Τύπος προθεσμίας", "All deadline types": "Όλοι οι τύποι προθεσμιών", "Back to Regulatory Updates": "Επιστροφή στις Ρυθμιστικές Εξελίξεις",
  "Official title": "Επίσημος τίτλος", "Source publication date": "Ημερομηνία δημοσίευσης πηγής", "Document type": "Τύπος εγγράφου",
  "FATF status is shown separately from EU sanctions: a FATF listing is not a sanction.": "Η κατάσταση FATF εμφανίζεται χωριστά από τις κυρώσεις της ΕΕ: η καταχώριση από τη FATF δεν αποτελεί κύρωση.",
  "Information is for monitoring purposes and is not legal advice. Always rely on the official document.": "Οι πληροφορίες προορίζονται για παρακολούθηση και δεν αποτελούν νομική συμβουλή. Βασιστείτε πάντα στο επίσημο έγγραφο.",
};
export const ct = (s: string, lang: Lang) => (lang === "el" ? EL[s] ?? s : s);

/** Title in the chosen language; falls back to the other language, then the official title. */
export function itemTitle(i: Pick<ComplianceItem, "title_en" | "title_el" | "official_title">, lang: Lang): string {
  return (lang === "el" ? i.title_el || i.title_en : i.title_en || i.title_el) || i.official_title;
}

/** Summary in the chosen language, labelled with the language it is actually in when that differs. */
export function itemText(i: ComplianceItem, field: "summary" | "what_changed" | "action", lang: Lang): { text: string | null; shownLang: Lang | null; fallback: boolean } {
  const en = i[`${field}_en` as const], el = i[`${field}_el` as const];
  const want = lang === "el" ? el : en, other = lang === "el" ? en : el;
  if (want) return { text: want, shownLang: lang, fallback: false };
  if (other) return { text: other, shownLang: lang === "el" ? "en" : "el", fallback: true };
  return { text: null, shownLang: null, fallback: false };
}

export interface FatfListing { country_name: string; country_code: string | null; category: string }
export interface FatfChange { name: string; code: string | null; kind: "added" | "removed" | "moved"; from?: string; to?: string }

/** Additions, removals and category changes between two FATF releases (by country code, else name). */
export function diffFatf(current: FatfListing[], previous: FatfListing[]): FatfChange[] {
  const key = (l: FatfListing) => l.country_code || l.country_name.toLowerCase();
  const prev = new Map(previous.map((l) => [key(l), l]));
  const cur = new Map(current.map((l) => [key(l), l]));
  const out: FatfChange[] = [];
  for (const [k, l] of cur) {
    const p = prev.get(k);
    if (!p) out.push({ name: l.country_name, code: l.country_code, kind: "added", to: l.category });
    else if (p.category !== l.category) out.push({ name: l.country_name, code: l.country_code, kind: "moved", from: p.category, to: l.category });
  }
  for (const [k, p] of prev) if (!cur.has(k)) out.push({ name: p.country_name, code: p.country_code, kind: "removed", from: p.category });
  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

export interface DeadlineEntry { item: ComplianceItem; date: string; kind: "deadline" | "application" | "effective"; type: string }

/** Confirmed dates from published records, soonest first. Each item contributes each of its dates once. */
export function deadlineEntries(items: ComplianceItem[], fromDate: string, toDate?: string): DeadlineEntry[] {
  const out: DeadlineEntry[] = [];
  for (const it of items) {
    const add = (date: string | null, kind: DeadlineEntry["kind"], type: string) => {
      if (date && date >= fromDate && (!toDate || date <= toDate)) out.push({ item: it, date, kind, type });
    };
    add(it.deadline_date, "deadline", it.deadline_type ?? "other");
    if (it.application_date !== it.deadline_date) add(it.application_date, "application", "application");
    if (it.effective_date !== it.deadline_date && it.effective_date !== it.application_date) add(it.effective_date, "effective", "effective");
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export interface ItemFilters { q?: string; authority?: string; jurisdiction?: string; sector?: string; topic?: string; docType?: string }
export function filterItems(items: ComplianceItem[], f: ItemFilters): ComplianceItem[] {
  const q = f.q?.trim().toLowerCase();
  return items.filter((i) =>
    (!f.authority || i.authority === f.authority) && (!f.jurisdiction || i.jurisdiction === f.jurisdiction) &&
    (!f.sector || i.sectors.includes(f.sector)) && (!f.topic || i.topics.includes(f.topic)) && (!f.docType || i.document_type === f.docType) &&
    (!q || [i.official_title, i.title_en, i.title_el, i.summary_en, i.summary_el, i.official_id, i.legal_act_ref, i.regime].some((v) => v?.toLowerCase().includes(q))));
}

export const formatDate = (d: string | null | undefined, lang: Lang) => d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
export const JURISDICTION_LABELS: Record<string, L> = { CY: { en: "Cyprus", el: "Κύπρος" }, EU: { en: "European Union", el: "Ευρωπαϊκή Ένωση" }, INT: { en: "International", el: "Διεθνές" } };
