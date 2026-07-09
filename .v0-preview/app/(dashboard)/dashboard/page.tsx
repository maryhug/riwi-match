'use client'

import { Briefcase, CheckCircle2, Layers, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatusBadge } from '@/components/riwi/badge'
import { Card, CardContent, CardHeader } from '@/components/riwi/card'
import { Header } from '@/components/riwi/header'
import { StatCard } from '@/components/riwi/stat-card'
import { formatDate } from '@/lib/data'
import { processesApi } from '@/lib/api'
import { useSession } from '../layout'

const AREA_COLORS = ['#7C3AED', '#059669', '#D97706', '#2563EB', '#DB2777']

export default function DashboardPage() {
  const router = useRouter()
  const session = useSession()

  const { data: hiringProcesses = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  })

  const active = hiringProcesses.filter((p) =>
    ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'].includes(p.status),
  ).length
  const matching = hiringProcesses.filter((p) => p.status === 'MATCHING').length
  const completed = hiringProcesses.filter((p) =>
    ['PROFILING_CONFIGURED', 'COMPLETED'].includes(p.status),
  ).length
  const total = hiringProcesses.length

  const byArea = Object.entries(
    hiringProcesses.reduce<Record<string, number>>((acc, p) => {
      acc[p.area] = (acc[p.area] ?? 0) + 1
      return acc
    }, {}),
  ).map(([area, count]) => ({ area, count }))

  const recent = [...hiringProcesses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

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
        title="Dashboard"
        subtitle={`${total} procesos de contratación en total`}
        role={session.role}
      />

      <section aria-label="Indicadores clave" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Activos" value={active} chipBg="bg-primary-light" chipFg="text-primary" />
        <StatCard icon={Zap} label="En Matching" value={matching} chipBg="bg-accent-light" chipFg="text-accent" />
        <StatCard icon={CheckCircle2} label="Completados" value={completed} chipBg="bg-mint-light" chipFg="text-mint" />
        <StatCard icon={Layers} label="Total" value={total} chipBg="bg-blue-light" chipFg="text-blue" />
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-base font-semibold text-ink">Procesos por área</h2>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byArea} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="area"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-bg-subtle)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: 'var(--color-ink)',
                  }}
                  formatter={(value) => [`${value} procesos`, 'Cantidad']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {byArea.map((entry, i) => (
                    <Cell key={entry.area} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-sans text-base font-semibold text-ink">Procesos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-subtle">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Proceso</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Cargo</th>
                <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted md:table-cell">Área</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Estado</th>
                <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
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
                  <td className="px-5 py-3.5 text-xs text-text">{p.job_title}</td>
                  <td className="hidden px-5 py-3.5 text-xs text-text-muted md:table-cell">{p.area}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="hidden px-5 py-3.5 font-mono text-xs text-text-muted sm:table-cell">
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
