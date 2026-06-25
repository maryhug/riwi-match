'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

// Mock data for the chart
const mockChartData = [
  { date: '01', cost: 15 },
  { date: '02', cost: 18 },
  { date: '03', cost: 22 },
  { date: '04', cost: 16 },
  { date: '05', cost: 18 },
  { date: '06', cost: 28 },
  { date: '07', cost: 32 },
  { date: '08', cost: 42 },
  { date: '09', cost: 38 },
  { date: '10', cost: 40 },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>{value}</p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F97316' }}>
          <DollarSign className="w-4 h-4 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetricsPage() {
  const [period, setPeriod] = useState<'Diario' | 'Semanal' | 'Mensual'>('Diario');

  return (
    <div className="space-y-6">
      <Header title="Costos y consumo" subtitle="Seguimiento por modelo, proceso y recruiter." />

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="COSTO TOTAL HISTÓRICO" value="$8,421" />
        <StatCard label="COSTO DEL MES" value="$777.20" />
        <StatCard label="COSTO PROM. / CV" value="$0.18" />
        <StatCard label="COSTO PROM. / PROFILING" value="$0.47" />
      </div>

      {/* Chart */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-8 py-6">
          <h3 className="font-semibold" style={{ color: '#1E1B4B' }}>Consumo del período</h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {['Diario', 'Semanal', 'Mensual'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === p ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-0">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mockChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
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
                stroke="#967DF5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#967DF5', strokeWidth: 0 }} 
                activeDot={{ r: 6, fill: '#967DF5', stroke: 'white', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Por modelo */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6">
            <h3 className="font-semibold" style={{ color: '#1E1B4B' }}>Por modelo</h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0 space-y-6">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">gpt-4 - análisis CV</span>
              <div className="flex items-center gap-6">
                <span className="text-slate-400 text-xs">1.2M in / 340K out</span>
                <span className="font-bold text-slate-900 w-12 text-right">$15.40</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">gpt-4 - profiling eval</span>
              <div className="flex items-center gap-6">
                <span className="text-slate-400 text-xs">920K in / 210K out</span>
                <span className="font-bold text-slate-900 w-12 text-right">$11.30</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">Voz - llamadas</span>
              <div className="flex items-center gap-6">
                <span className="text-slate-400 text-xs">47 llamadas - 3.2h</span>
                <span className="font-bold text-slate-900 w-12 text-right">$22.10</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">Embeddings</span>
              <div className="flex items-center gap-6">
                <span className="text-slate-400 text-xs">2.4M tokens</span>
                <span className="font-bold text-slate-900 w-12 text-right">$3.60</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Límites y alertas */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6">
            <h3 className="font-semibold" style={{ color: '#1E1B4B' }}>Límites y alertas</h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0 space-y-5">
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Presupuesto máximo por proceso</span>
              <input type="text" defaultValue="$250" className="w-20 text-right px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Presupuesto mensual</span>
              <input type="text" defaultValue="$1,500" className="w-24 text-right px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Límite de CVs por proceso</span>
              <input type="text" defaultValue="100" className="w-20 text-right px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Límite de llamadas/día</span>
              <input type="text" defaultValue="60" className="w-20 text-right px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none" />
            </div>

            <div className="pt-2 space-y-3">
              {/* Progress bars */}
              <div className="bg-yellow-50 rounded-lg px-4 py-2 relative overflow-hidden flex justify-between items-center">
                <div className="absolute top-0 left-0 h-full bg-yellow-100/50" style={{ width: '80%' }}></div>
                <span className="text-xs font-semibold text-yellow-800 relative z-10 flex items-center gap-2"><span className="text-yellow-500">⚠️</span> Backend Sr - 80%</span>
                <span className="text-xs font-bold text-yellow-700 relative z-10">80%</span>
              </div>
              
              <div className="bg-orange-50 rounded-lg px-4 py-2 relative overflow-hidden flex justify-between items-center">
                <div className="absolute top-0 left-0 h-full bg-orange-100/50" style={{ width: '92%' }}></div>
                <span className="text-xs font-semibold text-orange-800 relative z-10 flex items-center gap-2"><span className="text-orange-500">⚠️</span> Data Engineer - 92%</span>
                <span className="text-xs font-bold text-orange-700 relative z-10">92%</span>
              </div>
              
              <div className="bg-red-50 rounded-lg px-4 py-2 relative overflow-hidden flex justify-between items-center">
                <div className="absolute top-0 left-0 h-full bg-red-100/50" style={{ width: '100%' }}></div>
                <span className="text-xs font-semibold text-red-800 relative z-10 flex items-center gap-2"><span className="text-red-500">⚠️</span> Account Manager - 100%</span>
                <span className="text-xs font-bold text-red-700 relative z-10">100%</span>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
