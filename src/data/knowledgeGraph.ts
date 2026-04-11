// Knowledge Graph — Bidirectional Person ↔ Article linking engine

export interface KGArticle {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  hub: "businesshub" | "fintechhub" | "compliancehub";
  image: string;
  /** Profile IDs mentioned in or related to this article */
  personIds: string[];
  /** Intelligence card fields (optional — only for briefing-style articles) */
  intelligence?: {
    whatHappened: string;
    whyItMatters: string;
    whatToDo: string;
  };
}

export interface KGPerson {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  badges: string[];
  trending: boolean;
}

// ─── Centralized Article Registry ───────────────────────────────

export const articles: KGArticle[] = [
  {
    id: "a1",
    title: "CySEC Mandates Enhanced Transaction Monitoring for Investment Firms",
    summary: "New circular requires all regulated IFs to upgrade monitoring systems by Q1 2026.",
    date: "2 hours ago",
    category: "Regulation",
    hub: "compliancehub",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80",
    personIds: ["3"],
    intelligence: {
      whatHappened: "CySEC issued a new circular mandating enhanced transaction monitoring for all regulated investment firms, effective Q1 2026.",
      whyItMatters: "Firms with inadequate systems face fines up to €500K. Smaller IFs may struggle with implementation costs and tight timelines.",
      whatToDo: "Audit your current monitoring stack against the circular's 14-point checklist. Engage compliance counsel before the 90-day deadline.",
    },
  },
  {
    id: "a2",
    title: "Cyprus Neobank Dize Secures €12M Series A",
    summary: "Largest fintech round in Cyprus history signals growing investor confidence.",
    date: "5 hours ago",
    category: "FinTech",
    hub: "fintechhub",
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&q=80",
    personIds: ["4"],
    intelligence: {
      whatHappened: "Cyprus-based neobank Dize secured €12M Series A funding led by Target Global, marking the island's largest fintech round in 2025.",
      whyItMatters: "Signals growing investor confidence in Cyprus as a fintech hub. Could accelerate talent migration and attract more VCs to the ecosystem.",
      whatToDo: "FinTech founders should study Dize's regulatory sandbox strategy. Investors should watch for follow-on deals in payments and embedded finance.",
    },
  },
  {
    id: "a3",
    title: "Cabinet Approves Corporate Tax Incentives for Tech Startups",
    summary: "50% tax credits for tech companies relocating EU headquarters to Cyprus.",
    date: "Yesterday",
    category: "Policy",
    hub: "businesshub",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
    personIds: ["1", "2"],
    intelligence: {
      whatHappened: "The Cabinet approved a new corporate tax incentive package offering 50% tax credits to tech companies relocating their EU headquarters to Cyprus.",
      whyItMatters: "Positions Cyprus competitively against Ireland and Malta. Could reshape the island's economic profile within 3–5 years.",
      whatToDo: "Eligible firms should file pre-registration with the Ministry of Finance by December 2025. Consult tax advisors on IP box regime synergies.",
    },
  },
  {
    id: "a4",
    title: "Central Bank Announces Digital Euro Pilot Program",
    summary: "Cyprus to participate in ECB's digital currency initiative starting 2026.",
    date: "1 day ago",
    category: "Policy",
    hub: "fintechhub",
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&q=80",
    personIds: ["1"],
  },
  {
    id: "a5",
    title: "New Energy Law Amendments Approved by Parliament",
    summary: "Comprehensive legislation to accelerate renewable energy adoption in Cyprus.",
    date: "Today",
    category: "Energy",
    hub: "businesshub",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80",
    personIds: ["2"],
  },
  {
    id: "a6",
    title: "CySEC Introduces New Crypto Licensing Framework",
    summary: "Regulatory clarity for digital asset service providers operating in Cyprus.",
    date: "5 days ago",
    category: "Regulation",
    hub: "compliancehub",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80",
    personIds: ["3", "4"],
  },
  {
    id: "a7",
    title: "Cyprus Banks Report Record Q3 Profits",
    summary: "Major banks announce 23% YoY profit increase amid strong lending activity.",
    date: "Yesterday",
    category: "Finance",
    hub: "businesshub",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80",
    personIds: ["1", "4"],
  },
  {
    id: "a8",
    title: "EU Approves €150M Infrastructure Grant for Cyprus",
    summary: "Largest infrastructure grant in Cyprus history secured through bilateral negotiations.",
    date: "3 days ago",
    category: "EU Funding",
    hub: "businesshub",
    image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=400&q=80",
    personIds: ["2"],
  },
  {
    id: "a9",
    title: "KPMG Releases Annual Cyprus Economic Outlook",
    summary: "Comprehensive analysis projects 3.2% GDP growth and highlights key risk sectors.",
    date: "2 weeks ago",
    category: "Research",
    hub: "businesshub",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    personIds: ["4", "1"],
  },
  {
    id: "a10",
    title: "Governor Addresses Economic Forum on Inflation Measures",
    summary: "Key speech highlights monetary policy adjustments for 2024-2025 fiscal period.",
    date: "3 days ago",
    category: "Economy",
    hub: "businesshub",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80",
    personIds: ["1"],
  },
];

// ─── Centralized Person Registry ────────────────────────────────

export const persons: KGPerson[] = [
  {
    id: "1",
    name: "Christos Patsalides",
    title: "Governor",
    company: "Central Bank of Cyprus",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80",
    badges: ["CBA"],
    trending: true,
  },
  {
    id: "2",
    name: "George Campanellas",
    title: "Minister of Energy",
    company: "Government of Cyprus",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    badges: [],
    trending: true,
  },
  {
    id: "3",
    name: "Elena Papadopoulou",
    title: "CEO",
    company: "CySEC",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
    badges: ["CySEC"],
    trending: false,
  },
  {
    id: "4",
    name: "Andreas Michaelides",
    title: "Partner",
    company: "KPMG Cyprus",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    badges: ["ICPAC"],
    trending: false,
  },
];

// ─── Graph Query Functions ──────────────────────────────────────

/** Get all articles that mention a specific person */
export function getArticlesForPerson(personId: string): KGArticle[] {
  return articles.filter((a) => a.personIds.includes(personId));
}

/** Get all persons mentioned in a specific article */
export function getPersonsForArticle(articleId: string): KGPerson[] {
  const article = articles.find((a) => a.id === articleId);
  if (!article) return [];
  return persons.filter((p) => article.personIds.includes(p.id));
}

/** Get person by ID */
export function getPersonById(personId: string): KGPerson | undefined {
  return persons.find((p) => p.id === personId);
}

/** Get article by ID */
export function getArticleById(articleId: string): KGArticle | undefined {
  return articles.find((a) => a.id === articleId);
}

/** Get intelligence briefing articles (ones with the 3-part structure) */
export function getIntelligenceBriefings(): KGArticle[] {
  return articles.filter((a) => a.intelligence);
}

/** Get co-mentioned persons — people who appear alongside a given person in articles */
export function getCoMentioned(personId: string): { person: KGPerson; sharedArticles: number }[] {
  const personArticles = getArticlesForPerson(personId);
  const coMentionMap = new Map<string, number>();

  for (const article of personArticles) {
    for (const pid of article.personIds) {
      if (pid !== personId) {
        coMentionMap.set(pid, (coMentionMap.get(pid) || 0) + 1);
      }
    }
  }

  return Array.from(coMentionMap.entries())
    .map(([pid, count]) => ({ person: getPersonById(pid)!, sharedArticles: count }))
    .filter((x) => x.person)
    .sort((a, b) => b.sharedArticles - a.sharedArticles);
}

/** Get all edges for visualization: [personId, articleId] pairs */
export function getGraphEdges(): { personId: string; articleId: string }[] {
  const edges: { personId: string; articleId: string }[] = [];
  for (const article of articles) {
    for (const pid of article.personIds) {
      edges.push({ personId: pid, articleId: article.id });
    }
  }
  return edges;
}

/** Get articles filtered by hub */
export function getArticlesByHub(hub: KGArticle["hub"]): KGArticle[] {
  return articles.filter((a) => a.hub === hub);
}
