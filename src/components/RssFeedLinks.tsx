import { Globe2, Layers, Rss, Tags } from "lucide-react";
import { RSS_FEED_GROUPS, type RssFeedGroup } from "@/lib/rss";
import { SITE_URL } from "@/lib/sitemap";

const GROUP_ICONS: Record<RssFeedGroup["title"], typeof Rss> = {
  Editions: Globe2,
  Topics: Tags,
  Everything: Layers,
};

/** Footer band listing every feed the site publishes, grouped by what a reader wants. */
export function RssFeedLinks() {
  return (
    <section className="mt-10 rounded-xl border border-navy-light bg-navy-light/40 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
          <Rss className="h-4 w-4" />
        </span>
        <div>
          <h4 className="font-semibold text-secondary">RSS feeds</h4>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-primary-foreground/60">
            Add any feed to your reader — Feedly, Outlook, Safari or a news app. New stories arrive on their own,
            with no sign-up and no tracking.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {RSS_FEED_GROUPS.map((group) => {
          const Icon = GROUP_ICONS[group.title] ?? Rss;
          return (
            <div key={group.title}>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70">
                <Icon className="h-3 w-3 text-secondary" />
                {group.title}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {group.feeds.map((feed) => (
                  <li key={feed.path}>
                    <a
                      href={feed.path}
                      type="application/rss+xml"
                      title={SITE_URL + feed.path}
                      className="inline-flex items-center gap-1 rounded-full border border-navy-light bg-navy-light/50 px-2.5 py-1 text-xs text-primary-foreground/80 transition-colors hover:border-secondary/60 hover:text-secondary"
                    >
                      {feed.label}
                      {feed.note && <span className="text-primary-foreground/45">· {feed.note}</span>}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] leading-relaxed text-primary-foreground/60">{group.blurb}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
