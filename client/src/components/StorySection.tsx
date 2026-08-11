import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Film, Scissors, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: Film,
    title: "Edit",
    text: "Hook-first cuts, kinetic captions, and platform-ready masters for Reels, Shorts, and ads.",
  },
  {
    icon: Sparkles,
    title: "Create",
    text: "Founder stories, launch films, and brand systems designed to stop the scroll.",
  },
  {
    icon: Scissors,
    title: "Inspire",
    text: "Craft that shapes perception — so your brand is remembered, not scrolled past.",
  },
];

export default function StorySection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(ellipse_at_80%_30%,rgba(212,175,55,0.1),transparent_45%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-amber text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            >
              VisionFold Creative Studio
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6"
            >
              A strategic creative
              <br />
              partner for brands
              <br />
              that refuse to blend in.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-white/55 text-base md:text-lg mb-8 max-w-lg"
            >
              From Mumbai to the world — we turn raw footage and half-formed ideas
              into sharp, memorable content. Edit. Create. Inspire.
            </motion.p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber text-void font-semibold hover:bg-amber/90 transition-colors"
            >
              Start a project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-2xl glass border border-white/10 hover:border-amber/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-amber" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{p.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
