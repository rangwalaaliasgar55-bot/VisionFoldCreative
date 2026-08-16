/**
 * Shared admin primitives for the page builder.
 * Themed with the VisionFold tokens — do not reintroduce a second palette here.
 */
import React from 'react';
import { LucideIcon } from 'lucide-react';

// Legacy Card component with padding support
export const Card: React.FC<{ children: React.ReactNode; className?: string; padding?: 'none' | 'sm' | 'md' | 'lg' }> = ({ children, className = '', padding = 'md' }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-panel ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-6 py-4">
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-warm">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}> = ({ label, value, delta, deltaTone = 'neutral', icon: Icon }) => {
  const toneColor = deltaTone === 'up' ? 'text-emerald-400' : deltaTone === 'down' ? 'text-red-400' : 'text-muted';
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-warm">{value}</p>
          {delta ? <p className={`mt-1 text-xs font-semibold ${toneColor}`}>{delta}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber/10">
          <Icon className="h-5 w-5 text-amber" />
        </div>
      </div>
    </Card>
  );
};

const statusStyles: Record<string, string> = {
  new: 'bg-blue-400/10 text-blue-400',
  contacted: 'bg-amber-400/10 text-amber-400',
  closed: 'bg-[var(--color-muted)]/10 text-muted',
  in_progress: 'bg-blue-400/10 text-blue-400',
  in_review: 'bg-amber-400/10 text-amber-400',
  delivered: 'bg-emerald-400/10 text-emerald-400',
  paid: 'bg-emerald-400/10 text-emerald-400',
  unpaid: 'bg-amber-400/10 text-amber-400',
  overdue: 'bg-red-400/10 text-red-400',
  pending: 'bg-amber-400/10 text-amber-400',
  resolved: 'bg-emerald-400/10 text-emerald-400',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status] || 'bg-[var(--color-muted)]/10 text-muted'}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status.replace('_', ' ')}
  </span>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-sm text-muted">{message}</p>
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
  </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    {...props}
    className={`flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-warm disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  >
    {children}
  </button>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    {...props}
    className={`flex items-center gap-2 rounded-lg border border-white/[0.07] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-warm transition-colors hover:border-amber/50 hover:text-amber disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  >
    {children}
  </button>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      className={`w-full rounded-lg border border-white/[0.07] bg-ink px-3 py-2.5 text-sm text-warm transition-colors focus:border-brand-500 focus:outline-none ${className}`}
    />
  )
);
Input.displayName = 'Input';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select
    {...props}
    className={`w-full rounded-lg border border-white/[0.07] bg-ink px-3 py-2.5 text-sm text-warm transition-colors focus:border-brand-500 focus:outline-none ${className}`}
  >
    {children}
  </select>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full rounded-lg border border-white/[0.07] bg-ink px-3 py-2.5 text-sm text-warm transition-colors focus:border-brand-500 focus:outline-none ${className}`}
  />
);

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
