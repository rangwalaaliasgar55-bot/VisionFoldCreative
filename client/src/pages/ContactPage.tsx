import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Instagram, Twitter, Youtube, Linkedin, CheckCircle } from "lucide-react";
import FilmReelScene from "../components/3d/FilmReelScene";
import api from "../hooks/useApi";
import toast from "react-hot-toast";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", projectType: "", budget: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/outreach", form);
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-32 pb-20">
      <div className="absolute inset-0 z-0 opacity-30"><FilmReelScene /></div>
      <div className="absolute inset-0 bg-gradient-to-b from-void via-void/95 to-void z-[1]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">Get In <span className="text-gradient">Touch</span></h1>
          <p className="text-white/50 max-w-xl mx-auto">Have a project in mind? We'd love to hear about it. Fill out the form below and we'll get back to you within 24 hours.</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="lg:col-span-2 space-y-8">
            <div className="glass rounded-2xl p-8 space-y-6">
              <h3 className="font-display font-bold text-xl mb-6">Contact Info</h3>
              {[
                { icon: Mail, color: "#6366f1", label: "Email", value: "hello@visionfold.studio" },
                { icon: Phone, color: "#f43f5e", label: "Phone", value: "+1 (555) 234-5678" },
                { icon: MapPin, color: "#10b981", label: "Studio", value: "Los Angeles, CA" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}20` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="text-sm text-white/40 mb-1">{item.label}</div>
                    <div className="font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl p-8">
              <h3 className="font-display font-bold text-xl mb-6">Follow Us</h3>
              <div className="flex gap-3">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.href} className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors group" aria-label={s.label}>
                    <s.icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-2xl mb-2">Message Sent!</h3>
                  <p className="text-white/50">We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Name</label>
                      <input type="text" required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                      <input type="email" required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Project Type</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all appearance-none" value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}>
                        <option value="" className="bg-void">Select type</option>
                        <option value="commercial" className="bg-void">Commercial</option>
                        <option value="documentary" className="bg-void">Documentary</option>
                        <option value="music-video" className="bg-void">Music Video</option>
                        <option value="social" className="bg-void">Social Media</option>
                        <option value="other" className="bg-void">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Budget Range</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all appearance-none" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                        <option value="" className="bg-void">Select budget</option>
                        <option value="5k-10k" className="bg-void">$5,000 - $10,000</option>
                        <option value="10k-25k" className="bg-void">$10,000 - $25,000</option>
                        <option value="25k-50k" className="bg-void">$25,000 - $50,000</option>
                        <option value="50k+" className="bg-void">$50,000+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Tell us about your project</label>
                    <textarea required rows={5} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none" placeholder="Describe your vision, timeline, and any specific requirements..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <button type="submit" disabled={loading} className="group w-full py-4 bg-accent text-white font-semibold rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-accent/30 relative disabled:opacity-50">
                    <span className="relative z-10 flex items-center justify-center gap-2"><Send className="w-4 h-4" />{loading ? "Sending..." : "Send Message"}</span>
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
