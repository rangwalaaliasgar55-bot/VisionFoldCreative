import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2 } from "lucide-react";
import api from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "" });
  const fetchClients = () => {
    api.get("/clients").then((res) => { setClients(res.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchClients(); }, []);
  const createClient = async () => {
    try { await api.post("/clients", form); toast.success("Client added!"); setShowForm(false); setForm({ name: "", email: "", company: "", phone: "" }); fetchClients(); }
    catch { toast.error("Failed to add client"); }
  };
  const deleteClient = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try { await api.delete(`/clients/${id}`); toast.success("Deleted"); fetchClients(); }
    catch { toast.error("Failed"); }
  };
  const filtered = clients.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-3xl">Clients</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />New Client
        </button>
      </div>
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/5 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            <input className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            <input className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" placeholder="Company" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} />
            <input className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" placeholder="Phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="flex gap-3">
            <button onClick={createClient} className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold">Add Client</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 glass rounded-xl text-sm text-white/60">Cancel</button>
          </div>
        </motion.div>
      )}
      <div className="glass rounded-2xl p-4 border border-white/5 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-white/40" />
        <input type="text" placeholder="Search clients..." className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-white/30" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="space-y-3">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div> :
         filtered.length === 0 ? <div className="glass rounded-2xl p-12 text-center text-white/40">No clients found.</div> :
         filtered.map((client: any) => (
           <motion.div key={client.id} className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
             <div>
               <h3 className="font-semibold">{client.name}</h3>
               <p className="text-sm text-white/40">{client.email} • {client.company}</p>
             </div>
             <button onClick={() => deleteClient(client.id)} className="p-2 text-white/40 hover:text-coral transition-colors"><Trash2 className="w-4 h-4" /></button>
           </motion.div>
         ))}
      </div>
    </div>
  );
}
