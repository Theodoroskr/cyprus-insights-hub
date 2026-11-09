import { Rss } from "lucide-react";
import { RSS_HUBS } from "@/lib/rss";

/** Footer block listing the site's RSS feeds (all stories + one per hub). */
export function RssFeedLinks() {
  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-3 text-secondary flex items-center gap-2">
        <Rss className="h-4 w-4" /> RSS Feeds
      </h4>
      <ul className="space-y-1.5 text-sm text-primary-foreground/70">
        <li>
          <a href="/rss.xml" className="hover:text-secondary transition-colors">All stories</a>
        </li>
        {RSS_HUBS.map((hub) => (
          <li key={hub.key}>
            <a href={`/rss/${hub.key}.xml`} className="hover:text-secondary transition-colors">
              {hub.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
