import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; title: string; summary: string | null; image_url: string | null; category: string; sponsor_name: string; href: string };

/** Newest active sponsored story, styled as an editorial card and always labelled. */
export function SponsoredStoryCard() {
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    supabase
      .from("sponsored_content")
      .select("id, title, summary, image_url, category, sponsor_name, href")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => setItem((data?.[0] as Item) ?? null));
  }, []);

  if (!item) return null;
  const external = /^https?:/.test(item.href);
  const to = external ? item.href : `/sponsored/${item.id}`;
  const body = (
    <>
      {item.image_url && (
        <div className="aspect-[16/9] overflow-hidden rounded-lg bg-muted mb-3">
          <img src={item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        </div>
      )}
      <div className="flex gap-1.5 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{item.category}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded">Sponsored</span>
      </div>
      <h4 className="font-serif font-bold text-sm leading-snug group-hover:text-secondary transition-colors">{item.title}</h4>
      <p className="text-xs text-muted-foreground mt-1">By {item.sponsor_name}</p>
    </>
  );
  return external ? (
    <a href={to} target="_blank" rel="noopener noreferrer sponsored" className="group block">{body}</a>
  ) : (
    <Link to={to} className="group block">{body}</Link>
  );
}
