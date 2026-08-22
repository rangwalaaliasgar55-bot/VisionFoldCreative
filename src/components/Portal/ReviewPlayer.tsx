"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Sliders } from "lucide-react";

/**
 * Real HTML5 review player. Uses the project's video URL when present.
 * Timestamps are frame-accurate to the media clock (currentTime), not a fake slider.
 */
export default function ReviewPlayer({
  src,
  poster,
  onTime,
}: {
  src?: string;
  poster?: string;
  onTime?: (seconds: number, duration: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [split, setSplit] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onMeta = () => setDuration(el.duration || 0);
    const onTick = () => {
      setTime(el.currentTime || 0);
      onTime?.(el.currentTime || 0, el.duration || 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTick);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTick);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [onTime, src]);

  const stamp = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const frame = Math.floor((s % 1) * 24);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}:${String(frame).padStart(2, "0")}`;
  };

  if (!src) {
    return (
      <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 bg-black text-sm text-slate-500">
        No review cut uploaded yet. The studio will drop a video URL on this project when the first pass is ready.
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={`h-full w-full object-contain ${split ? "contrast-125 saturate-125" : ""}`}
        playsInline
        controls={false}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              if (el.paused) void el.play();
              else el.pause();
            }}
            className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, duration)}
            step={1 / 24}
            value={time}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = next;
              setTime(next);
            }}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-brand-500"
          />
          <span className="font-mono text-xs text-slate-300">
            {stamp(time)} / {stamp(duration)}
          </span>
          <button
            onClick={() => setSplit((v) => !v)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${split ? "bg-amber-500/20 text-cyan-300" : "bg-white/10 text-slate-400"}`}
          >
            <Sliders size={13} className="mr-1 inline" /> Grade
          </button>
        </div>
      </div>
    </div>
  );
}
