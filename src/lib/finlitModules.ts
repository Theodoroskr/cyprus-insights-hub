export type FinLitModule = { key: string; path: string; en: string; el: string; icon: string; blurb: string; short_en: string; short_el: string };

/** The ten Financial Literacy modules, in menu order. Keep to ten. */
export const FINLIT_MODULES: FinLitModule[] = [
  { key: "overview", short_en: "Overview", short_el: "Επισκόπηση", path: "/financial-literacy", en: "Overview", el: "Επισκόπηση", icon: "LayoutGrid", blurb: "Headline figures and a guide to every section." },
  { key: "observatory", short_en: "Scores", short_el: "Βαθμολογίες", path: "/financial-literacy/observatory", en: "Financial Literacy Observatory", el: "Παρατηρητήριο Χρηματοοικονομικού Αλφαβητισμού", icon: "Gauge", blurb: "OECD and Central Bank survey results for Cyprus." },
  { key: "household", short_en: "Households", short_el: "Νοικοκυριά", path: "/financial-literacy/household", en: "Household Financial Health", el: "Οικονομική Κατάσταση Νοικοκυριών", icon: "Home", blurb: "Income, savings and financial strain, Cyprus vs EU." },
  { key: "cost", short_en: "Prices", short_el: "Τιμές", path: "/financial-literacy/cost-of-living", en: "Cost of Living", el: "Κόστος Διαβίωσης", icon: "ShoppingCart", blurb: "Inflation, food prices and price levels." },
  { key: "credit", short_en: "Borrowing", short_el: "Δανεισμός", path: "/financial-literacy/credit", en: "Credit & Borrowing", el: "Πίστωση & Δανεισμός", icon: "CreditCard", blurb: "Borrowing costs, repayments and responsible credit." },
  { key: "academy", short_en: "Academy", short_el: "Ακαδημία", path: "/financial-literacy/academy", en: "Financial Education Academy", el: "Ακαδημία Χρηματοοικονομικής Εκπαίδευσης", icon: "GraduationCap", blurb: "Free short lessons in English and Greek." },
  { key: "calculators", short_en: "Calculators", short_el: "Υπολογιστές", path: "/financial-literacy/calculators", en: "Financial Calculators", el: "Χρηματοοικονομικοί Υπολογιστές", icon: "Calculator", blurb: "Six private calculators that run in your browser." },
  { key: "research", short_en: "Research", short_el: "Έρευνες", path: "/financial-literacy/research", en: "Research & Publications", el: "Έρευνες & Δημοσιεύσεις", icon: "BookOpen", blurb: "The reports behind the figures." },
  { key: "campaigns", short_en: "Campaigns", short_el: "Εκστρατείες", path: "/financial-literacy/campaigns", en: "Financial Literacy Campaigns", el: "Εκστρατείες Χρηματοοικονομικού Αλφαβητισμού", icon: "Megaphone", blurb: "Public awareness campaigns, coming soon." },
  { key: "methodology", short_en: "Sources", short_el: "Πηγές", path: "/financial-literacy/methodology", en: "Sources & Methodology", el: "Πηγές & Μεθοδολογία", icon: "FileSearch", blurb: "Where each figure comes from and how it is updated." },
];

export const moduleByKey = (k: string) => FINLIT_MODULES.find((m) => m.key === k)!;

/** Old anchors on the single Financial Literacy page → new module pages. */
export const LEGACY_ANCHORS: Record<string, string> = {
  calculators: "/financial-literacy/calculators", methodology: "/financial-literacy/methodology",
  sources: "/financial-literacy/methodology", household: "/financial-literacy/household",
  "cost-of-living": "/financial-literacy/cost-of-living", survey: "/financial-literacy/observatory",
};

/** Menu groups (after Overview): figures, learning tools, and background. */
export const FINLIT_GROUPS: { key: string; en: string; el: string; keys: string[] }[] = [
  { key: "data", en: "Data", el: "Στοιχεία", keys: ["observatory", "household", "cost", "credit"] },
  { key: "learn", en: "Learn", el: "Μάθηση", keys: ["academy", "calculators", "campaigns"] },
  { key: "about", en: "About", el: "Σχετικά", keys: ["research", "methodology"] },
];
