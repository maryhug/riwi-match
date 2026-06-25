'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Briefcase, Zap, Trophy, LayoutGrid,
  ArrowUpRight, Clock, CheckCircle, AlertCircle, Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { processStatusConfig, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import type { HiringProcess } from '@/lib/types';

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  detail: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  loading: boolean;
}

function StatCard({ label, value, detail, icon: Icon, iconBg, iconColor, accentColor, loading }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-lg p-5 flex flex-col justify-between min-h-[120px]"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-12 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5">{detail}</p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

// ─── Fila reciente ────────────────────────────────────────────────────────────

function RecentRow({ p }: { p: HiringProcess }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{p.job_title}</p>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500">{p.area}</td>
      <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
      <td className="px-4 py-3.5 text-xs text-slate-400">{formatDate(p.created_at)}</td>
      <td className="px-4 py-3.5 text-right">
        <Link href={`/hiring-processes/${p.id}`}>
          <span className="text-xs text-violet-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Ver →
          </span>
        </Link>
      </td>
    </tr>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  });

  const total       = processes.length;
  const activos     = processes.filter((p) => ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'].includes(p.status)).length;
  const enMatch     = processes.filter((p) => p.status === 'MATCHING').length;
  const completados = processes.filter((p) => ['PROFILING_CONFIGURED', 'COMPLETED'].includes(p.status)).length;

  const areaMap: Record<string, number> = {};
  processes.forEach((p) => { areaMap[p.area] = (areaMap[p.area] ?? 0) + 1; });
  const areaData = Object.entries(areaMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  const recientes = [...processes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Vista consolidada de todos los procesos de selección" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Activos" value={activos} detail={`${pct(activos)}% del total`}
          icon={Briefcase} iconBg="#EDE9FE" iconColor="#7C3AED" accentColor="#7C3AED" loading={isLoading} />
        <StatCard label="En matching IA" value={enMatch} detail="Procesando CVs"
          icon={Zap} iconBg="#FEF3C7" iconColor="#D97706" accentColor="#D97706" loading={isLoading} />
        <StatCard label="Completados" value={completados} detail="Match + profiling"
          icon={Trophy} iconBg="#D1FAE5" iconColor="#059669" accentColor="#059669" loading={isLoading} />
        <StatCard label="Total" value={total} detail="Todos los periodos"
          icon={LayoutGrid} iconBg="#DBEAFE" iconColor="#2563EB" accentColor="#2563EB" loading={isLoading} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Barras por área */}
        <div className="lg:col-span-3 bg-white rounded-lg p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Procesos por área</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribución de carga por departamento</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <LayoutGrid className="w-3.5 h-3.5 text-violet-600" />
            </div>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: '#F5F3FF' }}
                />
                <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={32} name="Procesos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por estado */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Por estado</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribución actual</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-7 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(processStatusConfig).map(([status, cfg]) => {
                const count = processes.filter((p) => p.status === status).length;
                const p     = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-600">{cfg.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{count}</span>
                        <span className="text-[10px] text-slate-400 w-7 text-right">{p}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-700 bg-violet-600"
                        style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabla recientes */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Procesos recientes</h3>
              <p className="text-xs text-slate-400">Últimos {recientes.length} registrados</p>
            </div>
          </div>
          <Link href="/hiring-processes"
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 animate-spin rounded-full border-violet-600 border-t-transparent" />
          </div>
        ) : recientes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Sin procesos aún</p>
            <Link href="/hiring-processes/new"
              className="mt-2 inline-block text-sm font-semibold text-violet-600 hover:underline">
              Crear el primero →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proceso</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Área</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 w-16" />
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
        <div className="flex items-start gap-4 p-4 rounded-lg bg-violet-50 border border-violet-100">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">IA procesando ahora</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Tienes <span className="font-bold text-violet-700">{enMatch} proceso{enMatch > 1 ? 's' : ''} en match</span> ejecutándose. Los rankings estarán listos pronto.
            </p>
          </div>
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Empieza creando un proceso</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Ve a{' '}
              <Link href="/hiring-processes/new" className="font-semibold text-blue-600 hover:underline">
                Crear proceso
              </Link>{' '}
              para comenzar a usar RIWI Match.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
