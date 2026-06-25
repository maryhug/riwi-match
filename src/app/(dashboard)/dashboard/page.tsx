'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line,
} from 'recharts';
import { Sparkles, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

const cvsData = [
  { name: 'Camila R.', value: 85 },
  { name: 'Julián M.', value: 55 },
  { name: 'Andrés L.', value: 38 },
  { name: 'Laura V.', value: 42 },
];

const trendData = [
  { name: 'S1', value: 62 },
  { name: 'S2', value: 65 },
  { name: 'S3', value: 72 },
  { name: 'S4', value: 75 },
  { name: 'S5', value: 78 },
  { name: 'S6', value: 77 },
];

const TABLE_DATA = [
  { id: 1, process: 'Backend Node Sr', recruiter: 'Camila R.', cand: 24, advance: '38%', cost: '$184.50', flag: false },
  { id: 2, process: 'Data Engineer', recruiter: 'Julián M.', cand: 18, advance: '20%', cost: '$92.30', flag: false },
  { id: 3, process: 'Product Designer Sr', recruiter: 'Andrés L.', cand: 14, advance: '58%', cost: '$145.00', flag: false },
  { id: 4, process: 'QA Automation Jr', recruiter: 'Camila R.', cand: 31, advance: '11%', cost: '$12.40', flag: true },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold" style={{ color: '#1E1B4B' }}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <Header title="Dashboard de equipo" subtitle="Vista consolidada del equipo de Talent Acquisition." />
        <div className="flex gap-3 pt-6">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
            Últimos 30 días <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
            Todo el equipo <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="PROCESOS ACTIVOS" value="12" />
        <StatCard label="CVS CARGADOS" value="221" />
        <StatCard label="MATCH PROMEDIO" value="73%" />
        <StatCard label="PROFILINGS COMPLETADOS" value="67%" />
        <StatCard label="COSTO DEL PERÍODO" value="$1,284" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6 pb-2">
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>CVs cargados por recruiter</h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cvsData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardHeader className="px-8 py-6 pb-2">
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Tendencia de calidad de CVs recibidos</h3>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D946EF" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: 'white', stroke: '#D946EF', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="px-8 py-6 border-b border-slate-100">
          <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Efectividad de avance por proceso</h3>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">PROCESO</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">RECLUTADOR</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px] text-right">CANDIDATOS</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px] text-right">% AVANCE ALTA</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px] text-right">COSTO</th>
                <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px] text-center">FLAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {TABLE_DATA.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 font-semibold text-slate-900 text-xs">{row.process}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{row.recruiter}</td>
                  <td className="px-6 py-4 text-slate-900 text-xs text-right font-medium">{row.cand}</td>
                  <td className="px-6 py-4 text-slate-900 text-xs text-right font-bold">{row.advance}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs text-right">{row.cost}</td>
                  <td className="px-8 py-4 flex justify-center items-center">
                    {row.flag ? <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Insight Alert */}
      <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-6 flex gap-4 items-start">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Insight detectado</h4>
          <p className="text-xs text-slate-600">
            El proceso <span className="font-medium text-slate-900">"QA Automation Jr"</span> tiene <span className="font-bold text-red-500">62% de CVs con error de lectura</span> — revisar la fuente de hunting o el formato exigido.
          </p>
        </div>
      </div>

    </div>
  );
}
