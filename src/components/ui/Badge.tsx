import { cn } from '@/lib/utils';
import type { MatchCategory, ProcessStatus } from '@/lib/types';
import { matchCategoryConfig, processStatusConfig } from '@/lib/utils';

interface MatchBadgeProps {
  category: MatchCategory;
  percentage?: number;
}

const categoryStyles: Record<MatchCategory, string> = {
  HIGH:   'bg-mint-light text-mint-dark',
  MEDIUM: 'bg-accent-light text-accent-dark',
  LOW:    'bg-coral-light text-coral-dark',
};

const categoryDotStyles: Record<MatchCategory, string> = {
  HIGH:   'bg-mint',
  MEDIUM: 'bg-accent',
  LOW:    'bg-coral',
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
  DRAFT:                 'bg-bg-subtle text-text',
  READY_FOR_MATCH:       'bg-blue-light text-blue',
  CVS_UPLOADED:          'bg-primary-light text-primary',
  MATCHING:              'bg-accent-light text-accent-dark',
  PROFILING_CONFIGURED:  'bg-mint-light text-mint-dark',
  COMPLETED:             'bg-mint-light text-mint-dark',
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
