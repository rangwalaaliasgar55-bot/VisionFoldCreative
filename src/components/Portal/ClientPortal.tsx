import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  FileCheck,
  Receipt,
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  ExternalLink,
  Send,
  History,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Project, Invoice, Revision } from '../../types';
import { formatINR, formatDate } from '../../lib/formatters';

export const ClientPortal: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'projects' | 'invoices' | 'profile'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);
  const [revSuccess, setRevSuccess] = useState('');

  const loadData = async () => {
    try {
      const [pRes, iRes, rRes] = await Promise.all([
        api.getProjects(),
        api.getInvoices(),
        api.getRevisions(),
      ]);
      setProjects(pRes);
      setInvoices(iRes);
      setRevisions(rRes);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveProject = async (projectId: string) => {
    try {
      await api.updateProject(projectId, { status: 'delivered' });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: 'delivered' } : p))
      );
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, status: 'delivered' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve project');
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !revisionComment.trim()) return;

    setSubmittingRev(true);
    setRevSuccess('');

    try {
      const newRev = await api.createRevision(selectedProject.id, revisionComment);
      setRevisions((prev) => [newRev, ...prev]);
      // Set project status to in_review
      await api.updateProject(selectedProject.id, { status: 'in_review' });
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...p, status: 'in_review' } : p))
      );
      setRevisionComment('');
      setRevSuccess('Revision request submitted to Aliasgar! Status updated to In Review.');
    } catch (err: any) {
      alert(err.message || 'Failed to request revision');
    } finally {
      setSubmittingRev(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading client portal...</div>;
  }

  return (
    <div className="min-h-screen text-slate-100 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Portal Header */}
      <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
            Client Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {user?.company || 'Personal Account'} · {user?.email}
          </p>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-2 bg-[#161922] p-1.5 rounded-xl border border-[#222736]">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            My Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'invoices'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Projects List Column */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Active & Completed Edits</h2>

            {projects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#11131a] border border-[#222736] text-center text-slate-400 text-sm">
                No active projects found. Submit an inquiry from the Contact page to start your first edit.
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProject(proj);
                      setRevSuccess('');
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#161922] border-amber-500 shadow-lg'
                        : 'bg-[#11131a] border-[#222736] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {proj.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          proj.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : proj.status === 'in_review'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{proj.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>

                    <div className="mt-3 pt-3 border-t border-[#222736] flex items-center justify-between text-xs text-slate-400">
                      <span>Started: {formatDate(proj.startDate)}</span>
                      <span className="font-bold text-amber-400 inr-price">{formatINR(proj.amountINR)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Project Workspace Column */}
          <div className="lg:col-span-7">
            {selectedProject ? (
              <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#222736]">
                  <div>
                    <span className="text-xs font-mono text-amber-400 uppercase font-semibold">
                      {selectedProject.category}
                    </span>
                    <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
                  </div>

                  {selectedProject.status !== 'delivered' && (
                    <button
                      onClick={() => handleApproveProject(selectedProject.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Project
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Project Scope
                  </h3>
                  <p className="text-slate-200 text-sm leading-relaxed">{selectedProject.description}</p>
                </div>

                {/* Delivered Files / Video Links */}
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                    Delivered Files & Media
                  </h3>
                  {selectedProject.deliveredFiles && selectedProject.deliveredFiles.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.deliveredFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#161922] border border-[#222736]"
                        >
                          <span className="text-sm font-semibold text-slate-200 truncate">{f.name}</span>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No final files uploaded yet. Aliasgar is currently editing.</p>
                  )}
                </div>

                {/* REVISION WORKFLOW */}
                <div className="pt-4 border-t border-[#222736]">
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <MessageSquarePlus className="w-5 h-5 text-amber-400" />
                    Request a Revision
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Specific timestamped comments or adjustments needed for this edit.
                  </p>

                  {revSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      {revSuccess}
                    </div>
                  )}

                  <form onSubmit={handleRequestRevision} className="space-y-3">
                    <textarea
                      rows={3}
                      required
                      value={revisionComment}
                      onChange={(e) => setRevisionComment(e.target.value)}
                      placeholder="e.g. Please increase background music at 01:20 and adjust caption position..."
                      className="w-full p-3 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:border-amber-500 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingRev}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingRev ? 'Submitting...' : 'Submit Revision Request'}
                    </button>
                  </form>

                  {/* Revision History Log */}
                  <div className="mt-6 pt-4 border-t border-[#222736]">
                    <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-400" />
                      Revision Log History
                    </h4>

                    {revisions.filter((r) => r.projectId === selectedProject.id).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No revisions requested yet for this project.</p>
                    ) : (
                      <div className="space-y-3">
                        {revisions
                          .filter((r) => r.projectId === selectedProject.id)
                          .map((rev) => (
                            <div key={rev.id} className="p-3.5 rounded-xl bg-[#161922] border border-[#222736] text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-300">{formatDate(rev.createdAt)}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    rev.status === 'resolved'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : rev.status === 'in_progress'
                                      ? 'bg-indigo-500/20 text-indigo-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {rev.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-slate-200 mt-1">{rev.comment}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-12 text-center text-slate-400">
                Select a project from the left menu to view files or request revisions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Billing & Invoices</h2>

          {invoices.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No invoices issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#161922] text-xs uppercase font-bold text-slate-400">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Invoice #</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Amount (INR)</th>
                    <th className="p-3.5 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222736]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#161922]/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                      <td className="p-3.5 text-slate-200">{inv.description}</td>
                      <td className="p-3.5 text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="p-3.5 font-extrabold text-white inr-price">{formatINR(inv.amountINR)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : inv.status === 'overdue'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
