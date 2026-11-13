import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { storyImage } from "@/lib/fallbackImage";
import { useHomepageStories } from "@/hooks/useHomepageStories";

/** "Full coverage": several recent stories about one company or topic, grouped like a news package. */
export function StoryPackage() {
  const { pkg } = useHomepageStories();
  if (!pkg) return null;
  const [first, ...rest] = pkg.stories as any[];
  const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

  return (
    <section className="container mx-auto px-4 pt-10" aria-labelledby="story-package-title">
      <div className="border-t-4 border-foreground pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-secondary">Full coverage</p>
            <h2 id="story-package-title" className="font-serif text-2xl md:text-3xl font-bold text-foreground leading-tight">{pkg.label}</h2>
          </div>
          <Link to={pkg.href} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-secondary hover:gap-2 transition-all">
            {pkg.kind === "company" ? "Company profile" : "All stories on this topic"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <Link to={`/article/${first.id}`} className="md:col-span-6 group block">
            <div className="overflow-hidden aspect-[16/9] bg-muted mb-3">
              <img src={storyImage(first.image_url, first.vertical, first.id, first.body_markdown)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground leading-snug group-hover:text-secondary transition-colors line-clamp-3">{first.title || first.what_happened}</h3>
            <p className="text-xs text-muted-foreground mt-1">{ago(first.published_at)}</p>
          </Link>
          <ul className="md:col-span-6 divide-y divide-border">
            {rest.map((s) => (
              <li key={s.id}>
                <Link to={`/article/${s.id}`} className="group flex gap-4 py-3 first:pt-0">
                  <div className="w-24 h-16 flex-shrink-0 overflow-hidden bg-muted">
                    <img src={storyImage(s.image_url, s.vertical, s.id, s.body_markdown)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-[15px] font-semibold text-foreground leading-snug group-hover:text-secondary transition-colors line-clamp-3">{s.title || s.what_happened}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ago(s.published_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
