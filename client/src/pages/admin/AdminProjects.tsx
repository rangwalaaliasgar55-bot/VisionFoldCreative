import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit2, Trash2, CheckCircle } from "lucide-react";
import api from "../../hooks/useApi";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  "in-progress": "#6366f1",
  review: "#06b6d4",
  completed: "#10b981",
};

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Commercial", description: "", clientId: "", status: "pending", progress: 0 });

  const fetchProjects = () => {
    api.get("/projects").then((res) => { setProjects(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async () => {
    try {
      await api.post("/projects", form);
      toast.success("Project created!");
      setShowForm(false);
      setForm({ title: "", category: "Commercial", description: "", clientId: "", status: "pending", progress: 0 });
      fetchProjects();
    } catch {
      toast.error("Failed to create project");
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = projects.filter((p: any) => p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-3xl">Projects</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-accent/30 transition-all">
          <Plus className="w-4 h-4" />New Project
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/5 mb-6">
          <h3 className="font-semibold mb-4">New Project</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["Commercial", "Documentary", "Music Video", "Short Film", "Social Media"].map((c) => <option key={c} value={c} className="bg-void">{c}</option>)}
            </select>
          </div>
          <textarea className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 mb-4" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3">
            <button onClick={createProject} className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">Create Project</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 glass rounded-xl text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="glass rounded-2xl p-4 border border-white/5 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-white/40" />
        <input type="text" placeholder="Search projects..." className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-white/30" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-white/40">No projects found.</div>
        ) : (
          filtered.map((project: any) => (
            <motion.div key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{project.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${statusColors[project.status] || "#6366f1"}20`, color: statusColors[project.status] || "#6366f1" }}>{project.status}</span>
                </div>
                <p className="text-sm text-white/40">{project.category} • {project.description?.slice(0, 60)}...</p>
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-xs">
                  <div className="h-full rounded-full" style={{ width: `${project.progress || 0}%`, backgroundColor: statusColors[project.status] || "#6366f1" }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-white/40 hover:text-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteProject(project.id)} className="p-2 text-white/40 hover:text-coral transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
