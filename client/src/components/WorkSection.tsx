import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ExternalLink, Eye, Play } from "lucide-react";
import TiltCard from "./TiltCard";

const projects = [
  { id: 1, title: "Neon Horizons", category: "Commercial", client: "TechVision Inc.", description: "A futuristic brand film featuring cyberpunk aesthetics.", color: "#6366f1", stats: { views: "2.4M" } },
  { id: 2, title: "Echoes of Earth", category: "Documentary", client: "GreenPlanet Foundation", description: "An emotional documentary about climate change.", color: "#10b981", stats: { views: "1.8M" } },
  { id: 3, title: "Velocity Rush", category: "Music Video", client: "Apex Records", description: "High-octane music video with explosive VFX.", color: "#f43f5e", stats: { views: "5.1M" } },
  { id: 4, title: "The Architect", category: "Short Film", client: "Indie Collective", description: "Award-winning short film exploring space and memory.", color: "#f59e0b", stats: { views: "890K" } },
  { id: 5, title: "Pulse Fitness", category: "Social Media", client: "Pulse Gym", description: "Energetic social media campaign with bold transitions.", color: "#06b6d4", stats: { views: "3.2M" } },
  { id: 6, title: "Silent Witness", category: "Documentary", client: "History Channel", description: "Historical documentary with archival restoration.", color: "#8b5cf6", stats: { views: "1.2M" } },
];

const categories = ["All", "Commercial", "Documentary", "Music Video", "Short Film", "Social Media"];

export default function WorkSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const filtered = activeCategory === "All" ? projects : projects.filter((p) => p.category === activeCategory);

  return (
    <section id="work" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-coral/5 rounded-full blur-[150px]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-coral mb-6">Portfolio</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">Selected<br /><span className="text-gradient">Work</span></h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat ? "bg-accent text-white" : "glass text-white/60 hover:text-white"
              }`}>{cat}</button>
          ))}
        </div>

        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div key={project.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onMouseEnter={() => setHoveredProject(project.id)} onMouseLeave={() => setHoveredProject(null)}>
                <TiltCard className="group" glowColor={`${project.color}30`}>
                  <div className="rounded-2xl glass border border-white/5 overflow-hidden">
                    <div className="relative h-48 overflow-hidden" style={{ background: `linear-gradient(135deg, ${project.color}30, transparent)` }}>
                      <motion.div animate={{ scale: hoveredProject === project.id ? 1 : 0.8, opacity: hoveredProject === project.id ? 1 : 0 }}
                        className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: `${project.color}40` }}>
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </motion.div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md" style={{ backgroundColor: `${project.color}30`, color: project.color }}>{project.category}</span>
                      </div>
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-white/60 backdrop-blur-md px-2 py-1 rounded-lg bg-black/20">
                        <Eye className="w-3 h-3" />{project.stats.views}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display font-bold text-lg group-hover:text-accent transition-colors">{project.title}</h3>
                        <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors" />
                      </div>
                      <p className="text-sm text-white/40 mb-1">{project.client}</p>
                      <p className="text-sm text-white/50 leading-relaxed">{project.description}</p>
                    </div>
                    <motion.div className="h-0.5" style={{ backgroundColor: project.color }} initial={{ scaleX: 0 }} animate={{ scaleX: hoveredProject === project.id ? 1 : 0 }} transition={{ duration: 0.3 }} />
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
