import { cn } from '@/lib/utils';
import type { MatchCategory, ProcessStatus } from '@/lib/types';
import { matchCategoryConfig, processStatusConfig } from '@/lib/utils';

interface MatchBadgeProps {
  category: MatchCategory;
  percentage?: number;
}

const categoryStyles: Record<MatchCategory, React.CSSProperties> = {
  HIGH:   { background: '#DAFBF2', color: '#8ED9C4', border: '1px solid var(--color-mint)' },
  MEDIUM: { background: '#FEECD8', color: '#FFB863', border: '1px solid var(--color-accent)' },
  LOW:    { background: '#FFF4F2', color: '#FF596D', border: '1px solid var(--color-coral)' },
};

export function MatchBadge({ category, percentage }: MatchBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={categoryStyles[category]}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: 'currentColor' }}
      />
      {matchCategoryConfig[category].label}
      {percentage !== undefined && (
        <span className="font-bold">{Math.round(percentage)}%</span>
      )}
    </span>
  );
}

const statusStyles: Record<ProcessStatus, React.CSSProperties> = {
  DRAFT:                 { background: '#F3F4F6', color: '#6B7280' },
  READY_FOR_MATCH:       { background: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  CVS_UPLOADED:          { background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' },
  MATCHING:              { background: '#FEECD8', color: '#FFB863' },
  PROFILING_CONFIGURED:  { background: '#DAFBF2', color: '#8ED9C4' },
  COMPLETED:             { background: '#DAFBF2', color: '#059669' },
};

export function StatusBadge({ status }: { status: ProcessStatus }) {
  const cfg = processStatusConfig[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={statusStyles[status]}
    >
      {cfg.label}
    </span>
  );
}
