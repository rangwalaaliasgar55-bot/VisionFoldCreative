"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { VideoLightbox, parseVideo } from "@/components/VideoLightbox";
import { CSS_EASE, DUR } from "@/lib/motion";

/**
 * Case-study hero player.
 *
 * Poster-first: nothing loads until someone asks for it, which keeps the LCP a
 * static image rather than an embed. Embeddable URLs open in the lightbox;
 * anything we can't embed falls back to a plain link so the button is never a
 * dead end.
 */
export function WorkVideo({
  title,
  videoUrl,
  thumbnailUrl,
}: {
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const video = parseVideo(videoUrl);

  const frame = (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/12 bg-ink shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 960px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-panel to-ink" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {videoUrl && (
        <span
          className="glow-ring absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600/90 text-white backdrop-blur transition-transform duration-300 group-hover:scale-110"
          style={{ transitionTimingFunction: CSS_EASE }}
        >
          <Play size={24} className="ml-1 fill-current" />
        </span>
      )}
    </div>
  );

  if (!videoUrl) return frame;

  // Not embeddable (a Drive link, a client's own player) ΓÇö open it directly.
  if (!video) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label={`Watch ${title}`}
      >
        {frame}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="group block w-full"
        style={{ transition: `transform ${DUR.hoverIn}s ${CSS_EASE}` }}
        aria-label={`Play ${title}`}
      >
        {frame}
      </button>
      <VideoLightbox open={open} video={video} title={title} onClose={() => setOpen(false)} />
    </>
  );
}
