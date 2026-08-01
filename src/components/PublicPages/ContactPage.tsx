import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { VisionFoldLogo } from '../VisionFoldLogo';

export const ContactPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [footageLink, setFootageLink] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [platform, setPlatform] = useState('YouTube (16:9)');
  const [styleReference, setStyleReference] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }
    
    setError('');
    setSubmitting(true);

    try {
      await api.sendMessage({
        name,
        email,
        phone,
        company: platform,
        projectType: targetGoal,
        budgetRange: 'Custom',
        deadline: 'Standard',
        message: `Footage: ${footageLink}\nReferences: ${styleReference}`,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-brand-text pb-32 bg-brand-bg font-sans selection:bg-brand-accent selection:text-brand-bg">
      {/* Title */}
      <section className="pt-24 pb-16 px-6 max-w-4xl mx-auto text-center">
        <VisionFoldLogo size="lg" variant="icon-only" color="light" className="mx-auto mb-8" />
        <h1 className="text-4xl sm:text-5xl font-semibold uppercase tracking-[-0.03em] mb-4">
          Client Onboarding Portal
        </h1>
        <p className="text-sm text-brand-muted font-light">
          Complete the 3-step async intake form below to initiate your project with Aliasgar.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6">
        <div className="bg-brand-surface border border-brand-border p-8 sm:p-12">
          {submitted ? (
            <div className="text-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent text-brand-accent flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold uppercase tracking-tight">Brief Received</h3>
              <p className="text-brand-muted text-sm max-w-md mx-auto font-light leading-relaxed">
                Aliasgar is reviewing your footage and references. You will receive an email within 12 hours outlining the project timeline.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex-1 h-1 bg-brand-border overflow-hidden">
                    <div 
                      className="h-full bg-brand-accent transition-all duration-500"
                      style={{ width: step >= num ? '100%' : '0%' }}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-950/30 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Footage */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-brand-accent text-xs tracking-[0.2em] uppercase font-bold">Step 01</div>
                  <h2 className="text-2xl font-semibold tracking-tight">Footage Handoff</h2>
                  
                  <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-[0.1em] text-brand-muted">
                      Raw Footage Link (Frame.io, Dropbox, Drive) *
                    </label>
                    <input
                      type="url"
                      required
                      value={footageLink}
                      onChange={(e) => setFootageLink(e.target.value)}
                      placeholder="https://frame.io/..."
                      className="w-full px-5 py-4 bg-[#0a0a0b] border border-brand-border text-brand-text text-sm focus:border-brand-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Target & Platform */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-brand-accent text-xs tracking-[0.2em] uppercase font-bold">Step 02</div>
                  <h2 className="text-2xl font-semibold tracking-tight">Target Goal & Platform</h2>
                  
                  <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-[0.1em] text-brand-muted">Primary Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full px-5 py-4 bg-[#0a0a0b] border border-brand-border text-brand-text text-sm focus:border-brand-accent focus:outline-none appearance-none"
                    >
                      <option>YouTube (16:9)</option>
                      <option>Instagram Reels (9:16)</option>
                      <option>TikTok (9:16)</option>
                      <option>Multi-Platform (Both)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-[0.1em] text-brand-muted">Target Metric Goal *</label>
                    <textarea
                      required
                      rows={3}
                      value={targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value)}
                      placeholder="e.g. Maximize average view duration above 50%, drive link clicks, or build brand authority..."
                      className="w-full px-5 py-4 bg-[#0a0a0b] border border-brand-border text-brand-text text-sm focus:border-brand-accent focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Style & Contact */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-brand-accent text-xs tracking-[0.2em] uppercase font-bold">Step 03</div>
                  <h2 className="text-2xl font-semibold tracking-tight">Style References & Contact</h2>
                  
                  <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-[0.1em] text-brand-muted">Style Reference Links *</label>
                    <textarea
                      required
                      rows={2}
                      value={styleReference}
                      onChange={(e) => setStyleReference(e.target.value)}
                      placeholder="Links to videos with the pacing, color, or sound design you want..."
                      className="w-full px-5 py-4 bg-[#0a0a0b] border border-brand-border text-brand-text text-sm focus:border-brand-accent focus:outline-none resize-none"
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name *"
                      className="w-full px-5 py-4 bg-[#0a0a0b] border border-brand-border text-brand-text text-sm focus:border-brand-accent focus:outline-none"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address *"
                      className="w-full px-5 py-4 bg-[#0a0a0b] border border-brand-border text-brand-text text-sm focus:border-brand-accent focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-brand-border">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-6 py-4 border border-brand-border hover:border-brand-text text-brand-text transition-colors flex items-center justify-center text-xs font-bold uppercase tracking-[0.1em]"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-brand-text text-brand-bg font-bold uppercase text-xs tracking-[0.1em] hover:bg-white transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {step < 3 ? (
                    <>Continue to Step 0{step + 1} <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>{submitting ? 'Submitting...' : 'Submit Brief'} <Send className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
