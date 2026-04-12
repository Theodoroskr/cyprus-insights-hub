import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";
import { SEOHead } from "@/components/SEOHead";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("directory_articles").select("*").eq("article_type", "interview").eq("is_published", true).order("published_at", { ascending: false })
      .then(({ data }) => { if (data) setInterviews(data); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6 text-secondary" />
            <h1 className="text-3xl font-serif font-bold text-foreground">Interviews</h1>
          </div>
          <p className="text-muted-foreground mt-2">Exclusive interviews with Cyprus' business leaders and decision-makers</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((i) => (
            <Link key={i.id} to={`/interviews/${i.slug}`} className="group border border-border rounded-xl overflow-hidden bg-card hover:shadow-xl transition-all">
              <div className="relative h-56 overflow-hidden">
                <img src={i.cover_image || "/placeholder.svg"} alt={i.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">Interview</Badge>
              </div>
              <div className="p-5">
                <h3 className="font-serif font-bold text-lg text-foreground leading-snug group-hover:text-secondary transition-colors">{i.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{i.excerpt}</p>
                {i.published_at && <p className="text-xs text-muted-foreground mt-3">{formatDistanceToNow(new Date(i.published_at), { addSuffix: true })}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
