import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Zap } from "lucide-react";
import FilmReelScene from "./3d/FilmReelScene";
import AnimatedCounter from "./AnimatedCounter";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <FilmReelScene />
      <div className="absolute inset-0 bg-gradient-to-b from-void/30 via-transparent to-void z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-void/60 via-transparent to-void/60 z-10 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-30 z-[5]" />

      <motion.div style={{ y, opacity, scale }} className="relative z-20 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <Zap className="w-4 h-4 text-amber" />
          <span className="text-sm font-medium text-white/80">Premium Video Editing Studio</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6"
        >
          We Craft<br /><span className="text-gradient">Visual Stories</span><br />That Move.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-10 leading-relaxed"
        >
          VisionFold Creative transforms raw footage into cinematic masterpieces. From commercials to documentaries, we bring your vision to life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/work" className="group relative px-8 py-4 bg-accent text-white font-semibold rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-accent/30 hover:scale-105">
            <span className="relative z-10 flex items-center gap-2">
              View Our Work <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-coral to-accent bg-[length:200%_100%] animate-gradient-x" />
          </Link>
          <Link to="/contact" className="group flex items-center gap-3 px-8 py-4 glass rounded-2xl hover:bg-white/10 transition-all hover:scale-105">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
            <span className="font-medium text-white/80 group-hover:text-white">Watch Reel</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: 200, suffix: "+", label: "Projects Delivered" },
            { value: 50, suffix: "+", label: "Global Clients" },
            { value: 15, suffix: "+", label: "Awards Won" },
            { value: 4, suffix: "K", label: "Resolution Standard" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.1 }} className="text-center">
              <div className="font-display font-bold text-2xl md:text-3xl text-gradient mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent z-20" />
    </section>
  );
}
