import { db } from "@/db";
import { clients, invoices, projects } from "@/db/schema";
import { verifyPayToken } from "@/lib/paytoken";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const money = (v: unknown) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v || 0));

/**
 * Client-facing invoice page via capability link (/pay/<id>?t=<token>).
 * Read-only: shows the invoice and hands off to the hosted checkout.
 * Invoices can NEVER be marked paid from this page — only a verified
 * provider webhook or a studio member does that.
 */
export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id: rawId } = await params;
  const { t } = await searchParams;
  const id = Number(rawId);

  if (!id || !verifyPayToken(id, t ?? null)) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold text-white">Link expired</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          This payment link isn&apos;t valid anymore. Ask the studio for a fresh one — we&apos;ll send it right over.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-brand-500 px-7 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          visionfoldcreative.com
        </Link>
      </Shell>
    );
  }

  const rows = await db
    .select({ invoice: invoices, clientName: clients.name, projectTitle: projects.title })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(invoices.id, id))
    .limit(1);
  const row = rows[0];

  if (!row) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold text-white">Invoice not found</h1>
        <p className="mt-3 text-sm text-slate-400">This invoice may have been removed.</p>
      </Shell>
    );
  }

  const { invoice, clientName, projectTitle } = row;
  const paid = invoice.status === "paid";

  let checkoutUrl: string | null = null;
  if (!paid && process.env.PAYMENT_CHECKOUT_URL?.trim()) {
    try {
      const u = new URL(process.env.PAYMENT_CHECKOUT_URL.trim());
      u.searchParams.set("invoice", invoice.number || `INV-${invoice.id}`);
      u.searchParams.set("amount", String(invoice.amount));
      u.searchParams.set("client", String(invoice.clientId));
      checkoutUrl = u.toString();
    } catch {
      checkoutUrl = null;
    }
  }

  return (
    <Shell>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-500">Invoice</p>
            <p className="font-display mt-1 text-xl font-bold text-white">{invoice.number || `INV-${invoice.id}`}</p>
            <p className="mt-0.5 text-xs text-slate-500">{clientName}{projectTitle ? ` · ${projectTitle}` : ""}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              paid
                ? "bg-emerald-400/10 text-emerald-300"
                : invoice.status === "overdue"
                  ? "bg-red-400/10 text-red-300"
                  : "bg-amber/10 text-amber"
            }`}
          >
            {paid ? "Paid" : invoice.status === "overdue" ? "Overdue" : invoice.status}
          </span>
        </div>

        <div className="my-6 border-t border-white/8" />

        <div className="flex items-baseline justify-between">
          <p className="text-sm text-slate-400">Amount due</p>
          <p className="font-display text-3xl font-black text-white">{money(invoice.amount)}</p>
        </div>
        {invoice.dueDate && !paid && (
          <p className="mt-1 text-right text-xs text-slate-500">Due {String(invoice.dueDate)}</p>
        )}
        {invoice.notes && (
          <p className="mt-4 rounded-xl bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-400">{invoice.notes}</p>
        )}

        <div className="mt-7">
          {paid ? (
            <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] py-3 text-center text-sm font-semibold text-emerald-300">
              This invoice is settled. Thank you! 🎬
            </p>
          ) : checkoutUrl ? (
            <a
              href={checkoutUrl}
              className="block rounded-xl bg-brand-500 py-3.5 text-center text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
            >
              Pay {money(invoice.amount)} securely →
            </a>
          ) : (
            <div className="rounded-xl border border-amber/20 bg-amber/[0.05] p-4 text-xs leading-relaxed text-slate-300">
              <p className="font-semibold text-amber">Online payment isn&apos;t set up yet.</p>
              <p className="mt-1">
                Reply to any studio email or message us at{" "}
                <a href="https://wa.me/917725004639" className="text-brand-300 underline">
                  WhatsApp
                </a>{" "}
                and we&apos;ll share bank / UPI details instantly.
              </p>
            </div>
          )}
          {!paid && checkoutUrl && (
            <p className="mt-3 text-center text-[10px] text-slate-600">
              Payments are processed by our provider — VisionFold never sees your card details.
            </p>
          )}
        </div>
      </div>

      <Link href="/" className="mt-8 text-xs text-slate-600 transition hover:text-slate-300">
        ← visionfoldcreative.com
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5 py-16 text-center">
      <div className="flex flex-col items-center">{children}</div>
    </main>
  );
}
