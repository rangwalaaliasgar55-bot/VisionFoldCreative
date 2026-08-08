import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Users, FileText, DollarSign } from "lucide-react";
import api from "../../hooks/useApi";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/analytics/dashboard").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const cards = [
    { label: "Revenue", value: stats ? `$${(stats.overview?.totalRevenue || 0).toLocaleString()}` : "—", icon: DollarSign, href: "/admin/invoices" },
    { label: "Projects", value: stats?.overview?.totalProjects ?? "—", icon: FolderOpen, href: "/admin/projects" },
    { label: "Clients", value: stats?.overview?.totalClients ?? "—", icon: Users, href: "/admin/clients" },
    { label: "Messages", value: stats?.overview?.unreadMessages ?? "—", icon: FileText, href: "/admin/messages" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} to={c.href} className="glass rounded-2xl p-6 border border-white/5 hover:border-accent/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/40">{c.label}</span>
              <c.icon className="w-5 h-5 text-accent" />
            </div>
            <div className="font-display font-bold text-2xl">{c.value}</div>
          </Link>
        ))}
      </div>
      <div className="glass rounded-2xl p-8 border border-white/5 text-center text-white/40">
        Welcome to the VisionFold admin panel. Use the sidebar to manage projects, clients, invoices, and more.
      </div>
    </div>
  );
}
