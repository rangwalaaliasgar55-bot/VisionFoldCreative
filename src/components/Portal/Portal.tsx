import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Project {
  id: string;
  title: string;
  status: string;
  category: string;
  deliveryDate?: string;
  amountInr: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountInr: number;
  dueDate: string;
  status: string;
  description: string;
}

interface Revision {
  id: string;
  projectId: string;
  comment: string;
  status: string;
  createdAt: string;
}

interface PortalProps {
  onNavigate: (page: string) => void;
}

export function Portal({ onNavigate }: PortalProps) {
  const { user, token, isLoading, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'invoices' | 'revisions'>('dashboard');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [revisionComment, setRevisionComment] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!token) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [projectsRes, invoicesRes, revisionsRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/invoices', { headers }),
        fetch('/api/revisions', { headers }),
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }
      if (revisionsRes.ok) {
        const data = await revisionsRes.json();
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = await login(loginEmail, loginPassword);
    if (!result.success) {
      setLoginError(result.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const submitRevision = async (projectId: string) => {
    if (!revisionComment.trim() || !token) return;
    
    try {
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, comment: revisionComment }),
      });
      
      if (res.ok) {
        setRevisionComment('');
        fetchData();
        alert('Revision request submitted!');
      }
    } catch (err) {
      console.error('Failed to submit revision:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#EDEDED] mb-2">Client Portal</h1>
            <p className="text-[#A0A0A0]">Sign in to view your projects</p>
          </div>
          
          <form onSubmit={handleLogin} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
            <div className="mb-4">
              <label className="block text-[#EDEDED] text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-[#EDEDED] text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]"
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && (
              <div className="mb-4 text-red-500 text-sm">{loginError}</div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] text-[#0A0A0B] font-semibold rounded-lg hover:bg-[#E5C04B] transition-colors"
            >
              Sign In
            </button>
          </form>
          
          <button
            onClick={() => onNavigate('home')}
            className="w-full mt-4 py-2 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'Projects' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'revisions', label: 'Revisions' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A0A0B] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#EDEDED]">Welcome, {user.name}</h1>
            <p className="text-[#A0A0A0]">{user.company || user.email}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-[#EDEDED] border border-[#2A2A2E] rounded-lg hover:bg-[#141416] transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 text-[#0A0A0B] bg-[#D4AF37] rounded-lg hover:bg-[#E5C04B] transition-colors"
            >
              Home
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#2A2A2E]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-[#A0A0A0] hover:text-[#EDEDED]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
              <h3 className="text-[#A0A0A0] text-sm mb-2">Active Projects</h3>
              <p className="text-3xl font-bold text-[#EDEDED]">
                {projects.filter((p) => p.status === 'in-progress').length}
              </p>
            </div>
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
              <h3 className="text-[#A0A0A0] text-sm mb-2">Pending Invoices</h3>
              <p className="text-3xl font-bold text-[#EDEDED]">
                {invoices.filter((i) => i.status === 'unpaid').length}
              </p>
            </div>
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
              <h3 className="text-[#A0A0A0] text-sm mb-2">Revision Requests</h3>
              <p className="text-3xl font-bold text-[#EDEDED]">
                {revisions.filter((r) => r.status === 'pending').length}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-[#A0A0A0]">No projects found</div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#EDEDED]">{project.title}</h3>
                      <p className="text-[#A0A0A0]">{project.category}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        project.status === 'completed'
                          ? 'bg-green-900/50 text-green-400'
                          : project.status === 'in-progress'
                          ? 'bg-blue-900/50 text-blue-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {project.status}
                      </span>
                      {project.deliveryDate && (
                        <p className="text-[#A0A0A0] text-sm mt-1">Due: {project.deliveryDate}</p>
                      )}
                    </div>
                  </div>
                  {project.amountInr > 0 && (
                    <p className="text-[#D4AF37] mt-4">₹{project.amountInr.toLocaleString()}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-[#A0A0A0]">No invoices found</div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#EDEDED]">{invoice.invoiceNumber}</h3>
                      <p className="text-[#A0A0A0]">{invoice.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#D4AF37]">₹{invoice.amountInr.toLocaleString()}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm mt-1 ${
                        invoice.status === 'paid'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[#A0A0A0] text-sm mt-2">Due: {invoice.dueDate}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'revisions' && (
          <div className="space-y-4">
            {projects.length > 0 && (
              <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#EDEDED] mb-4">Request Revision</h3>
                <select className="w-full mb-4 px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#EDEDED]">
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <textarea
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Describe your revision request..."
                  className="w-full mb-4 px-4 py-3 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#EDEDED] h-32 resize-none"
                />
                <button
                  onClick={() => {
                    const select = document.querySelector('select') as HTMLSelectElement;
                    if (select.value) submitRevision(select.value);
                  }}
                  className="px-6 py-2 bg-[#D4AF37] text-[#0A0A0B] font-semibold rounded-lg hover:bg-[#E5C04B]"
                >
                  Submit Request
                </button>
              </div>
            )}
            
            {revisions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#EDEDED] mb-4">Your Revision Requests</h3>
                {revisions.map((rev) => (
                  <div key={rev.id} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#EDEDED]">{rev.comment}</p>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        rev.status === 'approved'
                          ? 'bg-green-900/50 text-green-400'
                          : rev.status === 'rejected'
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                    <p className="text-[#A0A0A0] text-sm mt-2">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
