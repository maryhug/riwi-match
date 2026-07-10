'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { Briefcase, Zap, Trophy, LayoutGrid, ArrowUpRight, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { processStatusConfig, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import type { HiringProcess } from '@/lib/types';

const STATS = [
  { key: 'activos',     label: 'Activos',       detail: (n: number, t: number) => `${t > 0 ? Math.round(n/t*100) : 0}% del total`, icon: Briefcase, color: 'var(--color-primary)', bgClass: 'bg-primary-light text-primary' },
  { key: 'enMatch',     label: 'En Matching IA', detail: () => 'Procesando CVs',    icon: Zap,      color: 'var(--color-accent)', bgClass: 'bg-accent-light text-accent-dark' },
  { key: 'completados', label: 'Completados',    detail: () => 'Match + profiling', icon: Trophy,   color: 'var(--color-mint)', bgClass: 'bg-mint-light text-mint-dark' },
  { key: 'total',       label: 'Total',          detail: () => 'Todos los periodos',icon: LayoutGrid,color: 'var(--color-blue)', bgClass: 'bg-blue-light text-blue' },
];

function RecentRow({ p }: { p: HiringProcess }) {
  return (
    <tr className="border-b border-border hover:bg-bg-subtle/50 transition-colors group">
      <td className="px-5 py-3">
        <p className="text-sm font-semibold text-ink">{p.name}</p>
        <p className="text-xs text-text-muted mt-0.5">{p.job_title}</p>
      </td>
      <td className="px-4 py-3 text-xs text-text">{p.area}</td>
      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
      <td className="px-4 py-3 text-xs text-text-muted">{formatDate(p.created_at)}</td>
      <td className="px-4 py-3 text-right">
        <Link href={`/hiring-processes/${p.id}`}>
          <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Ver →</span>
        </Link>
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  });

  const total       = processes.length;
  const activos     = processes.filter((p) => ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'].includes(p.status)).length;
  const enMatch     = processes.filter((p) => p.status === 'MATCHING').length;
  const completados = processes.filter((p) => ['PROFILING_CONFIGURED', 'COMPLETED'].includes(p.status)).length;
  const values      = { activos, enMatch, completados, total };

  const areaMap: Record<string, number> = {};
  processes.forEach((p) => { areaMap[p.area] = (areaMap[p.area] ?? 0) + 1; });
  const areaData = Object.entries(areaMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const recientes = [...processes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div>
      <Header title="Dashboard" subtitle="Vista consolidada de todos los procesos de selección" />

      {/* Stats - Grid de tarjetas individuales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => {
          const Icon = s.icon;
          const val  = values[s.key as keyof typeof values];
          return (
            <Card key={s.key}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{s.label}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.bgClass}`}>
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                </div>
                <div className="mt-auto">
                  {isLoading
                    ? <div className="h-8 w-12 bg-bg-subtle rounded animate-pulse mb-1" />
                    : <p className="text-2xl font-bold text-ink leading-none mb-1">{val}</p>
                  }
                  <p className="text-xs text-text-muted">{s.detail(val, total)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts - Grid de tarjetas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Barras por área */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="border-b border-border pb-3 mb-4">
              <p className="text-sm font-semibold text-ink">Procesos por área</p>
              <p className="text-xs text-text-muted mt-0.5">Distribución de carga por departamento</p>
            </div>
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="w-5 h-5 border-2 animate-spin rounded-full border-primary border-t-transparent" />
              </div>
            ) : areaData.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2">
                <Briefcase className="w-8 h-8 text-border-strong" />
                <p className="text-sm text-text-muted">Sin datos aún</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={areaData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    cursor={{ fill: 'var(--color-bg-subtle)', opacity: 0.5 }} 
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={28} name="Procesos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por estado */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="border-b border-border pb-3 mb-1">
              <p className="text-sm font-semibold text-ink">Por estado</p>
              <p className="text-xs text-text-muted mt-0.5">Distribución actual</p>
            </div>
            {isLoading ? (
              <div className="space-y-4 mt-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-bg-subtle rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {Object.entries(processStatusConfig).map(([status, cfg]) => {
                  const count = processes.filter((p) => p.status === status).length;
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3 py-3">
                      <span className="text-xs font-medium text-text flex-1">{cfg.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-ink w-4 text-right">{count}</span>
                        <span className="text-[10px] text-text-muted w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla recientes */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-sm font-semibold text-ink">Procesos recientes</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">Últimos {recientes.length} registrados</p>
            </div>
          </div>
          <Link href="/hiring-processes" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors bg-primary-xlight px-2.5 py-1.5 rounded-full">
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 animate-spin rounded-full border-primary border-t-transparent" />
          </div>
        ) : recientes.length === 0 ? (
          <div className="py-12 text-center bg-surface">
            <p className="text-text-muted text-sm mb-2">Sin procesos aún</p>
            <Link href="/hiring-processes/new" className="inline-block text-sm font-semibold text-primary hover:underline">Crear el primero →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-bg-subtle/50">
                  <th className="px-5 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Proceso</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Área</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="bg-surface">
                {recientes.map((p: HiringProcess) => <RecentRow key={p.id} p={p} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Banners */}
      {!isLoading && enMatch > 0 && (
        <div className="flex items-start gap-3 mt-6 p-4 rounded-[var(--radius-md)] border border-primary-light bg-primary-xlight">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">IA procesando ahora</p>
            <p className="text-xs text-text mt-0.5">Tienes <span className="font-bold text-primary-dark">{enMatch} proceso{enMatch > 1 ? 's' : ''} en match</span> ejecutándose.</p>
          </div>
        </div>
      )}
      {!isLoading && total === 0 && (
        <div className="flex items-start gap-3 mt-6 p-4 rounded-[var(--radius-md)] border border-blue-light bg-blue-light/50">
          <AlertCircle className="w-4 h-4 text-blue shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Empieza creando un proceso</p>
            <p className="text-xs text-text mt-0.5">Ve a <Link href="/hiring-processes/new" className="font-semibold text-blue-dark hover:underline">Crear proceso</Link> para comenzar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
