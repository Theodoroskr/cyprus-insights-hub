import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function DirectoryCtaBanner() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("directory_companies")
      .select("id", { count: "estimated", head: true })
      .then(({ count }) => { if (count) setCount(count); });
  }, []);

  const label = count ? `${(Math.floor(count / 1000) * 1000).toLocaleString("en-GB")}+` : "thousands of";

  return (
    <section className="container mx-auto px-4 my-10">
      <Link to="/directory" className="group block rounded-xl bg-secondary text-secondary-foreground p-8 md:p-10 hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Building2 className="h-12 w-12 shrink-0 opacity-80" />
          <div className="flex-1">
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Explore the Cyprus Business Directory</h2>
            <p className="mt-2 opacity-90">Search {label} registered companies, licences and regulatory badges.</p>
          </div>
          <Button variant="outline" className="bg-background text-foreground hover:bg-background/90 gap-2 shrink-0">
            Open the Directory <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Link>
    </section>
  );
}
