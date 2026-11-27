import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Linkedin, Facebook, Twitter, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPackageLinks } from "@/hooks/useHomepageStories";
import { featuredShareHref, featuredStoryUrl, slugFromHref } from "@/lib/featuredShare";

/** "Is your company in this story?" box: approved linked companies, each with tagged share links. */
export function FeaturedCompaniesShare({ articleId, storyUrl, title, greek }: { articleId: string; storyUrl: string; title: string; greek?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["featured-companies", articleId],
    queryFn: () => fetchPackageLinks([articleId]),
    staleTime: 5 * 60_000,
  });
  const seen = new Set<string>();
  const companies = (data ?? []).filter((c) => c.entity_label && !seen.has(c.entity_id) && seen.add(c.entity_id)).slice(0, 4);
  if (companies.length === 0) return null;

  const copy = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(featuredStoryUrl(storyUrl, "copy", slug));
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section aria-labelledby="featured-companies" className="mb-10 rounded-xl border border-secondary/30 bg-secondary/5 p-5">
      <h2 id="featured-companies" className="section-label mb-1">{greek ? "Αναφέρεται η εταιρεία σας;" : "Is your company in this story?"}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {greek ? "Μοιραστείτε το με τους ακόλουθούς σας." : "Share it with your followers and clients."}
      </p>
      <ul className="space-y-3">
        {companies.map((c) => {
          const slug = slugFromHref(c.href);
          return (
            <li key={c.entity_id} className="flex flex-wrap items-center gap-2 justify-between">
              {c.href ? (
                <Link to={c.href} className="font-semibold text-foreground hover:text-secondary">{c.entity_label}</Link>
              ) : (
                <span className="font-semibold text-foreground">{c.entity_label}</span>
              )}
              <div className="flex gap-1.5">
                <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                  <a href={featuredShareHref(storyUrl, "linkedin", slug, title)} target="_blank" rel="noopener noreferrer" aria-label={`Share on LinkedIn for ${c.entity_label}`}><Linkedin className="h-3.5 w-3.5" />LinkedIn</a>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-8 px-2">
                  <a href={featuredShareHref(storyUrl, "facebook", slug, title)} target="_blank" rel="noopener noreferrer" aria-label={`Share on Facebook for ${c.entity_label}`}><Facebook className="h-3.5 w-3.5" /></a>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-8 px-2">
                  <a href={featuredShareHref(storyUrl, "x", slug, title)} target="_blank" rel="noopener noreferrer" aria-label={`Share on X for ${c.entity_label}`}><Twitter className="h-3.5 w-3.5" /></a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => copy(slug, c.entity_id)} aria-label={`Copy link for ${c.entity_label}`}>
                  {copied === c.entity_id ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
