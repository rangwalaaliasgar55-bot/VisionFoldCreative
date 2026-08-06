import React, { useState } from 'react';
import { ThreeHero } from '../ThreeHero';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: 'Short Form',
    budgetRange: '₹10,000 - ₹25,000',
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
          budgetRange: '₹10,000 - ₹25,000',
          message: '',
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0B] px-4 py-20">
      <div className="pointer-events-none absolute inset-0 opacity-30"><ThreeHero /></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.18),transparent_28%),linear-gradient(180deg,rgba(10,10,11,0.20),#0A0A0B_78%)]" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDED] mb-4">Get in Touch</h1>
          <p className="text-[#A0A0A0] max-w-2xl mx-auto">
            Ready to transform your content? Let's discuss your project and create something amazing together.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-2 lg:p-8">
          <div>
            <h2 className="text-xl font-semibold text-[#EDEDED] mb-6">Send Us a Message</h2>
            
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg">
                <p className="text-green-400">Message sent successfully! We'll get back to you soon.</p>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#EDEDED] mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#EDEDED] mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#EDEDED] mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#EDEDED] mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Your company (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#EDEDED] mb-1">Project Type</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option>Short Form</option>
                    <option>Brand Content</option>
                    <option>Long Form</option>
                    <option>Documentary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#EDEDED] mb-1">Budget Range</label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option>₹10,000 - ₹25,000</option>
                    <option>₹25,000 - ₹50,000</option>
                    <option>₹50,000 - ₹1,00,000</option>
                    <option>₹1,00,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EDEDED] mb-1">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-[#141416] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37] resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#D4AF37] text-[#0A0A0B] font-semibold rounded-lg hover:bg-[#E5C04B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#EDEDED] mb-6">Contact Info</h2>
            <div className="space-y-6">
              <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
                <h3 className="text-[#EDEDED] font-medium mb-2">Email</h3>
                <a href="mailto:visionfoldcreative@gmail.com" className="text-[#D4AF37] hover:underline">
                  visionfoldcreative@gmail.com
                </a>
              </div>
              <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
                <h3 className="text-[#EDEDED] font-medium mb-2">Phone</h3>
                <a href="tel:+917725004639" className="text-[#D4AF37] hover:underline">
                  +91 7725004639
                </a>
              </div>
              <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
                <h3 className="text-[#EDEDED] font-medium mb-2">Response Time</h3>
                <p className="text-[#A0A0A0]">We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
