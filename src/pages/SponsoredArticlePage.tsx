import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function SponsoredArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("sponsored_content")
      .select("*")
      .eq("id", id)
      .eq("active", true)
      .single()
      .then(({ data }) => {
        setItem(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Article not found</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      {/* Hero */}
      {item.image_url && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-muted-foreground/60 border-border">
              Sponsored
            </Badge>
            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-4">
            {item.title}
          </h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <span className="text-[10px] uppercase tracking-widest">Presented by</span>
            <span className="font-semibold text-foreground">{item.sponsor_name}</span>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-foreground">
            {item.content ? (
              <div className="whitespace-pre-line leading-relaxed">{item.content}</div>
            ) : item.summary ? (
              <p className="text-lg text-muted-foreground leading-relaxed">{item.summary}</p>
            ) : (
              <p className="text-muted-foreground italic">Full article content coming soon.</p>
            )}
          </div>

          {/* Sponsor footer */}
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Sponsored by</span>
                <span className="text-sm font-semibold text-foreground">{item.sponsor_name}</span>
              </div>
              {item.href && item.href !== "#" && (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-secondary hover:underline flex items-center gap-1"
                >
                  Visit sponsor <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
