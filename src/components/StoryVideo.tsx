import { videoEmbed } from "@/lib/videoEmbed";

/** The YouTube player attached to a story or press release, shown under the headline. */
export function StoryVideo({ url, title }: { url: string | null | undefined; title: string }) {
  const embed = videoEmbed(url);
  if (!embed) return null;
  return (
    <figure className="mb-8 max-w-3xl mx-auto">
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <iframe
          src={embed.embedUrl}
          title={title}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption className="text-xs text-muted-foreground mt-2">Video: YouTube</figcaption>
    </figure>
  );
}
