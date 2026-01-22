import { Landmark, Shield, Building2 } from "lucide-react";

export type BrandId = "businesshub" | "fintechhub" | "compliancehub";

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
  parentBadge: boolean;
}

export const brands: Record<BrandId, BrandConfig> = {
  businesshub: {
    id: "businesshub",
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
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: false,
  },
  fintechhub: {
    id: "fintechhub",
    name: "FinTechHub",
    domain: ".cy",
    tagline: "Digital Finance Intelligence for Cyprus",
    logoLetter: "FT",
    icon: Landmark,
    colors: {
      primary: "fintech",
      accent: "secondary",
    },
    navItems: [
      { label: "Intelligence", href: "/fintech" },
      { label: "Regulations", href: "/fintech#regulations" },
      { label: "Directory", href: "/fintech/directory" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: true,
  },
  compliancehub: {
    id: "compliancehub",
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
      { label: "Alerts", href: "/compliance#alerts" },
      { label: "AML Center", href: "/compliance#aml" },
      { label: "Resources", href: "/resources" },
    ],
    parentBadge: true,
  },
};

export const hubLinks = [
  { brand: brands.businesshub, href: "/" },
  { brand: brands.fintechhub, href: "/fintech" },
  { brand: brands.compliancehub, href: "/compliance" },
];
