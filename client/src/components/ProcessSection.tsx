import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageSquare, FileVideo, Wand2, MonitorPlay, Rocket } from "lucide-react";

const steps = [
  { number: "01", icon: MessageSquare, title: "Discovery", description: "We dive deep into your brand, audience, and goals.", color: "#6366f1" },
  { number: "02", icon: FileVideo, title: "Ingest & Organize", description: "All footage ingested, backed up, and organized.", color: "#f43f5e" },
  { number: "03", icon: Wand2, title: "The Edit", description: "Our editors craft the narrative and emotional beats.", color: "#f59e0b" },
  { number: "04", icon: MonitorPlay, title: "Color & Sound", description: "Cinematic color grading and immersive sound design.", color: "#10b981" },
  { number: "05", icon: Rocket, title: "Delivery", description: "Multiple format exports and platform optimization.", color: "#06b6d4" },
];

export default function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald/5 rounded-full blur-[150px]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-emerald mb-6">Our Process</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">From Concept<br /><span className="text-gradient">To Screen</span></h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-coral/50 to-emerald/50 hidden lg:block" />
          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, i) => (
              <motion.div key={step.number} initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: i * 0.15 }}
                className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                <div className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <div className={`inline-flex items-center gap-3 mb-4 ${i % 2 === 0 ? "lg:flex-row-reverse" : ""}`}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${step.color}15` }}>
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span className="font-display font-bold text-4xl opacity-20" style={{ color: step.color }}>{step.number}</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed max-w-md mx-auto lg:mx-0">{step.description}</p>
                </div>
                <div className="relative hidden lg:flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className="w-4 h-4 rounded-full" style={{ backgroundColor: step.color, boxShadow: `0 0 20px ${step.color}80` }} />
                  <div className="absolute w-8 h-8 rounded-full opacity-20" style={{ backgroundColor: step.color }} />
                </div>
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
