import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";

export default function WhoIsWhoPage() {
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("people").select("*").eq("is_whoiswho", true).order("name").then(({ data }) => {
      if (data) setPeople(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onSearch={() => {}} />

      <div className="bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-4 text-secondary" />
          <h1 className="text-4xl font-serif font-bold mb-3">Who's Who</h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">Premium editorial profiles of Cyprus' most influential business leaders, executives, and market figures.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((p) => (
            <Link key={p.id} to={`/whoiswho/${p.slug}`} className="group border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all bg-card">
              <div className="relative h-56 overflow-hidden">
                <img src={p.photo || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-serif font-bold text-white">{p.name}</h3>
                  <p className="text-white/80 text-sm">{p.title}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground line-clamp-3">{p.bio}</p>
                {p.whoiswho_quote && (
                  <blockquote className="border-l-2 border-secondary pl-3 mt-3 text-xs italic text-foreground/70 line-clamp-2">
                    "{p.whoiswho_quote}"
                  </blockquote>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
