import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] animate-pulse-glow" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white/80">Ready to create something amazing?</span>
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight">
            Let's Bring Your<br /><span className="text-gradient">Vision to Life</span>
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            Whether it's a commercial, documentary, music video, or social campaign — we're ready to craft something extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="group relative px-10 py-5 bg-accent text-white font-semibold rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-accent/30 hover:scale-105">
              <span className="relative z-10 flex items-center gap-2">Start Your Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-coral to-accent bg-[length:200%_100%] animate-gradient-x" />
            </Link>
            <Link to="/work" className="px-10 py-5 glass rounded-2xl font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all">View Portfolio</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
