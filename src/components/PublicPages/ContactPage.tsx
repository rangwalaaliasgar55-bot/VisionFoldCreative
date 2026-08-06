import React, { useState } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { Send, MessageCircle, Mail, MapPin, Loader2, CheckCircle2 } from 'lucide-react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: 'Short Form',
    budgetRange: '₹700 – ₹2,000',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          projectType: 'Short Form',
          budgetRange: '₹700 – ₹2,000',
          message: '',
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Could not send. Try WhatsApp instead.');
      }
    } catch {
      setError('Network error. WhatsApp +91 77250 04639 works anytime.');
    } finally {
      setSubmitting(false);
    }
  };

  const go = (page: string) => {
    window.location.href = page === 'home' ? '/' : `/${page}`;
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#EDEDED]">
      <Navbar currentPage="contact" onNavigate={go} />
      <main className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[480px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Contact Aliasgar</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Tell us what you are building
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#B8B3AA]">
              VisionFold is run by Aliasgar — one editor who actually reads your brief. Share goals,
              platforms, and deadline. Short-form from ₹700; custom packages for brands that need more.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <a
                href="https://wa.me/917725004639?text=Hi%20Aliasgar%2C%20I%20want%20to%20discuss%20a%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 text-[#EDEDED] transition hover:border-[#25D366]/60"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                WhatsApp +91 77250 04639
              </a>
              <a
                href="mailto:visionfoldcreative@gmail.com"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-[#D4AF37]/40"
              >
                <Mail className="h-5 w-5 text-[#D4AF37]" />
                visionfoldcreative@gmail.com
              </a>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#8A857C]">
                <MapPin className="h-5 w-5 text-[#D4AF37]" />
                India · remote worldwide
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {success ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <h2 className="mt-4 text-2xl font-black">Message received</h2>
                <p className="mt-2 max-w-md text-sm text-[#B8B3AA]">
                  Aliasgar will review your brief and reply soon. For something urgent, WhatsApp is fastest.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-6 rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-white/10 bg-[#0C0C10]/90 p-6 shadow-2xl backdrop-blur sm:p-8"
              >
                {error ? (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Name *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Priya from Mumbai"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@brand.com"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Phone *</label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98xxx xxxxx"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Company</label>
                    <input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Brand or channel name"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Project type</label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      <option>Short Form</option>
                      <option>Brand Content</option>
                      <option>Social Media Pack</option>
                      <option>Long Form (custom)</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Budget</label>
                    <select
                      value={formData.budgetRange}
                      onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      <option>₹700 – ₹2,000</option>
                      <option>₹2,000 – ₹7,000</option>
                      <option>₹7,000 – ₹15,000</option>
                      <option>Custom / not sure</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8A857C]">Brief *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Platform, length, deadline, references — whatever helps Aliasgar quote accurately."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Sending…' : 'Send to studio'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer onAdminClick={() => { window.location.href = '/admin'; }} />
    </div>
  );
}

export default ContactPage;
