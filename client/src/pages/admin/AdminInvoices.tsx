import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import api from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: "", amount: "", description: "", dueDate: "" });

  const fetchInvoices = () => {
    api
      .get("/invoices")
      .then((res) => {
        setInvoices(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const createInvoice = async () => {
    try {
      await api.post("/invoices", { ...form, amount: Number(form.amount) });
      toast.success("Invoice created!");
      setShowForm(false);
      fetchInvoices();
    } catch {
      toast.error("Failed");
    }
  };

  const markPaid = async (id: string) => {
    try {
      await api.patch(`/invoices/${id}`, { status: "paid", paidAt: new Date().toISOString() });
      toast.success("Marked as paid");
      fetchInvoices();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-3xl">Invoices</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-white/5 mb-6"
        >
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50"
              placeholder="Client ID"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            />
            <input
              type="number"
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <input
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="date"
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <button
            onClick={createInvoice}
            className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold"
          >
            Create Invoice
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          invoices.map((inv: any) => (
            <div
              key={inv.id}
              className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">Invoice #{inv.id?.slice(0, 8)}</h3>
                <p className="text-sm text-white/40">
                  ${(inv.amount || 0).toLocaleString()} • {inv.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inv.status !== "paid" && (
                  <button
                    onClick={() => markPaid(inv.id)}
                    className="p-2 text-emerald hover:text-emerald/80 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 text-white/40 hover:text-coral transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
