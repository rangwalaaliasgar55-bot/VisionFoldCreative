import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Globe, Mail, Palette } from "lucide-react";
import api from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get("/settings").then((res) => { setSettings(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  const save = async () => {
    setSaving(true);
    try { await api.patch("/settings", settings); toast.success("Settings saved!"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-6">Settings</h1>
      <div className="max-w-2xl space-y-6">
        <motion.div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4"><Palette className="w-5 h-5 text-accent" /><h2 className="font-semibold">Branding</h2></div>
          <div className="space-y-4">
            <div><label className="block text-sm text-white/60 mb-2">Site Name</label><input className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" value={settings.siteName || ""} onChange={(e) => setSettings({...settings, siteName: e.target.value})} /></div>
            <div><label className="block text-sm text-white/60 mb-2">Primary Color</label><input type="color" className="w-full h-10 rounded-xl bg-white/5 border border-white/10" value={settings.branding?.primaryColor || "#6366f1"} onChange={(e) => setSettings({...settings, branding: {...settings.branding, primaryColor: e.target.value}})} /></div>
          </div>
        </motion.div>
        <motion.div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4"><Mail className="w-5 h-5 text-coral" /><h2 className="font-semibold">Contact</h2></div>
          <div className="space-y-4">
            <div><label className="block text-sm text-white/60 mb-2">Email</label><input className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" value={settings.contact?.email || ""} onChange={(e) => setSettings({...settings, contact: {...settings.contact, email: e.target.value}})} /></div>
            <div><label className="block text-sm text-white/60 mb-2">Phone</label><input className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50" value={settings.contact?.phone || ""} onChange={(e) => setSettings({...settings, contact: {...settings.contact, phone: e.target.value}})} /></div>
          </div>
        </motion.div>
        <motion.div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4"><Globe className="w-5 h-5 text-emerald" /><h2 className="font-semibold">Maintenance Mode</h2></div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={settings.maintenanceMode || false} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} className="w-5 h-5 rounded accent-accent" />
            <span className="text-sm text-white/60">Enable maintenance mode</span>
          </div>
        </motion.div>
        <button onClick={save} disabled={saving} className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 flex items-center gap-2">
          <Save className="w-4 h-4" />{saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
