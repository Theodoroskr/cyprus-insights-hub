import { Landmark, Shield, Building2, Briefcase, Cpu, Compass } from "lucide-react";

export type BrandId = "businesshub" | "fintechhub" | "compliancehub" | "smehub" | "regtechhub" | "tourismhub";

export interface BrandConfig {
  id: BrandId;
  name: string;
  domain: string;
  tagline: string;
  logoLetter: string;
  icon: typeof Building2;
  colors: {
    primary: string;
    accent: string;
  };
  navItems: { label: string; href: string }[];
  /** Landing page of the hub; the masthead logo links here. */
  home: string;
  /** Tailwind background class for the logo badge (semantic token). */
  badgeClass: string;
  parentBadge: boolean;
}

export const brands: Record<BrandId, BrandConfig> = {
  businesshub: {
    id: "businesshub",
    home: "/",
    badgeClass: "bg-foreground",
    name: "BusinessHub",
    domain: ".cy",
    tagline: "Cyprus Business Intelligence Platform",
    logoLetter: "B",
    icon: Building2,
    colors: {
      primary: "navy",
      accent: "secondary",
    },
    navItems: [
      { label: "Intelligence", href: "#intelligence" },
      { label: "Directory", href: "/directory" },
      { label: "FinTech", href: "/fintech" },
      { label: "Compliance", href: "/compliance" },
      { label: "Explore Cyprus", href: "/explore" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: false,
  },
  fintechhub: {
    id: "fintechhub",
    home: "/fintech",
    badgeClass: "bg-fintech",
    name: "FinTechHub",
    domain: ".cy",
    tagline: "Digital Finance Intelligence for Cyprus",
    logoLetter: "F",
    icon: Landmark,
    colors: {
      primary: "fintech",
      accent: "secondary",
    },
    navItems: [
      { label: "Intelligence", href: "/fintech" },
      { label: "Regulations", href: "/fintech#regulations" },
      { label: "Directory", href: "/directory" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: true,
  },
  compliancehub: {
    id: "compliancehub",
    home: "/compliance",
    badgeClass: "bg-compliance",
    name: "ComplianceHub",
    domain: ".cy",
    tagline: "Regulatory Intelligence & Risk Management",
    logoLetter: "C",
    icon: Shield,
    colors: {
      primary: "compliance",
      accent: "secondary",
    },
    navItems: [
      { label: "Dashboard", href: "/compliance" },
      { label: "Regulatory Updates", href: "/compliance/regulatory-updates" },
      { label: "Sanctions & Risk", href: "/compliance/sanctions" },
      { label: "Deadlines", href: "/compliance/deadlines" },
      { label: "Guidance", href: "/compliance/guidance" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: true,
  },
  smehub: {
    id: "smehub",
    home: "/sme",
    badgeClass: "bg-sme",
    name: "SMEHub",
    domain: ".cy",
    tagline: "Tools & Intelligence for Cyprus SMEs",
    logoLetter: "S",
    icon: Briefcase,
    colors: {
      primary: "sme",
      accent: "secondary",
    },
    navItems: [
      { label: "Funding", href: "/sme#funding" },
      { label: "Checklists", href: "/sme#checklists" },
      { label: "EU Tools", href: "/sme#eu-tools" },
      { label: "Directory", href: "/sme#directory" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: true,
  },
  regtechhub: {
    id: "regtechhub",
    home: "/regtech",
    badgeClass: "bg-regtech",
    name: "RegTechHub",
    domain: ".cy",
    tagline: "Regulatory Technology Intelligence for Cyprus",
    logoLetter: "R",
    icon: Cpu,
    colors: {
      primary: "regtech",
      accent: "secondary",
    },
    navItems: [
      { label: "Intelligence", href: "/regtech" },
      { label: "Vendors", href: "/regtech#vendors" },
      { label: "DORA", href: "/regtech#dora" },
      { label: "Directory", href: "/directory" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: true,
  },
  tourismhub: {
    id: "tourismhub",
    home: "/explore",
    badgeClass: "bg-tourism",
    name: "TourismHub",
    domain: ".cy",
    tagline: "Explore Cyprus — officially sourced travel guide",
    logoLetter: "T",
    icon: Compass,
    colors: {
      primary: "tourism",
      accent: "secondary",
    },
    navItems: [
      { label: "Explore", href: "/explore" },
      { label: "News", href: "/explore/news" },
      { label: "Funding", href: "/funding?sector=tourism" },
      { label: "Nicosia City & Countryside", href: "/explore/nicosia-countryside" },
      { label: "Conference Venues", href: "/explore/conference-venues" },
      { label: "Directory", href: "/directory" },
    ],
    parentBadge: true,
  },
};

export const hubLinks = [
  { brand: brands.businesshub, href: "/" },
  { brand: brands.fintechhub, href: "/fintech" },
  { brand: brands.compliancehub, href: "/compliance" },
  { brand: brands.regtechhub, href: "/regtech" },
  { brand: brands.tourismhub, href: "/explore" },
];
