import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";
import TiltCard from "./TiltCard";

const testimonialsList = [
  { name: "Sarah Chen", role: "CMO, TechVision Inc.", content: "VisionFold transformed our product launch video into a cinematic experience. The attention to detail exceeded all expectations.", color: "#6366f1" },
  { name: "Marcus Rivera", role: "Director, GreenPlanet Foundation", content: "Working with VisionFold on our documentary was incredible. They found the emotional core of our story.", color: "#10b981" },
  { name: "Aisha Patel", role: "Artist, Apex Records", content: "The music video they created broke records. The VFX and editing were next-level.", color: "#f43f5e" },
  { name: "James Thornton", role: "Producer, History Channel", content: "Their documentary editing and archival restoration work is unmatched.", color: "#f59e0b" },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-amber/5 rounded-full blur-[150px]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-amber mb-6">Testimonials</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">Loved By<br /><span className="text-gradient">Creators</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonialsList.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.1 }}>
              <TiltCard tiltAmount={8} glowColor={`${t.color}20`}>
                <div className="relative p-8 rounded-2xl glass border border-white/5">
                  <Quote className="absolute top-6 right-6 w-8 h-8 opacity-10" style={{ color: t.color }} />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber text-amber" />)}
                  </div>
                  <p className="text-white/70 leading-relaxed mb-6 text-lg">"{t.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-white/40">{t.role}</div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
