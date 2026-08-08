import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/projects").then((res) => { setProjects(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-3xl">Projects</h1>
        <button onClick={() => toast("Create form coming soon")} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />New Project
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-white/40 border border-white/5">No projects yet.</div>
      ) : (
        <div className="space-y-3">
          {projects.map((p: any) => (
            <div key={p.id} className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-white/40">{p.category} • {p.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
