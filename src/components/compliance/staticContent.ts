import { Shield, FileSearch, Scale, Globe, Lock, Building2, Users, ClipboardCheck, AlertTriangle, FileText } from "lucide-react";

export type FrameworkAccent = "aml" | "gdpr" | "mifid" | "tax" | "dora" | "mica" | "nis2" | "ai";
export const FRAMEWORKS_REVIEWED_AT = "2026-11-13";

export const complianceAreas = [
  { name: "AML/KYC", icon: Shield, accent: "aml" as FrameworkAccent, description: "Anti-Money Laundering & Know Your Customer", description_el: "Καταπολέμηση Ξεπλύματος & Γνωρίζω τον Πελάτη μου", regulator: "CySEC / CBC / MOKAS · EU AMLA",
    keyRegulation: "Law 188(I)/2007 + EU AML Package (AMLR 2024/1624). AMLA is operating; direct supervision from 2028.", keyDate: "AMLR applies 10 Jul 2027", sourceUrl: "https://www.amla.europa.eu/", status: "changing" },
  { name: "GDPR", icon: FileSearch, accent: "gdpr" as FrameworkAccent, description: "Data Protection & Privacy Compliance", description_el: "Προστασία Δεδομένων & Ιδιωτικότητας", regulator: "Commissioner for Personal Data Protection",
    keyRegulation: "EU Regulation 2016/679. Digital Omnibus amendments proposed (Council position 21 Oct 2026), not yet adopted.", keyDate: "In force · amendments pending", sourceUrl: "https://www.consilium.europa.eu/en/press/press-releases/2026/10/21/digital-rulebook-council-agrees-position-to-simplify-data-protection-privacy-and-cyber-reporting-rules/", status: "active" },
  { name: "MiFID II", icon: Scale, accent: "mifid" as FrameworkAccent, description: "Markets in Financial Instruments", description_el: "Αγορές Χρηματοπιστωτικών Μέσων", regulator: "CySEC",
    keyRegulation: "EU Directive 2014/65/EU + MiFIR review 2024/791. Parliament rejected the Retail Investment Strategy changes on 12 Nov 2026.", keyDate: "Current rules unchanged", sourceUrl: "https://eur-lex.europa.eu/eli/dir/2014/65/oj", status: "active" },
  { name: "FATCA/CRS", icon: Globe, accent: "tax" as FrameworkAccent, description: "Tax Reporting & Exchange of Information", description_el: "Φορολογική Αναφορά & Ανταλλαγή Πληροφοριών", regulator: "Tax Department",
    keyRegulation: "FATCA IGA, CRS & DAC8 — Cyprus Law 38(I)/2026; crypto data collected from 1 Jan 2026.", keyDate: "First DAC8 report 30 Jun 2027", sourceUrl: "https://taxation-customs.ec.europa.eu/taxation/tax-transparency-cooperation/administrative-co-operation-and-mutual-assistance/directive-administrative-cooperation-dac/dac8_en", status: "active" },
  { name: "DORA", icon: Lock, accent: "dora" as FrameworkAccent, description: "Digital Operational Resilience Act", description_el: "Ψηφιακή Επιχειρησιακή Ανθεκτικότητα", regulator: "CySEC / CBC / ICCS",
    keyRegulation: "EU Regulation 2022/2554", keyDate: "Applies since 17 Jan 2025", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj", status: "active" },
  { name: "MiCA", icon: Building2, accent: "mica" as FrameworkAccent, description: "Markets in Crypto-Assets Regulation", description_el: "Αγορές Κρυπτοστοιχείων", regulator: "CySEC",
    keyRegulation: "EU Regulation 2023/1114", keyDate: "CySEC transition ended 1 Jul 2025", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj", status: "active" },
  { name: "NIS2", icon: Users, accent: "nis2" as FrameworkAccent, description: "Network & Information Security (Cybersecurity)", description_el: "Ασφάλεια Δικτύων & Πληροφοριών", regulator: "Digital Security Authority",
    keyRegulation: "EU Directive 2022/2555, transposed by Cyprus Law 60(I)/2025 (amending Law 89(I)/2020).", keyDate: "In force since Apr 2025", sourceUrl: "https://www.cylaw.org/nomoi/arith/2025_1_060.pdf", status: "active" },
  { name: "EU AI Act", icon: ClipboardCheck, accent: "ai" as FrameworkAccent, description: "Artificial Intelligence Regulation", description_el: "Κανονισμός για την Τεχνητή Νοημοσύνη", regulator: "EU AI Office / national authorities",
    keyRegulation: "EU Regulation 2024/1689, amended by Digital Omnibus 2026/1744: high-risk rules delayed.", keyDate: "High-risk: 2 Dec 2027 / 2 Aug 2028", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", status: "changing" },
];

// Shown only if the database calendar is empty; the table is refreshed monthly by update-regulatory-calendar.
export const fallbackCalendar = [
  { date: "Dec 2026", event: "CySEC AML/CFT supervisory priorities for 2027", category: "AML" },
  { date: "Jun 2027", event: "DAC8 — first Cyprus crypto-asset reports due 30 June (2026 data)", category: "Tax" },
  { date: "Jul 2027", event: "EU AML Regulation (AMLR) and AMLD6 apply", category: "AML" },
  { date: "Dec 2027", event: "EU AI Act — high-risk (Annex III) rules apply after Omnibus delay", category: "AI" },
  { date: "Aug 2028", event: "EU AI Act — high-risk rules for AI in regulated products apply", category: "AI" },
  { date: "2028", event: "AMLA begins direct supervision of selected obliged entities", category: "AML" },
];

export const documentTemplates = [
  { name: "AML Risk Assessment Template", category: "AML/KYC", icon: Shield },
  { name: "GDPR Data Processing Agreement", category: "GDPR", icon: FileSearch },
  { name: "DPIA Template (Cyprus)", category: "GDPR", icon: ClipboardCheck },
  { name: "KYC Customer Due Diligence Form", category: "AML/KYC", icon: Users },
  { name: "Suspicious Transaction Report Guide", category: "AML/KYC", icon: AlertTriangle },
  { name: "Data Breach Notification Template", category: "GDPR", icon: FileText },
];

export const regulatoryLinks = [
  { name: "CySEC", url: "https://www.cysec.gov.cy", description: "Cyprus Securities & Exchange Commission" },
  { name: "CBC", url: "https://www.centralbank.cy", description: "Central Bank of Cyprus" },
  { name: "NSIU", url: "https://www.gov.cy/nsiu/en/", description: "National Sanctions Implementation Unit" },
  { name: "MOKAS", url: "https://www.law.gov.cy/mokas", description: "Unit for Combating Money Laundering" },
  { name: "AMLA", url: "https://www.amla.europa.eu/index_en", description: "EU Anti-Money Laundering Authority" },
  { name: "EUR-Lex", url: "https://eur-lex.europa.eu/", description: "EU law and the Official Journal" },
  { name: "FATF", url: "https://www.fatf-gafi.org/", description: "Financial Action Task Force" },
  { name: "Data Protection Commissioner", url: "https://www.dataprotection.gov.cy", description: "Personal Data Protection" },
];

/** Official sanctions tools, as linked from the European Commission's resources page (checked daily by the importer). */
export const OFFICIAL_SANCTIONS_TOOLS = [
  { name: "EU Sanctions Map", nameEl: "Χάρτης Κυρώσεων ΕΕ", url: "https://sanctionsmap.eu/#/main", description: "Every EU restrictive-measures regime by country, with the legal acts in force.", descriptionEl: "Όλα τα καθεστώτα περιοριστικών μέτρων της ΕΕ ανά χώρα, με τις ισχύουσες νομικές πράξεις." },
  { name: "Consolidated list of financial sanctions", nameEl: "Ενοποιημένος κατάλογος χρηματοοικονομικών κυρώσεων", url: "https://webgate.ec.europa.eu/fsd/fsf#!/files", description: "The European Commission's consolidated list of persons, groups and entities subject to EU financial sanctions.", descriptionEl: "Ο ενοποιημένος κατάλογος της Ευρωπαϊκής Επιτροπής με πρόσωπα, ομάδες και οντότητες που υπόκεινται σε χρηματοοικονομικές κυρώσεις της ΕΕ." },
  { name: "EU Sanctions Helpdesk", nameEl: "Γραφείο Υποστήριξης Κυρώσεων ΕΕ", url: "https://eu-sanctions-compliance-helpdesk.europa.eu/index_en", description: "Free European Commission help for SMEs on sanctions due diligence.", descriptionEl: "Δωρεάν βοήθεια της Ευρωπαϊκής Επιτροπής προς ΜμΕ για τη δέουσα επιμέλεια σε θέματα κυρώσεων." },
  { name: "Commission sanctions resources", nameEl: "Πόροι κυρώσεων της Επιτροπής", url: "https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en", description: "FAQs, guidance and related resources from the European Commission.", descriptionEl: "Συχνές ερωτήσεις, καθοδήγηση και σχετικοί πόροι από την Ευρωπαϊκή Επιτροπή." },
  { name: "NSIU — Cyprus", nameEl: "ΕΜΕΚ — Κύπρος", url: "https://www.gov.cy/nsiu/en/", description: "Cyprus National Sanctions Implementation Unit: licensing requests, reporting obligations and guidance.", descriptionEl: "Εθνική Μονάδα Εφαρμογής Κυρώσεων: αιτήσεις αδειοδότησης, υποχρεώσεις αναφοράς και καθοδήγηση." },
];
