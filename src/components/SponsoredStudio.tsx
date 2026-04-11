import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SponsoredItem {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  category: string;
  sponsor_name: string;
  href: string;
}

const fallbackItems: SponsoredItem[] = [
  {
    id: "sp1",
    title: "How Cyprus Banks Are Leading the Green Finance Transition",
    summary: "Sustainable lending products are reshaping the island's financial landscape, with ESG-linked loans growing 140% year-over-year.",
    image_url: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=600&q=80",
    category: "Green Finance",
    sponsor_name: "Bank of Cyprus",
    href: "#",
  },
  {
    id: "sp2",
    title: "Digital Transformation Roadmap for Cyprus SMEs in 2026",
    summary: "A practical guide to leveraging EU-funded digitalisation programmes and emerging tech adoption strategies.",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    category: "Digital Strategy",
    sponsor_name: "PwC Cyprus",
    href: "#",
  },
  {
    id: "sp3",
    title: "Navigating the New Cyprus IP Box Regime: What CFOs Need to Know",
    summary: "Expert analysis of the revised intellectual property tax framework and its impact on holding structures.",
    image_url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
    category: "Tax & Legal",
    sponsor_name: "Deloitte Cyprus",
    href: "#",
  },
];

export function SponsoredStudio() {
  const [items, setItems] = useState<SponsoredItem[]>(fallbackItems);

  useEffect(() => {
    supabase
      .from("sponsored_content")
      .select("id, title, summary, image_url, category, sponsor_name, href")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(3)
      .then(({ data, error }) => {
        if (error) {
          console.error("Sponsored content fetch error:", error);
          return;
        }
        if (data && data.length > 0) {
          setItems(data);
        }
      });
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-8 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Custom Studio
          </span>
          <div className="flex-1 h-px bg-border" />
          <Badge variant="outline" className="text-[9px] tracking-widest uppercase text-muted-foreground/50 border-border font-normal">
            Sponsored
          </Badge>
        </div>

        {/* 3-column grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="group block rounded-xl overflow-hidden bg-card border border-border hover:border-secondary/30 transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={item.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80"}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-card/90 text-foreground text-[10px] font-medium border-0 backdrop-blur-sm">
                    {item.category}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-white drop-shadow" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-serif font-bold text-sm text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-secondary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {item.summary}
                </p>

                {/* Presented by */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium">
                    Presented by
                  </span>
                  <span className="text-xs font-semibold text-foreground/70">
                    {item.sponsor_name}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
