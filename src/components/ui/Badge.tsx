import { cn } from '@/lib/utils';
import type { MatchCategory, ProcessStatus } from '@/lib/types';
import { matchCategoryConfig, processStatusConfig } from '@/lib/utils';

interface MatchBadgeProps {
  category: MatchCategory;
  percentage?: number;
}

const categoryStyles: Record<MatchCategory, React.CSSProperties> = {
  HIGH:   { background: '#DAFBF2', color: '#0D9488', border: '1px solid #8ED9C4' },
  MEDIUM: { background: '#FEECD8', color: '#D97706', border: '1px solid #FFB863' },
  LOW:    { background: '#FFF4F2', color: '#E11D48', border: '1px solid #FF596D' },
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
  READY_FOR_MATCH:       { background: '#EEE9FF', color: '#967DF5' },
  CVS_UPLOADED:          { background: '#EEE9FF', color: '#7A6CE0' },
  MATCHING:              { background: '#FEECD8', color: '#D97706' },
  PROFILING_CONFIGURED:  { background: '#DAFBF2', color: '#0D9488' },
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
