import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  chipBg: string
  chipFg: string
  active?: boolean
  onClick?: () => void
}

export function StatCard({ icon: Icon, label, value, chipBg, chipFg, active, onClick }: StatCardProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'flex items-center gap-4 rounded-[14px] border bg-surface p-5 text-left transition-colors',
        onClick &&
          'cursor-pointer hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg',
        active ? 'border-l-4 border-primary shadow-tinted' : 'border-border',
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', chipBg)}>
        <Icon className={cn('size-4', chipFg)} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-mono text-2xl font-bold leading-tight text-ink">{value}</span>
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </span>
      </span>
    </Comp>
  )
}
