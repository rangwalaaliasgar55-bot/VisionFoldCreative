import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Users, FileText, Image, MessageSquare,
  Sparkles, Settings, Mail, BarChart3, LogOut, Film, Menu, X
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: FolderOpen, label: "Projects", href: "/admin/projects" },
  { icon: Users, label: "Clients", href: "/admin/clients" },
  { icon: FileText, label: "Invoices", href: "/admin/invoices" },
  { icon: Image, label: "Media", href: "/admin/media" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  { icon: Mail, label: "Outreach", href: "/admin/outreach" },
  { icon: Sparkles, label: "AI Assistant", href: "/admin/ai" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout() {
  const { user, logout } = useStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/portal" replace />;

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 glass-strong border-r border-white/5 z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-lg">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/60"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === item.href ? "bg-accent/10 text-accent" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">{user.name?.charAt(0)}</div>
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-white/40 text-xs">Administrator</div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-coral hover:bg-coral/10 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-4 p-4 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-white/60"><Menu className="w-5 h-5" /></button>
          <span className="font-display font-bold">Admin Panel</span>
        </div>
        <div className="p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
