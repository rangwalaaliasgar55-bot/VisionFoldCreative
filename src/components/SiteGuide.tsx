"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, Volume2, VolumeX, X } from "lucide-react";
import { CSS_EASE, DUR, EASE, SPRING, usePrefersReducedMotion } from "@/lib/motion";

/**
 * The site guide ΓÇö a character who explains the studio to first-time visitors.
 *
 * Deliberate behaviours:
 *  ┬╖ Renders NOTHING until the video is confirmed to exist, so the repo ships
 *    safely before the file does (no broken player, no console noise).
 *  ┬╖ Never autoplays with sound. It waits to be invited.
 *  ┬╖ Captions are on by default ΓÇö most people watch muted the first time.
 *  ┬╖ A dismissal is remembered, so returning visitors are not nagged.
 *  ┬╖ Sits above the WhatsApp button rather than fighting it for the corner.
 */
export default function SiteGuide({
  src = process.env.NEXT_PUBLIC_SITE_GUIDE_SRC || "/guide/site-guide.mp4",
  poster = "/guide/site-guide.jpg",
  captions = "/guide/site-guide.vtt",
  name = "Studio guide",
}: {
  src?: string;
  poster?: string;
  captions?: string;
  name?: string;
}) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  // Read once at init rather than in an effect: the component renders null on
  // both server and first client paint (available starts false), so there is no
  // hydration mismatch and no cascading render.
  const [dismissed, setDismissed] = useState(() =>
    typeof window === "undefined" ? true : localStorage.getItem("vf-guide-dismissed") === "1"
  );
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();

  // Probe before rendering anything: a HEAD request tells us whether the video
  // has actually been added yet.
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const res = await fetch(src, { method: "HEAD" });
        const type = res.headers.get("content-type") || "";
        if (!cancelled && res.ok && !type.includes("text/html")) setAvailable(true);
      } catch {
        /* missing or offline ΓÇö stay hidden */
      }
    };
    probe();
    return () => {
      cancelled = true;
    };
  }, [src]);

  const close = () => {
    setOpen(false);
    videoRef.current?.pause();
  };

  const dismiss = () => {
    close();
    setDismissed(true);
    localStorage.setItem("vf-guide-dismissed", "1");
  };

  const openAndPlay = () => {
    setOpen(true);
    // User-initiated, so sound is allowed by autoplay policy.
    requestAnimationFrame(() => void videoRef.current?.play().catch(() => undefined));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!available || dismissed) return null;

  const ease = EASE as unknown as [number, number, number, number];

  return (
    <>
      {/* Invitation pill ΓÇö above the WhatsApp button, never on top of it */}
      <AnimatePresence>
        {!open && (
          <m.button
            key="guide-pill"
            onClick={openAndPlay}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={SPRING}
            className="glass fixed bottom-24 right-5 z-40 flex items-center gap-2.5 rounded-full border border-brand-400/30 py-2 pl-2 pr-4 text-left shadow-[0_12px_40px_-12px_rgba(115,87,255,0.7)] transition-colors hover:border-brand-400/60"
            style={{ transitionDuration: `${DUR.hoverIn}s`, transitionTimingFunction: CSS_EASE }}
            aria-label={`Play the ${name} ΓÇö a short tour of the site`}
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-amber">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt="" className="h-full w-full object-cover" />
              ) : (
                <MessageCircle size={16} className="text-white" />
              )}
              <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-bold text-white">New here?</span>
              <span className="block text-[10px] text-slate-400">30-second tour</span>
            </span>
            <span className="relative ml-1 flex h-2 w-2">
              {!reduced && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-60" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
            </span>
          </m.button>
        )}
      </AnimatePresence>

      {/* Player card */}
      <AnimatePresence>
        {open && (
          <m.div
            key="guide-card"
            role="dialog"
            aria-modal="false"
            aria-label={name}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: DUR.reveal * 0.8, ease }}
            className="fixed bottom-24 right-5 z-40 w-[min(88vw,320px)] overflow-hidden rounded-3xl border border-white/12 bg-[#0B1020]/95 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3.5 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{name}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    if (videoRef.current) videoRef.current.muted = next;
                  }}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  onClick={close}
                  aria-label="Close the guide"
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <video
              ref={videoRef}
              src={src}
              poster={poster}
              playsInline
              controls
              muted={muted}
              onEnded={close}
              onError={() => setAvailable(false)}
              className="block w-full bg-black"
            >
              <track default kind="captions" srcLang="en" label="English" src={captions} />
            </video>

            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
              <a
                href="/contact"
                className="rounded-full bg-[#7357FF] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#6346E8]"
              >
                Send a brief
              </a>
              <button
                onClick={dismiss}
                className="text-[10px] text-slate-500 underline-offset-4 transition-colors hover:text-slate-300 hover:underline"
              >
                Don&rsquo;t show again
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
