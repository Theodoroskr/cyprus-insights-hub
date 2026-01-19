// WhoIsWho Profile Data - Cyprus Business Directory

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  image: string;
}

export interface Connection {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  relationship: string;
  badges: string[];
}

export interface CompanyHistory {
  year: string;
  title: string;
  company: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  coverImage: string;
  badges: string[];
  trending: boolean;
  verified: boolean;
  bio: string;
  expertise: string[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  contact: {
    email: string;
    linkedin: string;
    phone?: string;
  };
  stats: {
    connections: number;
    articles: number;
    yearsExperience: number;
  };
  companyHistory: CompanyHistory[];
  connections: Connection[];
  relatedNews: NewsArticle[];
}

export const profilesData: Profile[] = [
  {
    id: "1",
    name: "Christos Patsalides",
    title: "Governor",
    company: "Central Bank of Cyprus",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    badges: ["CBA", "Verified"],
    trending: true,
    verified: true,
    bio: "Christos Patsalides has served as the Governor of the Central Bank of Cyprus since 2019. With over 30 years of experience in banking and financial regulation, he has been instrumental in stabilizing Cyprus's financial sector following the 2013 banking crisis. His leadership focuses on implementing EU monetary policy, maintaining financial stability, and fostering digital innovation in banking.",
    expertise: ["Monetary Policy", "Financial Regulation", "Banking Supervision", "Economic Analysis", "Risk Management"],
    education: [
      { degree: "PhD in Economics", institution: "University of Cambridge", year: "1995" },
      { degree: "MSc Finance", institution: "London School of Economics", year: "1990" },
      { degree: "BA Economics", institution: "University of Cyprus", year: "1988" }
    ],
    contact: {
      email: "governor@centralbank.cy",
      linkedin: "linkedin.com/in/christos-patsalides"
    },
    stats: { connections: 847, articles: 124, yearsExperience: 32 },
    companyHistory: [
      { year: "2019 - Present", title: "Governor", company: "Central Bank of Cyprus", description: "Leading monetary policy and financial stability initiatives for Cyprus." },
      { year: "2014 - 2019", title: "Deputy Governor", company: "Central Bank of Cyprus", description: "Oversaw banking supervision and regulatory compliance." },
      { year: "2008 - 2014", title: "Executive Director", company: "European Central Bank", description: "Represented Cyprus in ECB policy decisions." },
      { year: "2000 - 2008", title: "Chief Economist", company: "Bank of Cyprus", description: "Led economic research and strategic planning." }
    ],
    connections: [
      { id: "2", name: "George Campanellas", title: "Minister of Energy", company: "Government of Cyprus", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", relationship: "Policy Collaborator", badges: [] },
      { id: "3", name: "Elena Papadopoulou", title: "CEO", company: "CySEC", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80", relationship: "Regulatory Partner", badges: ["CySEC"] },
      { id: "5", name: "Nikos Komodromos", title: "CEO", company: "Hellenic Bank", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80", relationship: "Banking Sector", badges: ["CBA"] }
    ],
    relatedNews: [
      { id: "n1", title: "Central Bank Announces New Digital Euro Pilot Program", summary: "Cyprus to participate in ECB's digital currency initiative.", date: "1 day ago", category: "Policy", image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&q=80" },
      { id: "n2", title: "Governor Addresses Economic Forum on Inflation Measures", summary: "Key speech highlights monetary policy adjustments for 2024.", date: "3 days ago", category: "Economy", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80" }
    ]
  },
  {
    id: "2",
    name: "George Campanellas",
    title: "Minister of Energy",
    company: "Government of Cyprus",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
    badges: ["Government", "Verified"],
    trending: true,
    verified: true,
    bio: "George Campanellas serves as the Minister of Energy, Commerce and Industry for the Republic of Cyprus. He is leading Cyprus's energy transition strategy, focusing on renewable energy development, natural gas exploitation, and regional energy cooperation. His vision includes making Cyprus a key energy hub in the Eastern Mediterranean.",
    expertise: ["Energy Policy", "Renewable Energy", "Natural Gas", "International Trade", "Economic Development"],
    education: [
      { degree: "MBA", institution: "INSEAD", year: "2002" },
      { degree: "MEng Petroleum Engineering", institution: "Imperial College London", year: "1998" },
      { degree: "BSc Engineering", institution: "University of Cyprus", year: "1996" }
    ],
    contact: {
      email: "minister@mcit.gov.cy",
      linkedin: "linkedin.com/in/george-campanellas"
    },
    stats: { connections: 1243, articles: 89, yearsExperience: 26 },
    companyHistory: [
      { year: "2023 - Present", title: "Minister of Energy", company: "Government of Cyprus", description: "Leading national energy strategy and policy." },
      { year: "2018 - 2023", title: "CEO", company: "Cyprus Hydrocarbons Company", description: "Managed Cyprus's natural gas exploration and development." },
      { year: "2012 - 2018", title: "VP Operations", company: "Total Cyprus", description: "Oversaw offshore drilling operations in Block 11." },
      { year: "2005 - 2012", title: "Senior Engineer", company: "Shell International", description: "Led engineering projects across Middle East operations." }
    ],
    connections: [
      { id: "1", name: "Christos Patsalides", title: "Governor", company: "Central Bank of Cyprus", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80", relationship: "Policy Coordination", badges: ["CBA"] },
      { id: "6", name: "Maria Stavrou", title: "Director", company: "Cyprus Energy Agency", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80", relationship: "Direct Report", badges: [] }
    ],
    relatedNews: [
      { id: "n3", title: "New Energy Law Passed in Parliament", summary: "Comprehensive legislation to accelerate renewable energy adoption.", date: "2 hours ago", category: "Policy", image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80" },
      { id: "n4", title: "Cyprus Signs Energy Cooperation Agreement with Greece", summary: "Joint initiative for EastMed pipeline development.", date: "1 week ago", category: "International", image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=400&q=80" }
    ]
  },
  {
    id: "3",
    name: "Elena Papadopoulou",
    title: "CEO",
    company: "CySEC",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=1200&q=80",
    badges: ["CySEC", "Verified"],
    trending: false,
    verified: true,
    bio: "Elena Papadopoulou leads the Cyprus Securities and Exchange Commission (CySEC) as its CEO. Under her leadership, CySEC has become a leading regulatory authority for investment services in the EU. She has implemented robust frameworks for fintech regulation, cryptocurrency oversight, and investor protection.",
    expertise: ["Securities Regulation", "Fintech", "Investor Protection", "Compliance", "Corporate Governance"],
    education: [
      { degree: "LLM Financial Law", institution: "Harvard Law School", year: "2005" },
      { degree: "LLB Law", institution: "University of Athens", year: "2002" }
    ],
    contact: {
      email: "ceo@cysec.gov.cy",
      linkedin: "linkedin.com/in/elena-papadopoulou"
    },
    stats: { connections: 567, articles: 78, yearsExperience: 19 },
    companyHistory: [
      { year: "2020 - Present", title: "CEO", company: "CySEC", description: "Leading Cyprus's securities and investment regulation." },
      { year: "2015 - 2020", title: "Director of Supervision", company: "CySEC", description: "Headed market surveillance and compliance enforcement." },
      { year: "2010 - 2015", title: "Senior Legal Counsel", company: "Deloitte Cyprus", description: "Advised financial institutions on regulatory compliance." },
      { year: "2005 - 2010", title: "Associate", company: "Allen & Overy", description: "Specialized in financial services law." }
    ],
    connections: [
      { id: "1", name: "Christos Patsalides", title: "Governor", company: "Central Bank of Cyprus", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80", relationship: "Regulatory Partner", badges: ["CBA"] },
      { id: "4", name: "Andreas Michaelides", title: "Partner", company: "KPMG Cyprus", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80", relationship: "Industry Advisor", badges: ["ICPAC"] }
    ],
    relatedNews: [
      { id: "n5", title: "CySEC Introduces New Crypto Licensing Framework", summary: "Regulatory clarity for digital asset service providers.", date: "5 days ago", category: "Regulation", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80" }
    ]
  },
  {
    id: "4",
    name: "Andreas Michaelides",
    title: "Partner",
    company: "KPMG Cyprus",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    badges: ["ICPAC", "Verified"],
    trending: false,
    verified: true,
    bio: "Andreas Michaelides is a Partner at KPMG Cyprus, leading the Audit and Assurance practice. A qualified accountant with ICPAC certification, he has over 20 years of experience advising major corporations and financial institutions. His expertise spans international financial reporting, corporate restructuring, and ESG advisory.",
    expertise: ["Audit", "Financial Reporting", "IFRS", "Corporate Restructuring", "ESG Advisory"],
    education: [
      { degree: "ACA", institution: "ICAEW", year: "2004" },
      { degree: "BSc Accounting & Finance", institution: "LSE", year: "2001" }
    ],
    contact: {
      email: "a.michaelides@kpmg.com.cy",
      linkedin: "linkedin.com/in/andreas-michaelides"
    },
    stats: { connections: 1456, articles: 45, yearsExperience: 23 },
    companyHistory: [
      { year: "2015 - Present", title: "Partner", company: "KPMG Cyprus", description: "Leading audit engagements for major financial institutions." },
      { year: "2010 - 2015", title: "Senior Manager", company: "KPMG Cyprus", description: "Managed complex audit and advisory projects." },
      { year: "2004 - 2010", title: "Manager", company: "PwC London", description: "Worked on FTSE 100 audit engagements." }
    ],
    connections: [
      { id: "3", name: "Elena Papadopoulou", title: "CEO", company: "CySEC", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80", relationship: "Client Relationship", badges: ["CySEC"] },
      { id: "1", name: "Christos Patsalides", title: "Governor", company: "Central Bank of Cyprus", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80", relationship: "Industry Contact", badges: ["CBA"] }
    ],
    relatedNews: [
      { id: "n6", title: "KPMG Releases Annual Cyprus Economic Outlook", summary: "Comprehensive analysis of Cyprus business environment.", date: "2 weeks ago", category: "Research", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80" }
    ]
  }
];

export const getProfileById = (id: string): Profile | undefined => {
  return profilesData.find(profile => profile.id === id);
};

export const getAllProfiles = (): Profile[] => {
  return profilesData;
};
