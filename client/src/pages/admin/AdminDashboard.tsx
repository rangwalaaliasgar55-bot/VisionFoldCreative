import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Users, FileText, MessageSquare, TrendingUp, DollarSign, Activity } from "lucide-react";
import api from "../../hooks/useApi";
import AnimatedCounter from "../../components/AnimatedCounter";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/dashboard").then((res) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const overview = data?.overview || {};

  const cards = [
    { icon: FolderOpen, label: "Total Projects", value: overview.totalProjects || 0, color: "#6366f1" },
    { icon: Users, label: "Total Clients", value: overview.totalClients || 0, color: "#10b981" },
    { icon: DollarSign, label: "Total Revenue", value: `$${(overview.totalRevenue || 0).toLocaleString()}`, color: "#f59e0b" },
    { icon: MessageSquare, label: "Unread Messages", value: overview.unreadMessages || 0, color: "#f43f5e" },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl mb-2">Dashboard</h1>
        <p className="text-white/50 mb-8">Overview of your studio's performance.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 border border-white/5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${card.color}15` }}>
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <div className="font-display font-bold text-2xl mb-1">{typeof card.value === "number" ? <AnimatedCounter value={card.value} /> : card.value}</div>
            <div className="text-sm text-white/40">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="font-display font-bold text-lg mb-4">Project Status</h2>
          <div className="space-y-3">
            {Object.entries(data?.projectStatus || {}).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status === "completed" ? "#10b981" : status === "in-progress" ? "#6366f1" : status === "review" ? "#06b6d4" : "#f59e0b" }} />
                <span className="text-sm text-white/60 capitalize flex-1">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="font-display font-bold text-lg mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(data?.recentActivity || []).length === 0 ? (
              <p className="text-white/40 text-sm">No recent activity.</p>
            ) : (
              (data?.recentActivity || []).map((act: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <Activity className="w-4 h-4 text-accent" />
                  <div className="flex-1">
                    <p className="text-sm">{act.action || "Activity"}</p>
                    <p className="text-xs text-white/40">{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
