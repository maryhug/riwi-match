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

  const totalCost    = data?.total_cost_usd ?? 0;
  const dailyCosts   = data?.daily_costs ?? [];
  const byOperation  = data?.cost_by_operation ?? [];
  const byProcess    = data?.cost_by_process ?? [];

  const empty = !isLoading && dailyCosts.length === 0 && byProcess.length === 0;

  return (
    <div className="space-y-6">
      <Header title="Costos y consumo" subtitle="Seguimiento por operación y proceso" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'COSTO TOTAL',          value: `$${totalCost.toFixed(2)}`,                               icon: DollarSign, bg: '#FFF7ED', color: '#EA580C' },
          { label: 'OPERACIONES LOG.',      value: byOperation.reduce((a, o) => a + o.count, 0).toString(),  icon: Layers,      bg: '#F5F3FF', color: '#7C3AED' },
          { label: 'PROCESOS CON COSTO',    value: byProcess.length.toString(),                              icon: BarChart2,   bg: '#F0FDF4', color: '#16A34A' },
          { label: 'COSTO PROM./PROCESO',   value: byProcess.length > 0 ? `$${(totalCost / byProcess.length).toFixed(2)}` : '$0.00', icon: TrendingUp, bg: '#F0F9FF', color: '#0284C7' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                {isLoading
                  ? <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
                  : <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{value}</p>
                }
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico diario */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-8 py-6">
          <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Consumo diario (USD)</h3>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-0">
          {isLoading ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
            </div>
          ) : dailyCosts.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-slate-300">
              <BarChart2 className="w-10 h-10 opacity-40" />
              <p className="text-sm">Sin datos de consumo aún</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyCosts} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} />
                <Tooltip
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'white', strokeWidth: 2 }}
                  name="USD"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Por operación + por proceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6">
            <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Por tipo de operación</h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : byOperation.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-300">
                <Layers className="w-8 h-8 opacity-40" />
                <p className="text-sm">Sin operaciones registradas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byOperation} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="operation_type" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={55} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Costo']}
                  />
                  <Bar dataKey="total_cost" fill="#7C3AED" radius={[0, 4, 4, 0]} name="USD" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6">
            <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Top procesos por costo</h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : byProcess.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-300">
                <BarChart2 className="w-8 h-8 opacity-40" />
                <p className="text-sm">Sin datos por proceso</p>
              </div>
            ) : (
              <div className="space-y-4">
                {byProcess.slice(0, 5).map((p) => (
                  <div key={p.process_id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 truncate max-w-[70%]">{p.process_name}</span>
                      <span className="font-bold text-slate-900">${p.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (p.total_cost / (byProcess[0]?.total_cost || 1)) * 100)}%`,
                          background: '#7C3AED',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {empty && (
        <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-500">
            El módulo de métricas se activará cuando el backend registre operaciones de IA.
          </p>
        </div>
      )}
    </div>
  );
}
