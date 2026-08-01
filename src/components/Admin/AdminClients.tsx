import React, { useState } from 'react';
import { Users, UserPlus, FolderKanban, Mail, Phone, Building, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { User, Project } from '../../types';

interface AdminClientsProps {
  clients: User[];
  projects: Project[];
  onRefresh: () => void;
}

export const AdminClients: React.FC<AdminClientsProps> = ({ clients, projects, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('client123');
  const [submitting, setSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; pass: string } | null>(null);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createClient({ email, name, company, phone, password });
      setCreatedInfo({ email, pass: password });
      onRefresh();
      setEmail('');
      setName('');
      setCompany('');
      setPhone('');
    } catch (err: any) {
      alert(err.message || 'Failed to add client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400">
            Client Directory
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Client Accounts</h2>
          <p className="text-xs text-slate-400">
            Manage registered clients and view project histories per client.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setCreatedInfo(null);
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Client Manually
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          const clientProjects = projects.filter((p) => p.clientId === client.id);

          return (
            <div
              key={client.id}
              className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 hover:border-amber-500/40 transition-all space-y-4 fold-card"
            >
              <div>
                <h3 className="text-lg font-bold text-white">{client.name}</h3>
                <p className="text-xs font-medium text-amber-400">{client.company || 'Individual Creator'}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#222736]">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400 flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                    Project History
                  </span>
                  <span className="text-amber-400">{clientProjects.length} Projects</span>
                </div>

                {clientProjects.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No projects assigned yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {clientProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded bg-[#161922] text-xs flex items-center justify-between"
                      >
                        <span className="text-slate-200 truncate font-medium">{p.title}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 ml-2">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131a] border border-[#222736] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Add New Client Account</h3>

            {createdInfo ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Client Created Successfully!
                </p>
                <p className="text-xs text-slate-300">
                  Share these login details with the client:
                </p>
                <div className="p-2.5 bg-[#161922] rounded text-xs font-mono text-amber-300">
                  <div>Email: {createdInfo.email}</div>
                  <div>Password: {createdInfo.pass}</div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateClient} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Company / Channel
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Aura Apparel"
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    {submitting ? 'Creating...' : 'Create Client'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
