"use client";

import { useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  StatusBadge,
  Tabs,
  Textarea,
  toast,
  useApi, usePagination, Pager,
} from "@/components/AdminUI";
import { fmtDate, fmtMoney, money } from "@/lib/utils";
import { CheckCircle2, Link2, Plus, Send } from "lucide-react";

type InvoiceRow = {
  id: number;
  clientId: number;
  clientName: string;
  projectId: number | null;
  projectTitle: string | null;
  number: string;
  amount: string;
  status: string;
  dueDate: string | null;
  notes: string;
  createdAt: string;
};

type ExpenseRow = { id: number; category: string; description: string; amount: string; date: string | null };

export default function AdminInvoicesPage() {
  const [tab, setTab] = useState("Invoices");
  const [showInv, setShowInv] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [editingInv, setEditingInv] = useState<InvoiceRow | null>(null);
  const [invForm, setInvForm] = useState({ clientId: 0, number: "", amount: "", status: "sent", dueDate: "", notes: "" });
  const [expForm, setExpForm] = useState({ category: "Software", description: "", amount: "", date: "" });

  const { data: invoices, loading, reload } = useApi<InvoiceRow[]>("/api/admin/invoices");
  const { data: expenses, loading: expLoading, reload: expReload } = useApi<ExpenseRow[]>("/api/admin/expenses");
  const { data: clients } = useApi<{ id: number; name: string }[]>("/api/admin/clients");

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingInv) {
        await api(`/api/admin/invoices/${editingInv.id}`, { method: "PATCH", json: invForm });
        toast("Invoice updated");
      } else {
        await api("/api/admin/invoices", { json: invForm });
        toast("Invoice created");
      }
      setShowInv(false);
      setEditingInv(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/expenses", { json: expForm });
      toast("Expense logged");
      setShowExp(false);
      setExpForm({ category: "Software", description: "", amount: "", date: "" });
      expReload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function markPaid(inv: InvoiceRow) {
    try {
      await api(`/api/admin/invoices/${inv.id}`, { method: "PATCH", json: { status: "paid" } });
      toast(`${inv.number} marked paid 💸`);
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function copyPayLink(inv: InvoiceRow) {
    try {
      const res = await api<{ url: string }>("/api/admin/paylink", { json: { id: inv.id } });
      const absolute = res.url.startsWith("http")
        ? res.url
        : `${window.location.origin}${res.url}`;
      await navigator.clipboard.writeText(absolute);
      toast("Payment link copied — send it to the client");
    } catch {
      toast("Failed to build payment link", "err");
    }
  }

  async function sendInvoice(inv: InvoiceRow) {
    try {
      const res = await api<{ emailed: boolean; link: string }>(`/api/admin/invoices/${inv.id}/send`, { json: {} });
      toast(res.emailed ? "Sent — portal message + email delivered" : "Sent — portal message delivered (add Resend keys for email)");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to send", "err");
    }
  }

  async function removeInvoice(inv: InvoiceRow) {
    try {
      await api(`/api/admin/invoices/${inv.id}`, { method: "DELETE" });
      toast("Invoice deleted");
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function removeExpense(ex: ExpenseRow) {
    try {
      await api(`/api/admin/expenses/${ex.id}`, { method: "DELETE" });
      toast("Expense deleted");
      expReload();
    } catch {
      toast("Failed", "err");
    }
  }

  const paid = (invoices || []).filter((i) => i.status === "paid").reduce((s, i) => s + money(i.amount), 0);
  const outstanding = (invoices || []).filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + money(i.amount), 0);
  const expensesTotal = (expenses || []).reduce((s, e) => s + money(e.amount), 0);
  const ipager = usePagination(invoices || [], 25);
  const epager = usePagination(expenses || [], 25);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Invoices & Expenses</h1>
          <p className="text-sm text-slate-500">Billing that feeds your dashboard revenue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExp(true)}>
            <Plus size={14} /> Log expense
          </Button>
          <Button onClick={() => setShowInv(true)}>
            <Plus size={14} /> New invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Paid</p>
          <p className="font-display mt-1 text-2xl font-bold text-emerald-300">{fmtMoney(paid)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Outstanding</p>
          <p className="font-display mt-1 text-2xl font-bold text-amber-300">{fmtMoney(outstanding)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Net (paid − expenses)</p>
          <p className="font-display mt-1 text-2xl font-bold text-white">{fmtMoney(paid - expensesTotal)}</p>
        </Card>
      </div>

      <Tabs tabs={["Invoices", "Expenses"]} active={tab} onChange={setTab} />

      {tab === "Invoices" ? (
        loading ? (
          <Spinner />
        ) : !invoices || invoices.length === 0 ? (
          <Empty title="No invoices" desc="Create your first invoice for a client." />
        ) : (
          <>
            <Pager from={ipager.from} to={ipager.to} total={ipager.total} page={ipager.page} totalPages={ipager.totalPages} onPage={ipager.setPage} />
        <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/3 text-[11px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ipager.slice.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-white/2">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{inv.number}</p>
                      <p className="max-w-48 truncate text-xs text-slate-600">{inv.notes}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{inv.clientName}</td>
                    <td className="px-4 py-3 font-semibold text-white">{fmtMoney(inv.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {inv.status !== "paid" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => sendInvoice(inv)} title="Send to client">
                              <Send size={13} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => markPaid(inv)}>
                              <CheckCircle2 size={13} /> Paid
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => copyPayLink(inv)}>
                          <Link2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingInv(inv);
                            setInvForm({ clientId: inv.clientId, number: inv.number, amount: inv.amount, status: inv.status, dueDate: inv.dueDate || "", notes: inv.notes });
                            setShowInv(true);
                          }}
                        >
                          Edit
                        </Button>
                        <ConfirmButton onConfirm={() => removeInvoice(inv)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
           </div>
          </>
        )
      ) : expLoading ? (
        <Spinner />
      ) : !expenses || expenses.length === 0 ? (
        <Empty title="No expenses" desc="Log software, assets, music and marketing costs here." />
      ) : (
        <>
          <Pager from={epager.from} to={epager.to} total={epager.total} page={epager.page} totalPages={epager.totalPages} onPage={epager.setPage} />
        <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/3 text-[11px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {epager.slice.map((ex) => (
                <tr key={ex.id} className="transition-colors hover:bg-white/2">
                  <td className="px-4 py-3"><Badge tone="contacted">{ex.category}</Badge></td>
                  <td className="px-4 py-3 text-slate-300">{ex.description}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(ex.date)}</td>
                  <td className="px-4 py-3 font-semibold text-red-300">−{fmtMoney(ex.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <ConfirmButton onConfirm={() => removeExpense(ex)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <Modal open={showInv} onClose={() => { setShowInv(false); setEditingInv(null); }} title={editingInv ? "Edit invoice" : "New invoice"}>
        <form onSubmit={saveInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client *">
              <Select required value={invForm.clientId} onChange={(e) => setInvForm((f) => ({ ...f, clientId: Number(e.target.value) }))}>
                <option value={0} disabled>Select client…</option>
                {(clients || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Number">
              <Input value={invForm.number} onChange={(e) => setInvForm((f) => ({ ...f, number: e.target.value }))} placeholder="INV-1025" />
            </Field>
            <Field label="Amount (USD) *">
              <Input required type="number" min={0} step="0.01" value={invForm.amount} onChange={(e) => setInvForm((f) => ({ ...f, amount: e.target.value }))} />
            </Field>
            <Field label="Due date">
              <Input type="date" value={invForm.dueDate} onChange={(e) => setInvForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={invForm.status} onChange={(e) => setInvForm((f) => ({ ...f, status: e.target.value }))}>
              {["sent", "paid", "overdue"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={invForm.notes} onChange={(e) => setInvForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowInv(false); setEditingInv(null); }}>Cancel</Button>
            <Button type="submit">{editingInv ? "Save changes" : "Create invoice"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showExp} onClose={() => setShowExp(false)} title="Log expense">
        <form onSubmit={saveExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={expForm.category} onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}>
                {["Software", "Assets", "Music", "Marketing", "Equipment", "Freelance", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (USD) *">
              <Input required type="number" min={0} step="0.01" value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description">
            <Input value={expForm.description} onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))} placeholder="Stock footage pack" />
          </Field>
          <Field label="Date">
            <Input type="date" value={expForm.date} onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowExp(false)}>Cancel</Button>
            <Button type="submit">Log expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
