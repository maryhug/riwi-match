'use client'

import { AlertTriangle, CheckCircle2, PhoneCall, PhoneMissed, Radio } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/riwi/header'
import { StatCard } from '@/components/riwi/stat-card'
import { formatDate, MAX_CONCURRENT_CALLS } from '@/lib/data'
import { processesApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ProfilingStatus } from '@/lib/types'

const STATUS_BADGES: Record<ProfilingStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendiente', bg: 'bg-bg-subtle', text: 'text-text-muted' },
  CALLING: { label: 'En llamada', bg: 'bg-blue-light', text: 'text-blue' },
  COMPLETED: { label: 'Completada', bg: 'bg-mint-light', text: 'text-mint' },
  FAILED: { label: 'Fallida', bg: 'bg-coral-light', text: 'text-coral' },
  NO_ANSWER: { label: 'Sin respuesta', bg: 'bg-accent-light', text: 'text-accent' },
}

const PROB_STYLES: Record<'HIGH' | 'MEDIUM' | 'LOW', { label: string; text: string }> = {
  HIGH: { label: 'Alta', text: 'text-mint' },
  MEDIUM: { label: 'Media', text: 'text-accent' },
  LOW: { label: 'Baja', text: 'text-coral' },
}

export default function ProfilingPage() {
  const { data: profilingRuns = [], isLoading } = useQuery({
    queryKey: ['profiling-runs'],
    queryFn: () => processesApi.getGlobalProfilingRuns().then((r) => r.data),
  })

  const total = profilingRuns.length
  const calling = profilingRuns.filter((r) => r.status === 'CALLING').length
  const completed = profilingRuns.filter((r) => r.status === 'COMPLETED').length
  const failed = profilingRuns.filter((r) => r.status === 'FAILED' || r.status === 'NO_ANSWER').length

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <Header title="Llamadas de profiling" subtitle="Monitoreo de llamadas de voz (ElevenLabs + Twilio)" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Llamadas totales"
          value={total}
          icon={PhoneCall}
          chipBg="bg-primary-light"
          chipFg="text-primary"
        />
        <StatCard
          label="En curso"
          value={calling}
          icon={Radio}
          chipBg="bg-blue-light"
          chipFg="text-blue"
        />
        <StatCard
          label="Completadas"
          value={completed}
          icon={CheckCircle2}
          chipBg="bg-mint-light"
          chipFg="text-mint"
        />
        <StatCard
          label="Fallidas"
          value={failed}
          icon={PhoneMissed}
          chipBg="bg-coral-light"
          chipFg="text-coral"
        />
      </div>

      <div
        role="status"
        className="mb-6 flex items-center gap-3 rounded-[14px] bg-accent-light px-4 py-3"
      >
        <AlertTriangle className="size-4 shrink-0 text-accent-dark" aria-hidden="true" />
        <p className="text-xs font-medium text-accent-dark">
          El sistema permite un máximo de{' '}
          <strong className="font-mono">{MAX_CONCURRENT_CALLS}</strong> llamadas simultáneas. Las
          llamadas adicionales quedan en cola con estado Pendiente.
        </p>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border bg-bg-subtle">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  Candidato
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  Estado
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  Intentos
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  Prob. de avance
                </th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted md:table-cell">
                  Inicio
                </th>
                <th className="hidden px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted md:table-cell">
                  Fin
                </th>
              </tr>
            </thead>
            <tbody>
              {profilingRuns.map((run) => {
                const badge = STATUS_BADGES[run.status as ProfilingStatus] ?? STATUS_BADGES.PENDING
                const prob = run.advancement_probability
                  ? PROB_STYLES[run.advancement_probability]
                  : null
                return (
                  <tr key={run.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">
                      {run.candidate_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
                          badge.bg,
                          badge.text,
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-text">{run.call_attempts}</td>
                    <td className="px-4 py-3">
                      {prob ? (
                        <span className={cn('text-xs font-bold uppercase', prob.text)}>{prob.label}</span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-text-muted md:table-cell">
                      {run.started_at ? formatDate(run.started_at) : '—'}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-text-muted md:table-cell">
                      {run.completed_at ? formatDate(run.completed_at) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
