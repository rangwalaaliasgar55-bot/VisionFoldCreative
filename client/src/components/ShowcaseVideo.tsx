import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Clapperboard } from "lucide-react";

const SHOWREEL_SRC = "/showreel/visionfold-showreel.mp4";

export default function ShowcaseVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-void via-[#0c0a08] to-void pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-5"
            >
              <Clapperboard className="w-4 h-4 text-amber" />
              <span className="text-sm text-white/70">Showreel</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-5xl font-bold tracking-tight"
            >
              We don&apos;t sell hope.
              <br />
              <span className="text-gradient">We craft impact.</span>
            </motion.h2>
          </div>
          <p className="text-white/50 max-w-md text-sm md:text-base">
            Tired of poor marketing — tons of strategies, zero results? Got a
            vision? Let&apos;s collab. Shape brands. Make yours unforgettable.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative group rounded-3xl overflow-hidden border border-white/10 bg-black shadow-[0_0_80px_rgba(212,175,55,0.08)]"
        >
          <div className="aspect-[9/16] sm:aspect-video max-h-[70vh] mx-auto bg-black">
            <video
              ref={videoRef}
              src={SHOWREEL_SRC}
              className="w-full h-full object-contain"
              playsInline
              loop
              muted={muted}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!playing && (
              <button
                type="button"
                onClick={togglePlay}
                className="pointer-events-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber text-void flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                aria-label="Play showreel"
              >
                <Play className="w-7 h-7 ml-1 fill-current" />
              </button>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-full glass text-white"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-full glass text-white"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
