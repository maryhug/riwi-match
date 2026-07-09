import { cn } from '@/lib/utils'
import type { MatchCategory, ProcessStatus } from '@/lib/types'

interface MatchBadgeProps {
  category: MatchCategory
  percentage?: number
}

const matchMap: Record<MatchCategory, { label: string; dot: string; text: string; bg: string }> = {
  HIGH: { label: 'Alto', dot: 'bg-mint', text: 'text-mint', bg: 'bg-mint-light' },
  MEDIUM: { label: 'Medio', dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent-light' },
  LOW: { label: 'Bajo', dot: 'bg-coral', text: 'text-coral', bg: 'bg-coral-light' },
}

export function MatchBadge({ category, percentage }: MatchBadgeProps) {
  const m = matchMap[category]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        m.bg,
        m.text,
      )}
    >
      <span className={cn('size-1.5 rounded-full', m.dot)} aria-hidden="true" />
      {m.label}
      {percentage !== undefined && <strong className="font-mono font-bold">{percentage}%</strong>}
    </span>
  )
}

interface StatusBadgeProps {
  status: ProcessStatus
}

const statusMap: Record<ProcessStatus, { label: string; text: string; bg: string }> = {
  DRAFT: { label: 'Borrador', text: 'text-text-muted', bg: 'bg-bg-subtle' },
  READY_FOR_MATCH: { label: 'JD Lista', text: 'text-blue', bg: 'bg-blue-light' },
  CVS_UPLOADED: { label: 'CVs Cargados', text: 'text-primary', bg: 'bg-primary-light' },
  MATCHING: { label: 'En Match...', text: 'text-accent', bg: 'bg-accent-light' },
  PROFILING_CONFIGURED: { label: 'Match Completado', text: 'text-mint', bg: 'bg-mint-light' },
  COMPLETED: { label: 'Completado', text: 'text-mint', bg: 'bg-mint-light' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = statusMap[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
        s.bg,
        s.text,
      )}
    >
      {s.label}
    </span>
  )
}
