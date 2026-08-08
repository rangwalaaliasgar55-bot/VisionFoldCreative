import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film } from "lucide-react";
import api from "../hooks/useApi";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useStore();
  const navigate = useNavigate();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      toast.success("Welcome back!");
      navigate(data.user.role === "admin" ? "/admin" : "/portal");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Film className="w-6 h-6 text-accent" />
            <span className="font-display font-bold text-2xl">Vision<span className="text-accent">Fold</span></span>
          </Link>
          <h1 className="font-display font-bold text-3xl mb-2">Sign In</h1>
          <p className="text-white/40">Access your client portal or admin panel</p>
        </div>
        <form onSubmit={login} className="glass rounded-2xl p-8 border border-white/5 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
