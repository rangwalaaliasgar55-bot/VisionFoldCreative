import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, MessageSquare, FileText } from "lucide-react";
import api from "../../hooks/useApi";
import { useStore } from "../../store/useStore";

export default function PortalDashboard() {
  const { user } = useStore();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-2">Welcome, {user?.name}</h1>
      <p className="text-white/40 mb-8">Your project hub</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Link to="/portal/projects" className="glass rounded-2xl p-6 border border-white/5 hover:border-accent/30 transition-colors">
          <FolderOpen className="w-5 h-5 text-accent mb-3" />
          <div className="font-semibold">{projects.length} Projects</div>
        </Link>
        <Link to="/portal/messages" className="glass rounded-2xl p-6 border border-white/5 hover:border-accent/30 transition-colors">
          <MessageSquare className="w-5 h-5 text-accent mb-3" />
          <div className="font-semibold">Messages</div>
        </Link>
        <Link to="/portal/invoices" className="glass rounded-2xl p-6 border border-white/5 hover:border-accent/30 transition-colors">
          <FileText className="w-5 h-5 text-accent mb-3" />
          <div className="font-semibold">Invoices</div>
        </Link>
      </div>
    </div>
  );
}
