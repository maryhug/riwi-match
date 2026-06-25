import { cn } from '@/lib/utils';
import type { MatchCategory, ProcessStatus } from '@/lib/types';
import { matchCategoryConfig, processStatusConfig } from '@/lib/utils';

interface MatchBadgeProps {
  category: MatchCategory;
  percentage?: number;
}

const categoryStyles: Record<MatchCategory, React.CSSProperties> = {
  HIGH:   { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
  MEDIUM: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' },
  LOW:    { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' },
};

export function MatchBadge({ category, percentage }: MatchBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold"
      style={categoryStyles[category]}
    >
      <span
        className="w-1.5 h-1.5 rounded-sm shrink-0"
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
  DRAFT:                 { background: '#F1F5F9', color: '#475569' },
  READY_FOR_MATCH:       { background: '#EDE9FE', color: '#5B21B6' },
  CVS_UPLOADED:          { background: '#EDE9FE', color: '#7C3AED' },
  MATCHING:              { background: '#FEF3C7', color: '#92400E' },
  PROFILING_CONFIGURED:  { background: '#D1FAE5', color: '#065F46' },
  COMPLETED:             { background: '#D1FAE5', color: '#065F46' },
};

export function StatusBadge({ status }: { status: ProcessStatus }) {
  const cfg = processStatusConfig[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
      style={statusStyles[status]}
    >
      {cfg.label}
    </span>
  );
}
