/**
 * Branded invoice document builder (INR-first).
 * Self-contained HTML for print-to-PDF / Resend; zero extra dependencies.
 */
import { fmtInr, fmtMoneyLine } from "@/lib/money";

export type InvoicePdfInput = {
  number: string;
  amount: number;
  currency?: string;
  originalAmount?: number | null;
  originalCurrency?: string;
  fxRate?: number;
  status: string;
  dueDate?: string | null;
  notes?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  projectTitle?: string | null;
  paymentUrl?: string;
  studio?: { name?: string; email?: string; phone?: string; address?: string };
};

export function buildInvoiceHtml(inv: InvoicePdfInput): string {
  const studio = {
    name: inv.studio?.name || "VisionFold Creative",
    email: inv.studio?.email || "visionfoldcreative@gmail.com",
    phone: inv.studio?.phone || "+91 77250 04639",
    address: inv.studio?.address || "Indore, Madhya Pradesh, India",
  };
  const inrLine = fmtInr(inv.amount);
  const dual =
    inv.originalCurrency && inv.originalCurrency !== "INR" && inv.originalAmount != null
      ? fmtMoneyLine({
          amountInr: inv.amount,
          originalAmount: inv.originalAmount,
          originalCurrency: inv.originalCurrency,
          fxRate: inv.fxRate || 1,
        })
      : inrLine;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Invoice ${esc(inv.number)} · ${esc(studio.name)}</title>
<style>
  :root { --ink:#0B1020; --violet:#7357FF; --muted:#64748b; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: var(--ink); margin: 0; padding: 32px; background: #fff; }
  .sheet { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; }
  .brand { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid var(--violet); padding-bottom: 20px; }
  .mark { font-size: 22px; font-weight: 800; }
  .mark span { color: var(--violet); }
  .meta { text-align: right; font-size: 13px; color: var(--muted); }
  .meta strong { display: block; color: var(--ink); font-size: 18px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; font-size: 14px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  th { font-size: 11px; text-transform: uppercase; color: var(--muted); }
  .amount { font-size: 28px; font-weight: 800; color: var(--violet); }
  .status { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #f1f5f9; }
  .pay { margin-top: 28px; padding: 16px; border-radius: 12px; background: linear-gradient(135deg, #f5f3ff, #fff7ed); border: 1px solid #ddd6fe; }
  .pay a { color: var(--violet); font-weight: 700; }
  footer { margin-top: 36px; font-size: 12px; color: var(--muted); text-align: center; }
  @media print { body { padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="brand">
      <div>
        <div class="mark">Vision<span>Fold</span> Creative</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(studio.address)}</div>
        <div style="font-size:12px;color:var(--muted)">${esc(studio.email)} · ${esc(studio.phone)}</div>
      </div>
      <div class="meta">
        <strong>INVOICE</strong>
        #${esc(inv.number)}
        <div style="margin-top:8px"><span class="status">${esc(inv.status)}</span></div>
      </div>
    </div>
    <div class="grid">
      <div>
        <div class="label">Bill to</div>
        <div style="font-weight:700">${esc(inv.clientName)}</div>
        ${inv.clientCompany ? `<div>${esc(inv.clientCompany)}</div>` : ""}
        ${inv.clientEmail ? `<div>${esc(inv.clientEmail)}</div>` : ""}
        ${inv.clientPhone ? `<div>${esc(inv.clientPhone)}</div>` : ""}
      </div>
      <div>
        <div class="label">Details</div>
        ${inv.projectTitle ? `<div>Project: ${esc(inv.projectTitle)}</div>` : ""}
        ${inv.dueDate ? `<div>Due: ${esc(inv.dueDate)}</div>` : ""}
        <div style="margin-top:12px" class="label">Amount due (INR)</div>
        <div class="amount">${esc(dual)}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead>
      <tbody>
        <tr>
          <td>${esc(inv.projectTitle || inv.notes || "Studio services")}</td>
          <td style="text-align:right;font-weight:700">${esc(inrLine)}</td>
        </tr>
      </tbody>
    </table>
    ${inv.paymentUrl ? `<div class="pay">Pay online: <a href="${esc(inv.paymentUrl)}">${esc(inv.paymentUrl)}</a></div>` : ""}
    ${inv.notes ? `<p style="margin-top:20px;font-size:13px;color:var(--muted)">${esc(inv.notes)}</p>` : ""}
    <footer>Thank you for working with ${esc(studio.name)}. All figures in Indian Rupees unless noted.</footer>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
