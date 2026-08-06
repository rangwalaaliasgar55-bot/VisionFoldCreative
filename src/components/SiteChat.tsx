import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

type Msg = { role: 'bot' | 'user'; text: string };

const STARTERS = [
  'What services do you offer?',
  'How much for short-form reels?',
  'I want a custom quote',
  'Talk to a human',
];

function botReply(input: string): string {
  const t = input.toLowerCase();
  if (/price|cost|₹|rs|budget|how much|rate/.test(t)) {
    return 'Short-form / reels start at ₹700 per piece. Brand packages and long-form are custom — share your goal and we quote fairly. Want me to leave a message for the studio?';
  }
  if (/service|offer|do you|edit|reel|youtube|short/.test(t)) {
    return 'We handle short-form retention edits, brand content, social packaging, and custom long-form. Browse /services or tell me what you need.';
  }
  if (/human|call|whatsapp|contact|talk/.test(t)) {
    return 'Happy to connect you. WhatsApp +91 77250 04639 or email visionfoldcreative@gmail.com. You can also leave name + message here and the team sees it in Leads.';
  }
  if (/hello|hi|hey|namaste/.test(t)) {
    return 'Hey! I am the VisionFold studio assistant. Ask about pricing, services, timelines — or drop a project brief.';
  }
  return 'Got it. Share a bit more (platform, length, deadline) and I will guide you. For a formal quote, leave your name and contact — we respond quickly.';
}

export const SiteChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: 'Hi — VisionFold Creative assistant. Ask about services, ₹700 short-form pricing, or leave a message for the team.' },
  ]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sendingLead, setSendingLead] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text }]);
    const reply = botReply(text);
    setTimeout(() => setMsgs((m) => [...m, { role: 'bot', text: reply }]), 280);
  };

  const leaveMessage = async () => {
    if (!name.trim() || !input.trim()) {
      setMsgs((m) => [...m, { role: 'bot', text: 'Add your name and a short message so the studio can reply.' }]);
      return;
    }
    setSendingLead(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || 'chat@visitor.visionfold.local',
          phone: 'chat-widget',
          company: '',
          projectType: 'Chat inquiry',
          budgetRange: 'Flexible / Custom Quote',
          deadline: '',
          message: input.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setLeadSent(true);
      setMsgs((m) => [
        ...m,
        { role: 'user', text: input.trim() },
        { role: 'bot', text: 'Message delivered to the studio. We will follow up soon. WhatsApp +91 77250 04639 if urgent.' },
      ]);
      setInput('');
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'Could not send right now. Please WhatsApp +91 77250 04639 or use the Contact page.' }]);
    } finally {
      setSendingLead(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-5 z-[90] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {open ? (
        <div className="flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C10]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#D4AF37]/20 to-transparent px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Studio chat</p>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Messages go to admin leads</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-[#A0A0A0] hover:bg-white/10 hover:text-white" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-[#D4AF37] text-black' : 'border border-white/10 bg-white/5 text-[#EDEDED]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-3 py-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s);
                }}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#B8B3AA] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="space-y-2 border-t border-white/10 p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-[#666]"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-[#666]"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask or leave a message…"
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-[#666]"
              />
              <button type="button" onClick={send} className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={sendingLead || leadSent}
              onClick={leaveMessage}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 py-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37] disabled:opacity-50"
            >
              {sendingLead ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {leadSent ? 'Message sent to studio' : 'Send message to studio team'}
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 transition hover:scale-105"
        aria-label="Open studio chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default SiteChat;
