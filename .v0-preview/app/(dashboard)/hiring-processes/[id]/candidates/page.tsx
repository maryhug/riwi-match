'use client'

import { PhoneCall, X } from 'lucide-react'
import { notFound, useParams } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MatchBadge } from '@/components/riwi/badge'
import { Button } from '@/components/riwi/button'
import { Header } from '@/components/riwi/header'
import { processesApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { DualKanbanResponse, DualMatchCandidate } from '@/lib/types'

type ViewMode = 'cv' | 'profiling' | 'both'

const COLUMNS: {
  key: keyof DualKanbanResponse
  label: string
  chip: string
}[] = [
  { key: 'HIGH', label: 'Alto', chip: 'bg-mint text-white' },
  { key: 'MEDIUM', label: 'Medio', chip: 'bg-accent-solid text-white' },
  { key: 'LOW', label: 'Bajo', chip: 'bg-coral-solid text-white' },
  { key: 'LOADED', label: 'Cargados', chip: 'bg-bg-subtle text-text border border-border' },
  { key: 'PARSING', label: 'Procesando', chip: 'bg-blue-solid text-white' },
]

function CandidateCard({
  item,
  view,
  selected,
  onToggle,
}: {
  item: DualMatchCandidate
  view: ViewMode
  selected: boolean
  onToggle: () => void
}) {
  const fullName = `${item.candidate.name} ${item.candidate.last_name}`
  const showCv = view === 'cv' || view === 'both'
  const showProfiling = (view === 'profiling' || view === 'both') && item.match_category != null

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[14px] border bg-surface p-4 transition-colors',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-ink">{fullName}</p>
          <p className="truncate text-[11px] text-text-muted">{item.candidate.email}</p>
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Seleccionar a ${fullName}`}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {showCv && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">CV</span>
            <MatchBadge category={item.cv_match_category} percentage={item.cv_match_percentage} />
          </div>
        )}
        {showProfiling && item.match_category && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Profiling
            </span>
            <MatchBadge category={item.match_category} percentage={item.match_percentage} />
          </div>
        )}
        {(view === 'profiling' || view === 'both') && item.match_category == null && (
          <p className="text-[11px] italic text-text-muted">Sin profiling aún</p>
        )}
      </div>
    </div>
  )
}

export default function CandidatesPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [view, setView] = useState<ViewMode>('both')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: process, isLoading: loadingProcess } = useQuery({
    queryKey: ['process', params.id],
    queryFn: () => processesApi.get(params.id).then((r) => r.data),
  })

  const { data: dualKanban, isLoading: loadingKanban } = useQuery({
    queryKey: ['kanban', params.id],
    queryFn: () => processesApi.getKanban(params.id).then((r) => r.data),
    enabled: !!process,
  })

  const startProfilingMutation = useMutation({
    mutationFn: (ids: string[]) => processesApi.startProfiling(params.id, ids),
    onSuccess: () => {
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['kanban', params.id] })
      queryClient.invalidateQueries({ queryKey: ['profiling-runs', params.id] })
    },
  })

  if (loadingProcess || (process && loadingKanban)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  if (!process || !dualKanban) notFound()

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const viewOptions: { value: ViewMode; label: string }[] = [
    { value: 'cv', label: 'CV' },
    { value: 'profiling', label: 'Profiling' },
    { value: 'both', label: 'Ambos' },
  ]

  return (
    <div className="flex w-full flex-col">
      <Header
        title="Candidatos"
        subtitle={process.name}
        rightBelow={
          <div
            role="tablist"
            aria-label="Modo de vista de match"
            className="flex rounded-full border border-border bg-surface p-1"
          >
            {viewOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                role="tab"
                aria-selected={view === o.value}
                onClick={() => setView(o.value)}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                  view === o.value
                    ? 'bg-primary-solid text-white'
                    : 'text-text-muted hover:text-ink',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="-mx-1 overflow-x-auto px-1 pb-4">
        <div className="flex min-w-max gap-4">
          {COLUMNS.map((col) => {
            const items = dualKanban[col.key]
            return (
              <section key={col.key} aria-label={`Columna ${col.label}`} className="w-64 shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                      col.chip,
                    )}
                  >
                    {col.label}
                  </span>
                  <span className="font-mono text-xs font-semibold text-text-muted">{items.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {items.length === 0 ? (
                    <p className="rounded-[14px] border border-dashed border-border p-4 text-center text-[11px] text-text-muted">
                      Sin candidatos
                    </p>
                  ) : (
                    items.map((item) => (
                      <CandidateCard
                        key={item.id}
                        item={item}
                        view={view}
                        selected={selected.has(item.id)}
                        onToggle={() => toggle(item.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* Barra de acción flotante */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full border border-border bg-surface px-5 py-3 shadow-lg">
            <span className="text-xs font-semibold text-ink">
              {selected.size} candidato{selected.size > 1 ? 's' : ''} seleccionado{selected.size > 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              loading={startProfilingMutation.isPending}
              onClick={() => startProfilingMutation.mutate(Array.from(selected))}
            >
              <PhoneCall className="size-4" aria-hidden="true" />
              Iniciar llamadas de profiling
            </Button>
            <button
              type="button"
              aria-label="Limpiar selección"
              onClick={() => setSelected(new Set())}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-subtle hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
