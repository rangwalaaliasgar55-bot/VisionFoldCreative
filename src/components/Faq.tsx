import { Accordion } from "@/components/Fx";
import { JsonLd } from "@/components/Seo";

/**
 * FAQ — the questions that otherwise arrive by email, one at a time.
 *
 * Answers are deliberately specific (real numbers, real policies): a vague FAQ
 * generates the follow-up question it was meant to prevent. Ships `FAQPage`
 * structured data, which is also eligible for rich results.
 *
 * Override the defaults by setting a `faq` array in site settings.
 */

export type FaqItem = { q: string; a: string };

export const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "How much does a project cost?",
    a: "It depends on footage volume, runtime and how much motion work is involved — so we quote per project rather than posting a price that would be wrong for you. Use the quote builder, and you'll have a real number back within 24 hours. No hidden fees, and the rate is agreed before we start.",
  },
  {
    q: "How fast can you deliver?",
    a: "You get an honest first cut in three to five days for most projects. Shorts and vertical edits typically turn around in 24 hours. If you have a fixed air date, tell us in the brief and we'll confirm we can hit it before you commit.",
  },
  {
    q: "How many rounds of revisions do I get?",
    a: "Work is approved in passes — story, assembly, polish, sound — so notes are gathered at each stage instead of arriving all at once at the end. That usually means fewer rounds overall. The agreed number is written into your quote.",
  },
  {
    q: "How do I send you footage?",
    a: "Any link we can download from: Google Drive, Dropbox, Frame.io, WeTransfer. You'll add it when you submit the brief in the client portal, along with your deadline and formats, so nothing needs chasing afterwards.",
  },
  {
    q: "What formats do I get back?",
    a: "Every format your brief asks for — 16:9, 9:16, 1:1, 4:5 — plus captions burned in or as a separate SRT. Deciding this up front is cheaper than reframing later, which is why the intake asks.",
  },
  {
    q: "Who owns the finished films?",
    a: "You do, in full, once the invoice is settled. We'll usually ask whether we can show the work in our portfolio — if the answer is no, that's fine and it stays private.",
  },
  {
    q: "Do we need to get on a call?",
    a: "No. Briefs, reviews and approvals all happen in the client portal, which suits most people and most time zones. If you'd rather talk it through, say so and we'll set up a call.",
  },
  {
    q: "Do you work with clients outside India?",
    a: "Yes — we work across twelve countries and the process is built to be asynchronous. Your review links, comments and files all live in the portal, so time zones stop mattering.",
  },
  {
    q: "Will you sign an NDA?",
    a: "Yes, happily. Send yours with the brief, or ask and we'll provide one.",
  },
];

export function Faq({
  items = DEFAULT_FAQ,
  title = "Questions people actually ask",
  intro = "If yours isn't here, send it over — we answer briefs within 24 hours.",
}: {
  items?: FaqItem[];
  title?: string;
  intro?: string;
}) {
  if (!items.length) return null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">FAQ</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">{intro}</p>
        </div>
        <div className="mt-10">
          <Accordion items={items} />
        </div>
      </div>
    </>
  );
}
