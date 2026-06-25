'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { Sparkles, FileText, Users, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { processStatusConfig } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import type { HiringProcess } from '@/lib/types';

export default function DashboardPage() {
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  });

  // Stats derivadas de datos reales
  const activos     = processes.filter((p) => ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'].includes(p.status)).length;
  const enMatch     = processes.filter((p) => p.status === 'MATCHING').length;
  const completados = processes.filter((p) => ['PROFILING_CONFIGURED', 'COMPLETED'].includes(p.status)).length;

  // Agrupar por área para el gráfico
  const areaMap: Record<string, number> = {};
  processes.forEach((p) => {
    areaMap[p.area] = (areaMap[p.area] ?? 0) + 1;
  });
  const areaData = Object.entries(areaMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const recientes = [...processes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        subtitle="Vista consolidada de todos los procesos de selección"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="PROCESOS ACTIVOS"   value={activos}             icon={FileText}     color={{ bg: '#F5F3FF', text: '#7C3AED' }} loading={isLoading} />
        <StatCard label="EN MATCH"           value={enMatch}             icon={TrendingUp}   color={{ bg: '#FFF7ED', text: '#EA580C' }} loading={isLoading} />
        <StatCard label="COMPLETADOS"        value={completados}         icon={CheckCircle2} color={{ bg: '#F0FDF4', text: '#16A34A' }} loading={isLoading} />
        <StatCard label="TOTAL DE PROCESOS"  value={processes.length}    icon={Users}        color={{ bg: '#F0F9FF', text: '#0284C7' }} loading={isLoading} />
      </div>

      {/* Gráfico + tabla recientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Procesos por área */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6 pb-2">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
              Procesos por área
            </h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
              </div>
            ) : areaData.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-slate-300">
                <FileText className="w-8 h-8 opacity-50" />
                <p className="text-sm">Sin datos aún</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={areaData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={50} name="Procesos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6 pb-2">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
              Estado de procesos
            </h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              Object.entries(processStatusConfig).map(([status, cfg]) => {
                const count = processes.filter((p) => p.status === status).length;
                const pct   = processes.length > 0 ? Math.round((count / processes.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">{cfg.label}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: '#7C3AED' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de procesos recientes */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
            Procesos recientes
          </h3>
          <Link href="/hiring-processes" className="text-xs font-semibold text-primary-dark hover:underline">
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recientes.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay procesos aún</p>
              <Link href="/hiring-processes/new" className="mt-3 inline-block text-sm font-semibold text-primary-dark hover:underline">
                Crear el primero →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">PROCESO</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">ÁREA</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">SENIORITY</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">ESTADO</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recientes.map((p: HiringProcess) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <p className="font-semibold text-slate-900 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.job_title}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{p.area}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {p.seniority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/hiring-processes/${p.id}`}>
                        <span className="text-xs font-medium text-primary-dark opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver →
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Insight */}
      {!isLoading && processes.length > 0 && enMatch > 0 && (
        <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-6 flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-dark" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">Procesos activos</h4>
            <p className="text-xs text-slate-600">
              Tienes <span className="font-bold text-primary-dark">{enMatch} proceso{enMatch > 1 ? 's' : ''} en match</span> ejecutándose ahora mismo. Los resultados estarán disponibles en el ranking de cada proceso.
            </p>
          </div>
        </div>
      )}

      {!isLoading && processes.length === 0 && (
        <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-6 flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">Empieza creando un proceso</h4>
            <p className="text-xs text-slate-600">
              Aún no hay procesos registrados. Ve a{' '}
              <Link href="/hiring-processes/new" className="font-semibold text-blue-600 hover:underline">
                Crear proceso
              </Link>{' '}
              para comenzar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: { bg: string; text: string };
  loading: boolean;
}) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-12 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>{value}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: color.bg }}>
          <Icon className="w-5 h-5" style={{ color: color.text }} />
        </div>
      </CardContent>
    </Card>
  );
}
