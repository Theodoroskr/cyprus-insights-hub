import { Shield, FileSearch, Scale, Globe, Lock, Building2, Users, ClipboardCheck, AlertTriangle, FileText } from "lucide-react";

export const complianceAreas = [
  { name: "AML/KYC", icon: Shield, description: "Anti-Money Laundering & Know Your Customer", regulator: "CySEC / CBC / MOKAS",
    keyRegulation: "Law 188(I)/2007 + EU AML Package (AMLR 2024/1624, applies July 2027)", status: "changing" },
  { name: "GDPR", icon: FileSearch, description: "Data Protection & Privacy Compliance", regulator: "Commissioner for Personal Data Protection",
    keyRegulation: "EU Regulation 2016/679", status: "active" },
  { name: "MiFID II", icon: Scale, description: "Markets in Financial Instruments", regulator: "CySEC",
    keyRegulation: "EU Directive 2014/65/EU + MiFIR review 2024/791", status: "active" },
  { name: "FATCA/CRS", icon: Globe, description: "Tax Reporting & Exchange of Information", regulator: "Tax Department",
    keyRegulation: "FATCA IGA, CRS & DAC8 (crypto reporting from 2026)", status: "active" },
  { name: "DORA", icon: Lock, description: "Digital Operational Resilience Act", regulator: "CySEC / CBC / ICCS",
    keyRegulation: "EU Regulation 2022/2554 (applies since 17 Jan 2025)", status: "active" },
  { name: "MiCA", icon: Building2, description: "Markets in Crypto-Assets Regulation", regulator: "CySEC",
    keyRegulation: "EU Regulation 2023/1114 (CySEC transition ended 1 Jul 2025)", status: "active" },
  { name: "NIS2", icon: Users, description: "Network & Information Security (Cybersecurity)", regulator: "Digital Security Authority",
    keyRegulation: "EU Directive 2022/2555", status: "active" },
  { name: "EU AI Act", icon: ClipboardCheck, description: "Artificial Intelligence Regulation", regulator: "EU AI Office / national authorities",
    keyRegulation: "EU Regulation 2024/1689 (main obligations from Aug 2026)", status: "changing" },
];

// Shown only if the database calendar is empty; the table is refreshed monthly by update-regulatory-calendar.
export const fallbackCalendar = [
  { date: "Dec 2026", event: "CySEC AML/CFT supervisory priorities for 2027", category: "AML" },
  { date: "Jan 2027", event: "DAC8 — first crypto-asset transaction reports due (2026 data)", category: "Tax" },
  { date: "Jul 2027", event: "EU AML Regulation (AMLR) and AMLD6 apply", category: "AML" },
  { date: "Aug 2027", event: "EU AI Act — rules for high-risk AI in regulated products apply", category: "AI" },
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
