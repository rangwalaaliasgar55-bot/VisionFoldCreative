import React, { useRef, useState } from 'react';
import { Clapperboard, Pause, Play, Volume2, VolumeX } from 'lucide-react';

const SRC = '/showreel/visionfold-showreel.mp4';

export const ShowreelSection: React.FC = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section id="showreel" className="relative z-10 border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/40 px-4 py-2">
              <Clapperboard className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Showreel</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-[-0.04em] md:text-5xl">
              We don&apos;t sell hope.
              <br />
              <span className="gold-gradient-text">We craft impact.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#B8B3AA]">
            Tired of poor marketing — tons of strategies, zero results? Got a vision? Let&apos;s collab.
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black">
          <div className="mx-auto aspect-[9/16] max-h-[70vh] sm:aspect-video">
            <video
              ref={ref}
              src={SRC}
              className="h-full w-full object-contain"
              playsInline
              loop
              muted={muted}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>
          {!playing && (
            <button
              type="button"
              onClick={toggle}
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-xl transition hover:scale-105"
              aria-label="Play showreel"
            >
              <Play className="ml-1 h-7 w-7 fill-current" />
            </button>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100">
            <button type="button" onClick={toggle} className="rounded-full border border-white/15 bg-black/50 p-2 text-white" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                const v = ref.current;
                if (!v) return;
                v.muted = !v.muted;
                setMuted(v.muted);
              }}
              className="rounded-full border border-white/15 bg-black/50 p-2 text-white"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
