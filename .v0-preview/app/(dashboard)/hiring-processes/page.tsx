'use client'

import {
  Archive,
  Briefcase,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { StatusBadge } from '@/components/riwi/badge'
import { Button } from '@/components/riwi/button'
import { Card } from '@/components/riwi/card'
import { Header } from '@/components/riwi/header'
import { StatCard } from '@/components/riwi/stat-card'
import { formatDate } from '@/lib/data'
import { processesApi } from '@/lib/api'
import type { ProcessStatus } from '@/lib/types'
import { useSession } from '../layout'

type FilterGroup = 'ACTIVE' | 'MATCHING' | 'COMPLETED' | 'TOTAL'

const GROUP_STATUSES: Record<FilterGroup, ProcessStatus[]> = {
  ACTIVE: ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'],
  MATCHING: ['MATCHING'],
  COMPLETED: ['PROFILING_CONFIGURED', 'COMPLETED'],
  TOTAL: ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED', 'MATCHING', 'PROFILING_CONFIGURED', 'COMPLETED'],
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'READY_FOR_MATCH', label: 'JD Lista' },
  { value: 'CVS_UPLOADED', label: 'CVs Cargados' },
  { value: 'MATCHING', label: 'En Match...' },
  { value: 'PROFILING_CONFIGURED', label: 'Match Completado' },
  { value: 'COMPLETED', label: 'Completado' },
]

function RowMenu({ processId, onArchive }: { processId: string; onArchive: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Acciones"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 flex w-40 flex-col rounded-[14px] border border-border bg-surface-raised p-1.5 shadow-tinted-lg">
          <button
            type="button"
            onClick={() => router.push(`/hiring-processes/${processId}`)}
            className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-xs font-medium text-text transition-colors hover:bg-bg-subtle cursor-pointer"
          >
            <Eye className="size-3.5" /> Ver detalle
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-xs font-medium text-text transition-colors hover:bg-bg-subtle cursor-pointer"
          >
            <Copy className="size-3.5" /> Duplicar
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onArchive(processId)
            }}
            className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-xs font-medium text-coral transition-colors hover:bg-coral-light cursor-pointer"
          >
            <Archive className="size-3.5" /> Archivar
          </button>
        </div>
      )}
    </div>
  )
}

export default function HiringProcessesPage() {
  const router = useRouter()
  const session = useSession()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<FilterGroup>('TOTAL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [archiveError, setArchiveError] = useState('')

  const { data: hiringProcesses = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => processesApi.updateStatus(id, 'ARCHIVED'),
    onSuccess: () => {
      setArchiveError('')
      queryClient.invalidateQueries({ queryKey: ['hiring-processes'] })
    },
    onError: (err) => {
      // El backend valida transiciones de estado reales — un proceso solo puede archivarse
      // una vez cerrado (CLOSED → ARCHIVED). Mostramos el motivo real en vez de fallar en silencio.
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setArchiveError(axiosErr.response?.data?.detail || 'No se pudo archivar el proceso.')
    },
  })

  const counts = useMemo(
    () => ({
      ACTIVE: hiringProcesses.filter((p) => GROUP_STATUSES.ACTIVE.includes(p.status)).length,
      MATCHING: hiringProcesses.filter((p) => GROUP_STATUSES.MATCHING.includes(p.status)).length,
      COMPLETED: hiringProcesses.filter((p) => GROUP_STATUSES.COMPLETED.includes(p.status)).length,
      TOTAL: hiringProcesses.length,
    }),
    [hiringProcesses],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return hiringProcesses.filter((p) => {
      if (!GROUP_STATUSES[group].includes(p.status)) return false
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
      if (q && ![p.name, p.job_title, p.area].some((v) => v.toLowerCase().includes(q))) return false
      return true
    })
  }, [hiringProcesses, query, group, statusFilter])

  const toggleGroup = (g: FilterGroup) => {
    setGroup((prev) => (prev === g ? 'TOTAL' : g))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <Header
        title="Procesos de contratación"
        subtitle="Gestiona y da seguimiento a todos tus procesos"
        role={session.role}
      >
        <Button onClick={() => router.push('/hiring-processes/new')}>
          <Plus className="size-4" />
          Nuevo proceso
        </Button>
      </Header>

      <section aria-label="Filtros por grupo de estado" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Activos"
          value={counts.ACTIVE}
          chipBg="bg-primary-light"
          chipFg="text-primary"
          active={group === 'ACTIVE'}
          onClick={() => toggleGroup('ACTIVE')}
        />
        <StatCard
          icon={Zap}
          label="En Matching"
          value={counts.MATCHING}
          chipBg="bg-accent-light"
          chipFg="text-accent"
          active={group === 'MATCHING'}
          onClick={() => toggleGroup('MATCHING')}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completados"
          value={counts.COMPLETED}
          chipBg="bg-mint-light"
          chipFg="text-mint"
          active={group === 'COMPLETED'}
          onClick={() => toggleGroup('COMPLETED')}
        />
        <StatCard
          icon={Layers}
          label="Total"
          value={counts.TOTAL}
          chipBg="bg-blue-light"
          chipFg="text-blue"
          active={group === 'TOTAL'}
          onClick={() => toggleGroup('TOTAL')}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, cargo o área..."
            aria-label="Buscar procesos"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-4 text-xs text-ink placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg"
          />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
          <Filter className="size-3.5 text-text-muted" aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="bg-transparent py-1 text-xs font-medium text-ink focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {archiveError && (
        <div className="flex items-center justify-between gap-3 rounded-[10px] bg-coral-light px-4 py-2.5 text-xs font-medium text-coral" role="alert">
          {archiveError}
          <button type="button" onClick={() => setArchiveError('')} className="cursor-pointer font-semibold underline-offset-2 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-light">
            <Briefcase className="size-6 text-primary" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">No hay procesos que coincidan</p>
            <p className="mt-1 text-xs text-text-muted">
              Ajusta la búsqueda o los filtros, o crea un proceso nuevo.
            </p>
          </div>
          <Link
            href="/hiring-processes/new"
            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Crear nuevo proceso
          </Link>
        </Card>
      ) : (
        <Card className="overflow-visible p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-bg-subtle">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Proceso</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Cargo · Área</th>
                  <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted md:table-cell">Seniority</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Estado</th>
                  <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:table-cell">Fecha</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/hiring-processes/${p.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') router.push(`/hiring-processes/${p.id}`)
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver detalle del proceso ${p.name}`}
                    className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:bg-bg-subtle"
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-ink">{p.name}</td>
                    <td className="px-5 py-3.5 text-xs text-text">
                      {p.job_title} <span className="text-text-muted">· {p.area}</span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-text-muted md:table-cell">{p.seniority}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="hidden px-5 py-3.5 font-mono text-xs text-text-muted sm:table-cell">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-5 py-2">
                      <RowMenu processId={p.id} onArchive={archiveMutation.mutate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
