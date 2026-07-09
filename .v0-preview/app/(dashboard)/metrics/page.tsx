'use client'

import { DollarSign } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/riwi/card'
import { Header } from '@/components/riwi/header'
import { formatUsd } from '@/lib/data'
import { metricsApi } from '@/lib/api'

const OPERATION_COLORS = [
  'var(--color-primary)',
  'var(--color-blue)',
  'var(--color-mint)',
  'var(--color-accent)',
  'var(--color-coral)',
]

const OPERATION_LABELS: Record<string, string> = {
  CV_PARSING: 'Parseo de CVs',
  MATCHING: 'Match con IA',
  PROFILING_CALL: 'Llamadas de profiling',
  TRANSCRIPTION: 'Transcripción',
  JD_ANALYSIS: 'Análisis de JD',
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[10px] border border-border bg-surface px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-text-muted">{label}</p>
      <p className="font-mono text-sm font-bold text-ink">{formatUsd(payload[0].value)}</p>
    </div>
  )
}

export default function MetricsPage() {
  const { data: m, isLoading } = useQuery({
    queryKey: ['metrics-dashboard'],
    queryFn: () => metricsApi.getDashboard().then((r) => r.data),
  })

  if (isLoading || !m) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  const topProcesses = [...m.cost_by_process].sort((a, b) => b.total_cost - a.total_cost).slice(0, 8)
  const dailyData = m.daily_costs.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
  }))
  const operationData = m.cost_by_operation.map((o) => ({
    ...o,
    label: OPERATION_LABELS[o.operation_type] ?? o.operation_type,
  }))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <Header title="Costos" subtitle="Consumo de IA del sistema (OpenAI + ElevenLabs)" />

      <div className="grid gap-6">
        {/* KPI + línea diaria */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary-light">
                <DollarSign className="size-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Costo total
                </p>
                <p className="font-mono text-3xl font-bold text-ink">{formatUsd(m.total_cost_usd)}</p>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-sm font-bold text-ink">Costo diario</h2>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--color-primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Barras por operación + top procesos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-ink">Costo por operación</h2>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={operationData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-bg-subtle)' }} />
                  <Bar dataKey="total_cost" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {operationData.map((entry, i) => (
                      <Cell key={entry.operation_type} fill={OPERATION_COLORS[i % OPERATION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-ink">Top procesos por costo</h2>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col">
                {topProcesses.map((p, i) => (
                  <li
                    key={p.process_id}
                    className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
                  >
                    <span className="w-6 font-mono text-xs font-bold text-primary">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{p.process_name}</p>
                      <p className="text-[11px] text-text-muted">{p.candidate_count} candidatos</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-ink">{formatUsd(p.total_cost)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
