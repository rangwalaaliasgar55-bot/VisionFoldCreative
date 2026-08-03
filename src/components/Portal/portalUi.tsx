import React from 'react';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    // Projects
    in_progress: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30',
    in_review: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    delivered: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30',
    // Revisions
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    resolved: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30',
    // Invoices
    paid: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30',
    unpaid: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/30',
    // Messages
    new: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30',
    contacted: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    closed: 'bg-[#888891]/10 text-[#888891] border-[#888891]/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[status] || 'bg-[#222226] text-[#888891] border-[#222226]'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export const PortalCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#121215] border border-[#222226] rounded-xl p-6 ${className}`}>{children}</div>
);

export const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-center py-16 text-[#888891] text-sm uppercase tracking-widest border border-dashed border-[#222226] rounded-xl">
    {label}
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="text-center py-16 text-[#888891] text-xs uppercase tracking-widest animate-pulse">Loading…</div>
);

export const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};
