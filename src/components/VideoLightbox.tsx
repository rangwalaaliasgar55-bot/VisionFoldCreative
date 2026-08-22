"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { DUR, EASE } from "@/lib/motion";

export type ParsedVideo = { kind: "youtube" | "vimeo" | "file"; src: string };

/**
 * Recognise the URLs a studio actually pastes into a CMS. Anything we can't
 * embed returns null so the caller can fall back to opening a normal link.
 */
export function parseVideo(url: string | null | undefined): ParsedVideo | null {
  if (!url) return null;
  const clean = url.trim();
  if (!clean) return null;

  const yt =
    clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) {
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    };
  }

  const vimeo = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  }

  if (/\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(clean)) {
    return { kind: "file", src: clean };
  }

  return null;
}

/**
 * Full-bleed video lightbox ΓÇö keeps people inside the studio instead of
 * bouncing them to YouTube. Escape closes, focus is trapped and restored,
 * the page behind is locked, and nothing is mounted until it opens (so no
 * hidden iframe is ever phoning home).
 */
export function VideoLightbox({
  open,
  onClose,
  video,
  title,
}: {
  open: boolean;
  onClose: () => void;
  video: ParsedVideo | null;
  title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], iframe, video, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true })
    );

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  const ease = EASE as unknown as [number, number, number, number];

  return (
    <AnimatePresence>
      {open && video && (
        <m.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-8"
          onMouseDown={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.hoverIn, ease }}
        >
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} ΓÇö video player`}
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: DUR.reveal * 0.7, ease }}
            className="relative w-full max-w-5xl"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-display truncate text-sm font-semibold text-white sm:text-base">
                {title}
              </p>
              <button
                onClick={onClose}
                aria-label="Close video"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]">
              {video.kind === "file" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={video.src}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full"
                />
              ) : (
                <iframe
                  src={video.src}
                  title={title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-500">
              Press <kbd className="rounded border border-white/15 px-1">Esc</kbd> to close
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
