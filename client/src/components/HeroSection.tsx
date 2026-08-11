import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Zap } from "lucide-react";
import FilmReelScene from "./3d/FilmReelScene";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.55], [1, 0.96]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <FilmReelScene />

      <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-void/70 via-transparent to-void/70 z-10 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-25 z-[5]" />

      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-20 max-w-5xl mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center"
        >
          <img
            src="/brand/visionfold-mark.svg"
            alt="VisionFold Creative Studio"
            className="w-28 h-28 md:w-36 md:h-36 object-contain text-white drop-shadow-[0_0_40px_rgba(212,175,55,0.25)]"
          />
          <p className="mt-4 text-[11px] md:text-xs tracking-[0.35em] uppercase text-white/45">
            Edit · Create · Inspire
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-7"
        >
          <Zap className="w-4 h-4 text-amber" />
          <span className="text-sm font-medium text-white/80">
            Premium video & digital storytelling
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.92] tracking-tight mb-6"
        >
          VISION
          <span className="text-gradient">FOLD</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.45 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-4 leading-relaxed"
        >
          Creative studio for brands that want impact — not noise.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="max-w-xl mx-auto text-sm md:text-base text-white/35 mb-10"
        >
          We craft visual stories that move people. From reels to launch films —
          edited with precision, designed to be unforgettable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/contact"
            className="group relative px-8 py-4 bg-amber text-void font-semibold rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-amber/25 hover:scale-[1.03]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start a project
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <a
            href="#showreel"
            className="group flex items-center gap-3 px-8 py-4 glass rounded-2xl hover:bg-white/10 transition-all hover:scale-[1.03]"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
            <span className="font-medium text-white/80 group-hover:text-white">
              Watch showreel
            </span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: "200+", label: "Projects" },
            { value: "15", label: "Cities reached" },
            { value: "50+", label: "Clients" },
            { value: "4K", label: "Delivery" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.08 }}
              className="text-center"
            >
              <div className="font-display font-bold text-2xl md:text-3xl text-gradient mb-1">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent z-20 pointer-events-none" />
    </section>
  );
}
