'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { DollarSign, TrendingUp, BarChart2, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
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

  const empty = !isLoading && dailyCosts.length === 0 && byProcess.length === 0;

  const KPI_CARDS = [
    { label: 'Costo total',          value: `$${totalCost.toFixed(2)}`,                               icon: DollarSign, accentColor: '#EA580C', iconBg: '#FFF7ED' },
    { label: 'Operaciones log.',      value: byOperation.reduce((a, o) => a + o.count, 0).toString(),  icon: Layers,      accentColor: '#7C3AED', iconBg: '#F5F3FF' },
    { label: 'Procesos con costo',    value: byProcess.length.toString(),                              icon: BarChart2,   accentColor: '#059669', iconBg: '#ECFDF5' },
    { label: 'Costo prom./proceso',   value: byProcess.length > 0 ? `$${(totalCost / byProcess.length).toFixed(2)}` : '$0.00', icon: TrendingUp, accentColor: '#0284C7', iconBg: '#F0F9FF' },
  ];

  return (
    <div className="space-y-5">
      <Header title="Costos y consumo" subtitle="Seguimiento por operación y proceso" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, accentColor, iconBg }) => (
          <div key={label} className="bg-white rounded-lg p-5 flex items-center justify-between"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', borderLeft: `4px solid ${accentColor}` }}>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
              {isLoading
                ? <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
                : <p className="text-xl font-bold text-slate-900">{value}</p>
              }
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
              <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-900">Consumo diario (USD)</h3>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : dailyCosts.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-300">
              <BarChart2 className="w-9 h-9 opacity-40" />
              <p className="text-xs">Sin datos de consumo aún</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyCosts} margin={{ top: 16, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dx={-10} />
                <Tooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                <Line type="monotone" dataKey="cost" stroke="#7C3AED" strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#7C3AED', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#7C3AED', stroke: 'white', strokeWidth: 2 }} name="USD" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By operation + by process */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-900">Por tipo de operación</h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-7 bg-slate-100 rounded animate-pulse" />)}</div>
            ) : byOperation.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-300">
                <Layers className="w-7 h-7 opacity-40" />
                <p className="text-xs">Sin operaciones registradas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byOperation} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis type="category" dataKey="operation_type" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} width={55} />
                  <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.06)' }}
                    formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Costo']} />
                  <Bar dataKey="total_cost" fill="#7C3AED" radius={[0, 4, 4, 0]} name="USD" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-900">Top procesos por costo</h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
            ) : byProcess.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-300">
                <BarChart2 className="w-7 h-7 opacity-40" />
                <p className="text-xs">Sin datos por proceso</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {byProcess.slice(0, 5).map((p) => (
                  <div key={p.process_id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 truncate max-w-[70%]">{p.process_name}</span>
                      <span className="font-bold text-slate-900">${p.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="h-full rounded-full bg-violet-600"
                        style={{ width: `${Math.min(100, (p.total_cost / (byProcess[0]?.total_cost || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {empty && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-center">
          <p className="text-xs text-slate-500">
            El módulo de métricas se activará cuando el backend registre operaciones de IA.
          </p>
        </div>
      )}
    </div>
  );
}
