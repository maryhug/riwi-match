'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { Briefcase, Zap, Trophy, LayoutGrid, ArrowUpRight, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { processStatusConfig, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import type { HiringProcess } from '@/lib/types';

const STATS = [
  { key: 'activos',     label: 'Activos',       detail: (n: number, t: number) => `${t > 0 ? Math.round(n/t*100) : 0}% del total`, icon: Briefcase, color: '#7C3AED' },
  { key: 'enMatch',     label: 'En Matching IA', detail: () => 'Procesando CVs',    icon: Zap,      color: '#D97706' },
  { key: 'completados', label: 'Completados',    detail: () => 'Match + profiling', icon: Trophy,   color: '#059669' },
  { key: 'total',       label: 'Total',          detail: () => 'Todos los periodos',icon: LayoutGrid,color: '#2563EB' },
];

function RecentRow({ p }: { p: HiringProcess }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className="px-5 py-3">
        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{p.job_title}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{p.area}</td>
      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(p.created_at)}</td>
      <td className="px-4 py-3 text-right">
        <Link href={`/hiring-processes/${p.id}`}>
          <span className="text-xs text-violet-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Ver →</span>
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

      {/* Stats — banda blanca con divisores verticales, sin cajas individuales */}
      <div className="bg-white border-y border-slate-200 flex mb-5">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          const val  = values[s.key as keyof typeof values];
          return (
            <div key={s.key} className={`flex-1 px-6 py-4 ${i < STATS.length - 1 ? 'border-r border-slate-200' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} strokeWidth={2} />
              </div>
              {isLoading
                ? <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mb-1" />
                : <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{val}</p>
              }
              <p className="text-[11px] text-slate-400 mb-2">{s.detail(val, total)}</p>
              <div className="h-px w-full" style={{ background: s.color, opacity: 0.3 }} />
            </div>
          );
        })}
      </div>

      {/* Charts — dos secciones separadas por línea, sin card boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 bg-white border-y border-slate-200 mb-5">

        {/* Barras por área */}
        <div className="lg:col-span-3 border-r border-slate-200 px-5 py-4">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <p className="text-sm font-semibold text-slate-900">Procesos por área</p>
            <p className="text-xs text-slate-400 mt-0.5">Distribución de carga por departamento</p>
          </div>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-5 h-5 border-2 animate-spin rounded-full border-violet-600 border-t-transparent" />
            </div>
          ) : areaData.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center gap-2">
              <Briefcase className="w-8 h-8 text-slate-200" />
              <p className="text-sm text-slate-400">Sin datos aún</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={areaData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 12, boxShadow: 'none' }} cursor={{ fill: '#F5F3FF' }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[2, 2, 0, 0]} barSize={28} name="Procesos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por estado */}
        <div className="lg:col-span-2 px-5 py-4">
          <div className="border-b border-slate-100 pb-3 mb-1">
            <p className="text-sm font-semibold text-slate-900">Por estado</p>
            <p className="text-xs text-slate-400 mt-0.5">Distribución actual</p>
          </div>
          {isLoading ? (
            <div className="space-y-4 mt-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {Object.entries(processStatusConfig).map(([status, cfg]) => {
                const count = processes.filter((p) => p.status === status).length;
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3 py-2.5">
                    <span className="text-xs text-slate-600 flex-1">{cfg.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-px bg-slate-100 relative overflow-visible">
                        <div className="absolute inset-y-0 left-0 bg-violet-500" style={{ width: `${pct}%`, height: '1px' }} />
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-4 text-right">{count}</span>
                      <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabla recientes — sin caja, solo líneas */}
      <div className="bg-white border-y border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Procesos recientes</p>
              <p className="text-xs text-slate-400">Últimos {recientes.length} registrados</p>
            </div>
          </div>
          <Link href="/hiring-processes" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 animate-spin rounded-full border-violet-600 border-t-transparent" />
          </div>
        ) : recientes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm">Sin procesos aún</p>
            <Link href="/hiring-processes/new" className="mt-2 inline-block text-sm font-semibold text-violet-600 hover:underline">Crear el primero →</Link>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Proceso</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Área</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody>
              {recientes.map((p: HiringProcess) => <RecentRow key={p.id} p={p} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* Banners */}
      {!isLoading && enMatch > 0 && (
        <div className="flex items-start gap-3 mt-4 p-3 rounded border border-violet-200 bg-violet-50">
          <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">IA procesando ahora</p>
            <p className="text-xs text-slate-600 mt-0.5">Tienes <span className="font-bold text-violet-700">{enMatch} proceso{enMatch > 1 ? 's' : ''} en match</span> ejecutándose.</p>
          </div>
        </div>
      )}
      {!isLoading && total === 0 && (
        <div className="flex items-start gap-3 mt-4 p-3 rounded border border-blue-200 bg-blue-50">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Empieza creando un proceso</p>
            <p className="text-xs text-slate-600 mt-0.5">Ve a <Link href="/hiring-processes/new" className="font-semibold text-blue-600 hover:underline">Crear proceso</Link> para comenzar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
