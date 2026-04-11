import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, TrendingUp, BadgeCheck, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  badges: string[];
  trending: boolean;
}

const featuredArticles = [
  {
    id: "1",
    title: "Cyprus Introduces New Corporate Tax Incentives for Tech Startups",
    summary: "The Ministry of Finance announces a comprehensive package of tax incentives aimed at attracting tech companies to establish their European headquarters in Cyprus.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    category: "Policy",
    date: "2 hours ago",
    author: "Maria Constantinou",
  },
  {
    id: "2",
    title: "CySEC Publishes Updated Guidelines on Crypto-Asset Service Providers",
    summary: "New regulatory framework aligns with MiCA requirements, setting clearer boundaries for crypto firms operating from Cyprus.",
    category: "Regulation",
    date: "4 hours ago",
    author: "Andreas Georgiou",
  },
  {
    id: "3",
    title: "Bank of Cyprus Reports Record Q3 Profits Amid Rising Interest Rates",
    summary: "The island's largest lender sees net interest income surge 34% as the ECB rate environment continues to benefit Cypriot banks.",
    category: "Banking",
    date: "6 hours ago",
    author: "Elena Papas",
  },
  {
    id: "4",
    title: "EU Digital Identity Wallet Rollout: What Cyprus Businesses Need to Know",
    summary: "The upcoming eIDAS 2.0 regulation will require businesses to accept the EU Digital Identity Wallet by 2026.",
    category: "Digital",
    date: "8 hours ago",
    author: "Nikos Ioannou",
  },
];

const mostReadArticles = [
  {
    id: "mr1",
    title: "AML Directive 6: Cyprus Implementation Timeline and Key Changes",
    category: "Compliance",
    readTime: "5 min",
  },
  {
    id: "mr2",
    title: "Top 10 FinTech Companies Licensed by CySEC in 2025",
    category: "FinTech",
    readTime: "4 min",
  },
  {
    id: "mr3",
    title: "Cyprus Real Estate Market: Foreign Investment Surges 28%",
    category: "Property",
    readTime: "3 min",
  },
  {
    id: "mr4",
    title: "How the New Transfer Pricing Rules Affect SMEs in Cyprus",
    category: "Tax",
    readTime: "6 min",
  },
  {
    id: "mr5",
    title: "Central Bank of Cyprus: Digital Euro Pilot Update",
    category: "Banking",
    readTime: "4 min",
  },
];

const trendingPeople: Person[] = [
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

export function IntelligenceHub() {
  const [lead, ...secondary] = featuredArticles;

  return (
    <section id="news" className="section-rule section-rule-thick">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="section-label">Intelligence Hub</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">Latest from Cyprus</span>
        </div>

        {/* Fast Company-style 3-column layout */}
        <div className="grid lg:grid-cols-12 gap-0">

          {/* COLUMN 1: Lead Story (wide) */}
          <div className="lg:col-span-5 lg:pr-6 lg:border-r border-border pb-6 lg:pb-0">
            <article className="group cursor-pointer">
              <div className="relative overflow-hidden mb-4">
                <img
                  src={lead.image}
                  alt={lead.title}
                  className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <Badge className="absolute top-3 left-3 bg-foreground text-background rounded-none text-[10px] uppercase tracking-wider font-sans">
                  {lead.category}
                </Badge>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-3 group-hover:text-secondary transition-colors">
                {lead.title}
              </h3>
              <p className="article-body text-base mb-3">
                {lead.summary}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="byline">By {lead.author}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lead.date}
                </span>
              </div>
            </article>

            {/* Trending People — below lead on desktop */}
            <div className="border-t border-border pt-5 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="section-label">Trending People</span>
              </div>
              <div className="space-y-3">
                {trendingPeople.map((person) => (
                  <Link
                    key={person.id}
                    to={`/profile/${person.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded hover:bg-muted/50 transition-colors group"
                  >
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-border group-hover:ring-secondary transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{person.name}</p>
                        {person.trending && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-gold" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="truncate">{person.title}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                        <span className="truncate">{person.company}</span>
                      </div>
                    </div>
                    {person.badges.length > 0 && (
                      <span className="badge-cysec flex-shrink-0">
                        <BadgeCheck className="h-3 w-3" />
                        {person.badges[0]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Secondary Stories (middle) */}
          <div className="lg:col-span-4 lg:px-6 lg:border-r border-border py-6 lg:py-0 border-t lg:border-t-0">
            <div className="divide-y divide-border">
              {secondary.map((article) => (
                <article key={article.id} className="py-4 first:pt-0 group cursor-pointer">
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider font-sans mb-2 border-muted-foreground/30">
                    {article.category}
                  </Badge>
                  <h4 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-secondary transition-colors">
                    {article.title}
                  </h4>
                  <p className="article-body text-sm line-clamp-2 mb-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="byline">By {article.author}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{article.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* COLUMN 3: Most Read — numbered sidebar */}
          <div className="lg:col-span-3 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="h-4 w-4 text-destructive" />
              <span className="section-label">Most Read</span>
            </div>
            <div className="space-y-0">
              {mostReadArticles.map((article, index) => (
                <article
                  key={article.id}
                  className="group cursor-pointer flex items-start gap-3 py-3.5 border-b border-border last:border-b-0"
                >
                  {/* Large number */}
                  <span className="text-3xl font-serif font-black text-muted-foreground/25 leading-none select-none group-hover:text-secondary/40 transition-colors min-w-[2rem] text-right">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-wider font-sans mb-1.5 border-muted-foreground/20 px-1.5 py-0">
                      {article.category}
                    </Badge>
                    <h5 className="font-serif text-sm font-bold text-foreground leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {article.title}
                    </h5>
                    <span className="text-[11px] text-muted-foreground mt-1 inline-block">{article.readTime} read</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
