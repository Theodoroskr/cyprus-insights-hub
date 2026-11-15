import { useEffect, useState } from "react";
import { isUprightPicture, videoEmbed } from "@/lib/videoEmbed";

/** The YouTube player attached to a story or press release, shown under the headline.
 *  Vertical videos (Shorts) get an upright player so nothing is cropped or boxed in. */
export function StoryVideo({ url, title }: { url: string | null | undefined; title: string }) {
  const embed = videoEmbed(url);
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    if (!embed) return;
    if (embed.vertical) { setVertical(true); return; }
    setVertical(false);
    let live = true;
    const probe = new Image();
    probe.onload = () => { if (live && isUprightPicture(probe.naturalWidth, probe.naturalHeight)) setVertical(true); };
    probe.src = embed.uprightThumbUrl;
    return () => { live = false; };
  }, [embed?.id, embed?.vertical]);

  if (!embed) return null;
  return (
    <figure className={vertical ? "mb-8 mx-auto w-full max-w-[340px]" : "mb-8 max-w-3xl mx-auto"}>
      <div className={`${vertical ? "aspect-[9/16]" : "aspect-video"} w-full overflow-hidden rounded-lg bg-muted`}>
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
