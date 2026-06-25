'use client';

import Link from 'next/link';
import { Plus, FileText, CheckCircle2, PhoneCall, DollarSign, Filter, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

const MOCK_PROCESSES = [
  { id: 1, name: 'Desarrollador Backend Node Sr', role: 'Backend - Sr', area: 'Tecnología', recruiter: 'Camila Restrepo', status: 'Profiling en ejecución', statusColor: 'bg-purple-100 text-purple-700', cand: 24, match: '72%', cost: '$184.50', date: '2024-06-02' },
  { id: 2, name: 'Data Engineer Medellín', role: 'Data Engineer - Sr', area: 'Datos', recruiter: 'Julián Marín', status: 'Match procesado', statusColor: 'bg-indigo-100 text-indigo-700', cand: 18, match: '68%', cost: '$92.30', date: '2024-05-08' },
  { id: 3, name: 'QA Automation Jr', role: 'QA Automation - Jr', area: 'Tecnología', recruiter: 'Camila Restrepo', status: 'CVs cargados', statusColor: 'bg-violet-100 text-violet-700', cand: 31, match: '—', cost: '$12.40', date: '2024-05-15' },
  { id: 4, name: 'Product Designer Sr', role: 'Product Designer - Sr', area: 'Diseño', recruiter: 'Andrés López', status: 'Profiling completado', statusColor: 'bg-emerald-100 text-emerald-700', cand: 14, match: '81%', cost: '$145.00', date: '2024-05-13' },
  { id: 5, name: 'DevOps Engineer', role: 'DevOps - Ssr', area: 'Tecnología', recruiter: 'Julián Marín', status: 'Profiling configurado', statusColor: 'bg-violet-100 text-violet-700', cand: 9, match: '74%', cost: '$56.20', date: '2024-06-01' },
  { id: 6, name: 'Account Manager Bogotá', role: 'Account Manager - Sr', area: 'Comercial', recruiter: 'Laura Vélez', status: 'Cerrado', statusColor: 'bg-slate-100 text-slate-600', cand: 22, match: '70%', cost: '$198.70', date: '2024-04-30' },
  { id: 7, name: 'Frontend React Mid', role: 'Frontend - Ssr', area: 'Tecnología', recruiter: 'Camila Restrepo', status: 'Borrador', statusColor: 'bg-slate-100 text-slate-600', cand: 0, match: '—', cost: '$0.00', date: '2024-06-09' },
  { id: 8, name: 'People Partner LATAM', role: 'People Partner - Sr', area: 'Personas', recruiter: 'Andrés López', status: 'Archivado', statusColor: 'bg-slate-100 text-slate-600', cand: 11, match: '65%', cost: '$18.10', date: '2024-03-20' },
];

function StatCard({ label, value, subtext, icon: Icon, color }: any) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>{value}</p>
          </div>
          <p className="text-xs mt-1" style={{ color: subtext.includes('+') ? '#059669' : '#94A3B8' }}>{subtext}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: color.bg }}>
          <Icon className="w-5 h-5" style={{ color: color.text }} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function HiringProcessesPage() {
  return (
    <div className="space-y-6">
      <Header title="Procesos de contratación" subtitle="Operación viva del equipo · 8 procesos registrados">
        <Link
          href="/hiring-processes/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors"
          style={{ background: '#957DF3' }}
        >
          <Plus className="w-4 h-4" />
          Crear proceso
        </Link>
      </Header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="PROCESOS ACTIVOS" 
          value="6" 
          subtext="+3 el mes pasado" 
          icon={FileText} 
          color={{ bg: '#F5F3FF', text: '#8B5CF6' }} 
        />
        <StatCard 
          label="CVS PROCESADOS (MES)" 
          value="221" 
          subtext="↑ +18%" 
          icon={CheckCircle2} 
          color={{ bg: '#ECFDF5', text: '#10B981' }} 
        />
        <StatCard 
          label="PROFILINGS COMPLETADOS" 
          value="47" 
          subtext="↑ +17%" 
          icon={PhoneCall} 
          color={{ bg: '#F5F3FF', text: '#8B5CF6' }} 
        />
        <StatCard 
          label="COSTO DEL MES" 
          value="$777.20" 
          subtext="dentro de presupuesto" 
          icon={DollarSign} 
          color={{ bg: '#FFF7ED', text: '#F97316' }} 
        />
      </div>

      {/* Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-100">
          <h3 className="font-semibold" style={{ color: '#1E1B4B' }}>Listado de procesos</h3>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <Filter className="w-3.5 h-3.5" /> Estado
            </button>
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <Filter className="w-3.5 h-3.5" /> Reclutador
            </button>
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <Filter className="w-3.5 h-3.5" /> Área
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">PROCESO</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">ÁREA</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">RECLUTADOR</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs text-center">CAND.</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs text-center">MATCH PROM.</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs text-right">COSTO</th>
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">FECHA</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {MOCK_PROCESSES.map((proc) => (
                <tr key={proc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <p className="font-semibold text-slate-900">{proc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{proc.role}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{proc.area}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                        {proc.recruiter.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-slate-700 text-xs font-medium">{proc.recruiter}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${proc.statusColor}`}>
                      {proc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">{proc.cand}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">{proc.match}</td>
                  <td className="px-6 py-4 text-right text-slate-600 text-xs font-medium">{proc.cost}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{proc.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
