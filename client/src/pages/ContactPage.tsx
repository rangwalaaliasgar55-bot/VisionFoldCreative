import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-4xl md:text-6xl mb-4">Get In Touch</h1>
          <p className="text-white/50 text-lg">Tell us about your project. We usually reply within 24 hours.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4 glass rounded-2xl p-5 border border-white/5">
              <Mail className="w-5 h-5 text-accent" />
              <div>
                <div className="text-sm text-white/40">Email</div>
                <div>hello@visionfold.studio</div>
              </div>
            </div>
            <div className="flex items-center gap-4 glass rounded-2xl p-5 border border-white/5">
              <Phone className="w-5 h-5 text-accent" />
              <div>
                <div className="text-sm text-white/40">Phone</div>
                <div>+1 (555) 000-0000</div>
              </div>
            </div>
            <div className="flex items-center gap-4 glass rounded-2xl p-5 border border-white/5">
              <MapPin className="w-5 h-5 text-accent" />
              <div>
                <div className="text-sm text-white/40">Studio</div>
                <div>Los Angeles, CA</div>
              </div>
            </div>
          </div>
          <form onSubmit={submit} className="glass rounded-2xl p-8 border border-white/5 space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Message</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 resize-none" />
            </div>
            <button type="submit" disabled={sending}
              className="w-full py-3 bg-accent text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50">
              <Send className="w-4 h-4" />{sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
