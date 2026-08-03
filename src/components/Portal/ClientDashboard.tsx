import React, { useEffect, useState } from 'react';
import { PortalLayout } from './PortalLayout';
import { StatusBadge, PortalCard, EmptyState, LoadingState, formatINR, formatDate } from './portalUi';
import { projectsApi, revisionsApi, invoicesApi } from '../../lib/api';
import type { Project, Revision, Invoice } from '../../types';
import { useSfx } from '../../context/SfxContext';
import { Send, FileText, Film, MessageSquare } from 'lucide-react';

interface ClientDashboardProps {
  onNavigate: (page: string) => void;
}

const TABS = [
  { id: 'projects', label: 'My Projects' },
  { id: 'invoices', label: 'Invoices' },
];

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => setProjects([]));
    invoicesApi.list().then(setInvoices).catch(() => setInvoices([]));
  }, []);

  return (
    <PortalLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} onNavigate={onNavigate}>
      {activeTab === 'projects' && <ProjectsPanel projects={projects} />}
      {activeTab === 'invoices' && <InvoicesPanel invoices={invoices} />}
    </PortalLayout>
  );
};

const ProjectsPanel: React.FC<{ projects: Project[] | null }> = ({ projects }) => {
  if (projects === null) return <LoadingState />;
  if (projects.length === 0) return <EmptyState label="No active projects yet — reach out to get one started." />;

  return (
    <div className="flex flex-col gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { playClick, playHover } = useSfx();

  useEffect(() => {
    revisionsApi.list(project.id).then(setRevisions).catch(() => setRevisions([]));
  }, [project.id]);

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await revisionsApi.create({ projectId: project.id, comment: comment.trim() });
      setRevisions((prev) => [created, ...(prev || [])]);
      setComment('');
      playClick();
    } catch {
      // Keep the comment in the box so the client doesn't lose their note if this fails.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalCard>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0A0A0B] border border-[#222226] flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#EDEDED] mb-1">{project.title}</h3>
            <p className="text-sm text-[#888891] max-w-xl">{project.description}</p>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-xs mb-6 pb-6 border-b border-[#222226]">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Category</div>
          <div className="text-[#EDEDED]">{project.category}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Started</div>
          <div className="text-[#EDEDED]">{formatDate(project.startDate)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">Investment</div>
          <div className="text-[#D4AF37] font-bold inr-price">{formatINR(project.amountINR)}</div>
        </div>
      </div>

      {project.deliveredFiles && project.deliveredFiles.length > 0 && (
        <div className="mb-6 pb-6 border-b border-[#222226]">
          <div className="text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-3">Delivered Files</div>
          <div className="flex flex-col gap-2">
            {project.deliveredFiles.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#EDEDED] hover:text-[#D4AF37] transition-colors"
              >
                <FileText className="w-4 h-4 text-[#D4AF37]" /> {file.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-4">
          <MessageSquare className="w-3.5 h-3.5" /> Revision Requests
        </div>

        {revisions === null ? (
          <div className="text-xs text-[#888891] uppercase tracking-widest">Loading…</div>
        ) : revisions.length === 0 ? (
          <p className="text-xs text-[#888891] mb-4">No revision requests yet on this project.</p>
        ) : (
          <div className="flex flex-col gap-3 mb-5">
            {revisions.map((rev) => (
              <div key={rev.id} className="bg-[#0A0A0B] border border-[#222226] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#888891] uppercase tracking-widest">{formatDate(rev.createdAt)}</span>
                  <StatusBadge status={rev.status} />
                </div>
                <p className="text-sm text-[#EDEDED]">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmitRevision} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Request a change or leave feedback…"
            className="flex-1 bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] px-4 py-3 text-sm rounded focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            onMouseEnter={playHover}
            className="flex items-center justify-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" /> Submit
          </button>
        </form>
      </div>
    </PortalCard>
  );
};

const InvoicesPanel: React.FC<{ invoices: Invoice[] | null }> = ({ invoices }) => {
  if (invoices === null) return <LoadingState />;
  if (invoices.length === 0) return <EmptyState label="No invoices on file yet." />;

  return (
    <div className="flex flex-col gap-4">
      {invoices.map((inv) => (
        <PortalCard key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#888891] uppercase tracking-widest font-bold mb-1">{inv.invoiceNumber}</div>
            <div className="text-[#EDEDED] font-medium mb-1">{inv.description}</div>
            <div className="text-xs text-[#888891]">Due {formatDate(inv.dueDate)}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-[#D4AF37] inr-price">{formatINR(inv.amountINR)}</span>
            <StatusBadge status={inv.status} />
          </div>
        </PortalCard>
      ))}
    </div>
  );
};
