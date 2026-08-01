import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { VisionFoldLogo } from '../VisionFoldLogo';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [projectType, setProjectType] = useState('Short Form');
  const [budgetRange, setBudgetRange] = useState('₹10,000 - ₹25,000');
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.sendMessage({
        name,
        email,
        phone,
        company,
        projectType,
        budgetRange,
        deadline,
        message,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-20 bg-[#08090d] font-sans">
      {/* Title */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <VisionFoldLogo size="lg" variant="full" className="mx-auto mb-6" />

        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          Let's Build Something <span className="text-amber-400">Unforgettable</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300 mt-4 font-light leading-relaxed">
          Send us your raw footage concepts or project inquiry below.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-8">
        {/* Contact Info Sidebar */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-6">Direct Studio Contact</h2>

            <div className="space-y-6 text-xs font-mono">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1 tracking-widest">
                  EMAIL INQUIRIES
                </span>
                <a
                  href="mailto:visionfoldcreative@gmail.com"
                  className="flex items-center gap-2 text-amber-400 font-bold hover:underline text-xs"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  visionfoldcreative@gmail.com
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1 tracking-widest">
                  WHATSAPP DIRECT
                </span>
                <a
                  href="https://wa.me/917725004639"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  WhatsApp: +91 7725004639
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1 tracking-widest">
                  EDITING LEAD
                </span>
                <p className="text-slate-200 font-bold text-xs">
                  Aliasgar (Owner & Lead Editor)
                </p>
                <p className="text-slate-400 mt-1">2+ years turning raw footage into results.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b0d13] border border-[#1a1d28] text-xs font-mono text-slate-400 space-y-2 shadow-xl">
            <p className="font-bold text-slate-200 uppercase">Turnaround Commitment</p>
            <p className="font-light leading-relaxed">
              All project inquiries receive a direct response within 12 hours. For instantaneous consultation, reach Aliasgar directly via WhatsApp.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="md:col-span-7 bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 sm:p-10 shadow-xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Inquiry Received!</h3>
              <p className="text-slate-300 max-w-md mx-auto text-xs font-light leading-relaxed">
                Thank you for reaching out to Vision Fold Creative. Aliasgar will review your project requirements and respond via email or WhatsApp shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#10121a] text-slate-200 border border-[#181b26] hover:bg-[#141722] font-mono text-xs font-bold uppercase"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">Project Brief</h2>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Mehta"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram@company.com"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Company / Channel Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Mehta Media"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Project Format
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Short Form">Short Form (Reels/Shorts/TikTok)</option>
                    <option value="Long Form">Long Form (YouTube/Docu/Interview)</option>
                    <option value="Brand Content">Brand & Product Adverts</option>
                    <option value="Retainer Batch">Monthly Editing Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Budget Range (INR)
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                    <option value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</option>
                    <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                    <option value="₹50,000+">₹50,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                  Project Details & Footage Links *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your footage length, target platform, desired style, or share Google Drive / Dropbox raw video links..."
                  className="w-full px-4 py-3 bg-[#10121a] border border-[#181b26] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {submitting ? 'Sending Brief...' : 'Send Inquiry To Aliasgar'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
