import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/Forms";
import { Reveal } from "@/components/Fx";
import { Accordion } from "@/components/Fx";
import { Faq } from "@/components/Faq";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start a Project",
  description: "Send your footage brief and get a plan, timeline and quote within 24 hours.",
};

const FAQ = [
  {
    q: "What happens after I send the brief?",
    a: "A producer reviews it the same day, asks any clarifying questions by email, and sends a scope + quote within 24 hours. Once approved, you'll get an upload link for your footage.",
  },
  {
    q: "Do I need to be technical?",
    a: "No. We'll guide you on what to export and how to upload. If you can record it, we can edit it.",
  },
  {
    q: "Can you sign an NDA?",
    a: "Yes — we're happy to sign standard NDAs before any footage touches our hands.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Start a project
              </p>
              <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-6xl">
                Brief us. <span className="text-gradient">We&rsquo;ll do the rest.</span>
              </h1>
              <p className="mt-5 max-w-md leading-relaxed text-slate-400">
                Tell us what you&rsquo;re making, drop your budget and timeline, and we&rsquo;ll come back with a
                plan and a quote within 24 hours — usually faster.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-10 space-y-4">
                {[
                  { Icon: Mail, label: "Email", value: String(settings.email) },
                  { Icon: Phone, label: "Phone", value: String(settings.phone) },
                  { Icon: MapPin, label: "Studio", value: String(settings.address) },
                  { Icon: Clock, label: "Response time", value: "Within 24 hours, 7 days a week" },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="glass flex items-center gap-4 rounded-2xl p-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7357FF]/30 to-[#F4A62A]/15 text-brand-300">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-12">
                <h3 className="font-display text-lg font-semibold text-white">
                  Quick answers
                </h3>
                <div className="mt-4">
                  <Accordion items={FAQ} />
                </div>
              </div>
            </Reveal>
          </div>

          <div>
            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
            <p className="mt-4 text-center text-xs text-slate-600">
              Your brief lands straight in our leads board — no spam, no newsletters, no obligation.
            </p>
          </div>
        </div>
        <Reveal>
          <Faq />
        </Reveal>
      </section>
    </div>
  );
}
