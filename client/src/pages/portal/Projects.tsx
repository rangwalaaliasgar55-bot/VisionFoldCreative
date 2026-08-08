import { useEffect, useState } from "react";
import api from "../../hooks/useApi";

export default function PortalProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/projects").then((res) => { setProjects(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-6">My Projects</h1>
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div> :
       projects.length === 0 ? <div className="glass rounded-2xl p-12 text-center text-white/40">No projects assigned yet.</div> :
       <div className="space-y-3">{projects.map((p: any) => (
         <div key={p.id} className="glass rounded-2xl p-5 border border-white/5">
           <h3 className="font-semibold">{p.title}</h3>
           <p className="text-sm text-white/40">{p.status}</p>
         </div>
       ))}</div>}
    </div>
  );
}
