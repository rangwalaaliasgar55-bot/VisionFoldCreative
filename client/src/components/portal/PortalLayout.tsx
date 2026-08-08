import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, MessageSquare, FileText, Settings, LogOut, Film } from "lucide-react";
import { useStore } from "../../store/useStore";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/portal" },
  { icon: FolderOpen, label: "Projects", href: "/portal/projects" },
  { icon: MessageSquare, label: "Messages", href: "/portal/messages" },
  { icon: FileText, label: "Invoices", href: "/portal/invoices" },
  { icon: Settings, label: "Settings", href: "/portal/settings" },
];

export default function PortalLayout() {
  const { user, logout } = useStore();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass-strong border-r border-white/5 fixed h-full z-40 hidden lg:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-lg">Vision<span className="text-accent">Fold</span></span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === item.href ? "bg-accent/10 text-accent" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">{user.name?.charAt(0)}</div>
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-white/40 text-xs">{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-coral hover:bg-coral/10 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <div className="p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
