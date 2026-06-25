import { cn } from '@/lib/utils';
import type { MatchCategory, ProcessStatus } from '@/lib/types';
import { matchCategoryConfig, processStatusConfig } from '@/lib/utils';

interface MatchBadgeProps {
  category: MatchCategory;
  percentage?: number;
}

const categoryStyles: Record<MatchCategory, string> = {
  HIGH:   'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  LOW:    'bg-red-50 text-red-700',
};

const categoryDotStyles: Record<MatchCategory, string> = {
  HIGH:   'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  LOW:    'bg-red-500',
};

export function MatchBadge({ category, percentage }: MatchBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        categoryStyles[category],
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', categoryDotStyles[category])} />
      {matchCategoryConfig[category].label}
      {percentage !== undefined && (
        <span className="font-bold">{Math.round(percentage)}%</span>
      )}
    </span>
  );
}

const statusStyles: Record<ProcessStatus, string> = {
  DRAFT:                 'bg-slate-100 text-slate-600',
  READY_FOR_MATCH:       'bg-violet-50 text-violet-700',
  CVS_UPLOADED:          'bg-violet-50 text-violet-700',
  MATCHING:              'bg-amber-50 text-amber-700',
  PROFILING_CONFIGURED:  'bg-emerald-50 text-emerald-700',
  COMPLETED:             'bg-emerald-50 text-emerald-700',
};

export function StatusBadge({ status }: { status: ProcessStatus }) {
  const cfg = processStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        statusStyles[status],
      )}
    >
      {cfg.label}
    </span>
  );
}
