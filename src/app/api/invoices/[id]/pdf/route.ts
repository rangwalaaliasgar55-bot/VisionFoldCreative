import { db } from "@/db";
import { clients, invoices, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildInvoiceHtml } from "@/lib/invoicePdf";
import { payLink } from "@/lib/paytoken";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!id) return new Response("Invalid invoice", { status: 400 });

  const [row] = await db
    .select({
      invoice: invoices,
      clientName: clients.name,
      clientEmail: clients.email,
      clientPhone: clients.phone,
      clientCompany: clients.company,
      projectTitle: projects.title,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(invoices.id, id))
    .limit(1);

  if (!row || row.invoice.deletedAt) return new Response("Not found", { status: 404 });

  const html = buildInvoiceHtml({
    number: row.invoice.number || `INV-${row.invoice.id}`,
    amount: Number(row.invoice.amount || 0),
    currency: row.invoice.currency || "INR",
    originalAmount: row.invoice.originalAmount != null ? Number(row.invoice.originalAmount) : null,
    originalCurrency: row.invoice.originalCurrency || "INR",
    fxRate: Number(row.invoice.fxRate || 1),
    status: row.invoice.status,
    dueDate: row.invoice.dueDate,
    notes: row.invoice.notes,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    clientCompany: row.clientCompany,
    projectTitle: row.projectTitle,
    paymentUrl: payLink(row.invoice.id),
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${row.invoice.number || id}.html"`,
      "Cache-Control": "private, no-store",
    },
  });
}
