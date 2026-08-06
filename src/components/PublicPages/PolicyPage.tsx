import React from 'react';

type PolicyKind = 'terms' | 'privacy' | 'refund';

const CONTENT: Record<PolicyKind, { title: string; updated: string; sections: { h: string; p: string[] }[] }> = {
  terms: {
    title: 'Terms of Service',
    updated: 'August 6, 2026',
    sections: [
      {
        h: '1. Agreement',
        p: [
          'By accessing VisionFold Creative websites, client portal, or commissioning work, you agree to these Terms of Service.',
          'Services include short-form editing, brand content, social packaging, consulting, and related creative production delivered under project agreements.',
        ],
      },
      {
        h: '2. Projects & deliverables',
        p: [
          'Scope, timeline, and deliverables are defined in written proposals, invoices, or chat confirmations.',
          'Revision rounds are limited to what is stated in the package unless a custom agreement is signed.',
          'Long-form and custom work is quoted individually based on length, complexity, and turnaround.',
        ],
      },
      {
        h: '3. Client responsibilities',
        p: [
          'Clients must provide source assets, brand guidelines, feedback, and approvals in a timely manner.',
          'Delays in client feedback may shift delivery dates without penalty to VisionFold Creative.',
        ],
      },
      {
        h: '4. Intellectual property',
        p: [
          'Until final payment is received, VisionFold Creative retains rights to work-in-progress.',
          'After full payment, clients receive usage rights as specified in the project agreement. Portfolio showcase rights remain with VisionFold unless opted out in writing.',
        ],
      },
      {
        h: '5. Acceptable use of portal & AI tools',
        p: [
          'Client portal access is personal and non-transferable. Do not share login credentials.',
          'Site chat and admin AI tools may store messages for support quality. Do not submit illegal content or secrets you are not authorized to share.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'August 6, 2026',
    sections: [
      {
        h: '1. Data we collect',
        p: [
          'Contact details (name, email, phone), project messages, invoices, and portal activity needed to deliver services.',
          'Technical data such as basic device/browser info and security logs for abuse prevention.',
        ],
      },
      {
        h: '2. How we use data',
        p: [
          'To respond to inquiries, deliver projects, send invoices, improve the product, and protect accounts.',
          'Optional marketing messages only with consent; you can opt out anytime.',
        ],
      },
      {
        h: '3. Storage & processors',
        p: [
          'Data may be stored via our application database and infrastructure providers (e.g. hosting, email).',
          'We do not sell personal data. Access is limited to staff and systems required to operate the studio.',
        ],
      },
      {
        h: '4. Your rights',
        p: [
          'You may request access, correction, or deletion of personal data subject to legal and contractual retention needs.',
          'Contact visionfoldcreative@gmail.com for privacy requests.',
        ],
      },
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    updated: 'August 6, 2026',
    sections: [
      {
        h: '1. Deposits',
        p: [
          'Project deposits reserve calendar time and are generally non-refundable once work has started.',
          'If VisionFold cancels before work begins, deposits are fully refundable.',
        ],
      },
      {
        h: '2. Cancellations by client',
        p: [
          'Before production starts: deposit may be retained as a booking fee; unused prepaid balances can be discussed case-by-case.',
          'After production starts: fees are owed for completed milestones and work performed.',
        ],
      },
      {
        h: '3. Quality & rework',
        p: [
          'We stand behind delivery quality within agreed scope. Additional revisions beyond package limits are billed separately.',
          'Refunds are not issued for change-of-mind after approved deliverables.',
        ],
      },
      {
        h: '4. Contact',
        p: [
          'Email visionfoldcreative@gmail.com or WhatsApp +91 77250 04639 for billing questions. We aim to respond within 2 business days.',
        ],
      },
    ],
  },
};

export function PolicyPage({ kind }: { kind: PolicyKind }) {
  const doc = CONTENT[kind];
  return (
    <div className="min-h-screen bg-[#050507] px-6 py-20 text-[#EDEDED]">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-[#8A857C]">Last updated {doc.updated}</p>
        <div className="mt-12 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold text-white">{s.h}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-[#B8B3AA]">
                {s.p.map((para) => (
                  <p key={para.slice(0, 48)}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <a href="/" className="mt-14 inline-flex text-sm font-semibold text-[#D4AF37] hover:underline">
          ← Back to home
        </a>
      </div>
    </div>
  );
}

export default PolicyPage;
