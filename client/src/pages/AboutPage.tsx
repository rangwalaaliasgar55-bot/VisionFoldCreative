import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Users, Globe, Film } from "lucide-react";
import AnimatedCounter from "../components/AnimatedCounter";
import CTASection from "../components/CTASection";

const stats = [
  { value: 200, suffix: "+", label: "Projects", icon: Film },
  { value: 50, suffix: "+", label: "Clients", icon: Users },
  { value: 15, suffix: "+", label: "Awards", icon: Award },
  { value: 12, suffix: "", label: "Countries", icon: Globe },
];

const team = [
  { name: "Alex Rivera", role: "Founder & Creative Director", initials: "AR", color: "#6366f1" },
  { name: "Jordan Lee", role: "Head of Post-Production", initials: "JL", color: "#f43f5e" },
  { name: "Sam Okonkwo", role: "Lead Colorist", initials: "SO", color: "#10b981" },
  { name: "Maya Chen", role: "VFX Supervisor", initials: "MC", color: "#f59e0b" },
];

export default function AboutPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-4xl md:text-6xl mb-4">About VisionFold</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">We craft visual stories that move audiences and drive results.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-6 text-center">
              <stat.icon className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="font-display font-bold text-3xl text-gradient mb-1"><AnimatedCounter value={stat.value} suffix={stat.suffix} /></div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="mb-20">
          <h2 className="font-display font-bold text-3xl mb-8 text-center">Our Story</h2>
          <div className="glass rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <p className="text-white/60 leading-relaxed mb-6">Founded in 2018, VisionFold Creative started as a small editing suite. We believe every frame matters.</p>
            <p className="text-white/60 leading-relaxed">Today our team of editors, colorists, and VFX artists delivers world-class content for brands and creators worldwide.</p>
          </div>
        </div>
        <div className="mb-20">
          <h2 className="font-display font-bold text-3xl mb-8 text-center">Meet The Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.1 }} className="glass rounded-2xl p-6 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-display font-bold text-2xl" style={{ backgroundColor: `${member.color}20`, color: member.color }}>
                  {member.initials}
                </div>
                <h3 className="font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-white/40">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <CTASection />
    </div>
  );
}
