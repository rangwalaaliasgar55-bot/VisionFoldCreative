import { useStore } from "../../store/useStore";

export default function PortalSettings() {
  const { user } = useStore();
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-6">Settings</h1>
      <div className="glass rounded-2xl p-6 border border-white/5 max-w-lg space-y-4">
        <div>
          <label className="text-sm text-white/40">Name</label>
          <div className="text-white">{user?.name}</div>
        </div>
        <div>
          <label className="text-sm text-white/40">Email</label>
          <div className="text-white">{user?.email}</div>
        </div>
        <div>
          <label className="text-sm text-white/40">Role</label>
          <div className="text-white capitalize">{user?.role}</div>
        </div>
      </div>
    </div>
  );
}
