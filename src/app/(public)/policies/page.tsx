import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/Fx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies",
  description: "Privacy policy, terms of service and refund policy for VisionFold Creative.",
};

const SECTIONS = [
  {
    title: "Privacy Policy",
    icon: "🔒",
    items: [
      {
        h: "What we collect",
        p: "We collect only what you give us: your name, email, project details, and footage when you start a project. We don't buy data, and we don't sell data.",
      },
      {
        h: "How we use it",
        p: "Your information is used to deliver your edit, send invoices and keep you updated on project progress through the client portal. We never share client footage or contact details with third parties.",
      },
      {
        h: "Cookies",
        p: "We use a single session cookie to keep you signed in to the portal or admin area. No tracking pixels, no ad cookies.",
      },
      {
        h: "Your rights",
        p: "Email us anytime to export or delete your data. We respond within 48 hours and complete requests within 14 days.",
      },
    ],
  },
  {
    title: "Terms of Service",
    icon: "📋",
    items: [
      {
        h: "Project scope",
        p: "Every project starts with a written scope: footage, deliverables, timeline and revision rounds. Work outside the scope is quoted separately before we start.",
      },
      {
        h: "Revisions",
        p: "Each project includes 2 structured revision rounds. Notes are collected per round and applied in one pass. Additional rounds are billed at a flat rate.",
      },
      {
        h: "Delivery",
        p: "Deliverables are provided via cloud link plus the formats listed in your scope. We keep project files for 12 months after delivery, then archive them.",
      },
      {
        h: "Copyright",
        p: "You own the final film. We reserve the right to show completed work in our portfolio unless an NDA or embargo is agreed in advance.",
      },
    ],
  },
  {
    title: "Refund Policy",
    icon: "💳",
    items: [
      {
        h: "Deposits",
        p: "A 50% deposit books your project on the calendar. It covers story planning, asset organization and the first assembly — work that starts immediately.",
      },
      {
        h: "Canceled before assembly",
        p: "If you cancel before the first cut is delivered, we refund the deposit minus any completed work at our hourly rate.",
      },
      {
        h: "After first cut",
        p: "Once the assembly is delivered, the deposit is non-refundable — it pays for the creative work already done. The remaining 50% is due on final delivery.",
      },
      {
        h: "Our guarantee",
        p: "If the final film misses the agreed scope or deliverables, we fix it free of charge until it matches — that's the VisionFold guarantee.",
      },
    ],
  },
];

export default async function PoliciesPage() {
  const settings = await getSettings();
  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-4xl px-5 pb-24 pt-20 sm:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Policies</p>
            <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
              The fine print, <span className="text-gradient">edited for clarity</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Plain-language policies because you have footage to shoot, not legal docs to decode.
              Questions? {settings.email}
            </p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-10">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <section className="glass rounded-3xl p-7 sm:p-9">
                <h2 className="font-display flex items-center gap-3 text-2xl font-bold text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#F4A62A]/30 to-[#F4A62A]/15 text-lg">
                    {s.icon}
                  </span>
                  {s.title}
                </h2>
                <div className="mt-6 space-y-5">
                  {s.items.map((item) => (
                    <div key={item.h}>
                      <h3 className="text-sm font-semibold text-brand-300">{item.h}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.p}</p>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
