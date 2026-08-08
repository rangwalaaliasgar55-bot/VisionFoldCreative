import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clapperboard, Wand2, Palette, Music, Subtitles, Film, ArrowUpRight } from "lucide-react";
import TiltCard from "./TiltCard";

const servicesList = [
  { icon: Clapperboard, title: "Commercial Editing", description: "High-impact commercials that capture attention and drive conversions.", color: "#6366f1", features: ["4K/8K Workflow", "Color Grading", "Sound Design"] },
  { icon: Wand2, title: "VFX & Motion Graphics", description: "Stunning visual effects and motion graphics that elevate your content.", color: "#f43f5e", features: ["After Effects", "Cinema 4D", "Particle Systems"] },
  { icon: Palette, title: "Color Grading", description: "Cinematic color science that sets the mood and tone.", color: "#f59e0b", features: ["DaVinci Resolve", "Film Emulation", "HDR Grading"] },
  { icon: Music, title: "Audio Post-Production", description: "Crystal-clear audio mixing, sound design, and mastering.", color: "#10b981", features: ["5.1 Surround", "ADR", "Foley"] },
  { icon: Subtitles, title: "Subtitling & Localization", description: "Professional subtitling and localization for global audiences.", color: "#06b6d4", features: ["50+ Languages", "SRT/VTT", "Burn-in"] },
  { icon: Film, title: "Documentary Editing", description: "Story-driven documentary editing that finds the narrative thread.", color: "#8b5cf6", features: ["Archival Integration", "Interview Sync", "Story Structure"] },
];

export default function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="relative py-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-accent mb-6">What We Do</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            Services That<br /><span className="text-gradient">Transform</span>
          </h2>
          <p className="max-w-2xl mx-auto text-white/50 text-lg">
            From raw footage to finished film, we handle every step of the post-production process with precision and artistry.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service, i) => (
            <motion.div key={service.title} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.1 }}>
              <TiltCard className="group h-full" glowColor={`${service.color}40`}>
                <div className="h-full p-8 rounded-2xl glass border border-white/5 hover:border-white/10 transition-colors duration-500">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: `${service.color}15` }}>
                    <service.icon className="w-6 h-6" style={{ color: service.color }} />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 flex items-center gap-2">
                    {service.title}
                    <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">{service.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((f) => (
                      <span key={f} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${service.color}10`, color: service.color }}>{f}</span>
                    ))}
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
