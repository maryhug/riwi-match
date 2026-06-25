'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { DollarSign, TrendingUp, BarChart2, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { metricsApi } from '@/lib/api';

export default function MetricsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['metrics-dashboard'],
    queryFn: () => metricsApi.getDashboard().then((r) => r.data),
  });

  const totalCost   = data?.total_cost_usd ?? 0;
  const dailyCosts  = data?.daily_costs ?? [];
  const byOperation = data?.cost_by_operation ?? [];
  const byProcess   = data?.cost_by_process ?? [];

  const KPI = [
    { label: 'Costo total',        value: `$${totalCost.toFixed(2)}`,                                                              icon: DollarSign, color: '#EA580C' },
    { label: 'Operaciones log.',   value: byOperation.reduce((a: number, o: {count: number}) => a + o.count, 0).toString(),         icon: Layers,     color: '#7C3AED' },
    { label: 'Procesos con costo', value: byProcess.length.toString(),                                                              icon: BarChart2,  color: '#059669' },
    { label: 'Costo prom./proceso',value: byProcess.length > 0 ? `$${(totalCost / byProcess.length).toFixed(2)}` : '$0.00',        icon: TrendingUp, color: '#0284C7' },
  ];

  const empty = !isLoading && dailyCosts.length === 0 && byProcess.length === 0;

  return (
    <div>
      <Header title="Costos y consumo" subtitle="Seguimiento por operación y proceso" />

      {/* KPI — banda blanca con divisores verticales */}
      <div className="bg-white border-y border-slate-200 flex mb-5">
        {KPI.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`flex-1 px-6 py-4 ${i < KPI.length - 1 ? 'border-r border-slate-200' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{k.label}</p>
                <Icon className="w-3.5 h-3.5" style={{ color: k.color }} strokeWidth={2} />
              </div>
              {isLoading
                ? <div className="h-6 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                : <p className="text-xl font-bold text-slate-900 mb-1">{k.value}</p>
              }
              <div className="h-px w-full" style={{ background: k.color, opacity: 0.3 }} />
            </div>
          );
        })}
      </div>

      {/* Consumo diario — sección sin caja */}
      <div className="bg-white border-y border-slate-200 mb-5">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Consumo diario (USD)</p>
        </div>
        <div className="px-5 py-4">
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : dailyCosts.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-300">
              <BarChart2 className="w-9 h-9 opacity-40" />
              <p className="text-xs text-slate-400">Sin datos de consumo aún</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyCosts} margin={{ top: 16, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dx={-10} />
                <Tooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                  contentStyle={{ borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: 'none' }} />
                <Line type="monotone" dataKey="cost" stroke="#7C3AED" strokeWidth={2}
                  dot={{ r: 3, fill: '#7C3AED', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#7C3AED', stroke: 'white', strokeWidth: 2 }} name="USD" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Por operación + top procesos — dos columnas sin cajas */}
      <div className="bg-white border-y border-slate-200 grid grid-cols-1 md:grid-cols-2">
        {/* Por operación */}
        <div className="border-r border-slate-200 px-5 py-4">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <p className="text-sm font-semibold text-slate-900">Por tipo de operación</p>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-7 bg-slate-100 rounded animate-pulse" />)}</div>
          ) : byOperation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-300">
              <Layers className="w-7 h-7 opacity-40" />
              <p className="text-xs text-slate-400">Sin operaciones registradas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byOperation} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis type="category" dataKey="operation_type" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} width={55} />
                <Tooltip contentStyle={{ borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: 'none' }}
                  formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Costo']} />
                <Bar dataKey="total_cost" fill="#7C3AED" radius={[0, 2, 2, 0]} name="USD" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top procesos */}
        <div className="px-5 py-4">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <p className="text-sm font-semibold text-slate-900">Top procesos por costo</p>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
          ) : byProcess.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-300">
              <BarChart2 className="w-7 h-7 opacity-40" />
              <p className="text-xs text-slate-400">Sin datos por proceso</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {byProcess.slice(0, 5).map((p: { process_id: string; process_name: string; total_cost: number }) => (
                <div key={p.process_id} className="py-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-700 truncate max-w-[70%]">{p.process_name}</span>
                    <span className="font-bold text-slate-900">${p.total_cost.toFixed(2)}</span>
                  </div>
                  <div className="h-px w-full bg-slate-100 overflow-visible relative">
                    <div className="absolute inset-y-0 left-0 bg-violet-500" style={{ height: '1px', width: `${Math.min(100, (p.total_cost / (byProcess[0]?.total_cost || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {empty && (
        <p className="mt-4 text-xs text-slate-400 text-center">
          El módulo de métricas se activará cuando el backend registre operaciones de IA.
        </p>
      )}
    </div>
  );
}
