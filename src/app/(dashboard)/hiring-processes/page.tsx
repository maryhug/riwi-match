'use client';

import Link from 'next/link';
import {
  Plus, FileText, Briefcase, Zap, Trophy,
  MoreHorizontal, Calendar, ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/Badge';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { HiringProcess } from '@/lib/types';

// ─── Stat card estilo imagen 2 ────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, barColor,
}: {
  label: string; value: number; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string; barColor: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 flex flex-col justify-between min-h-[120px]"
      style={{ border: '1.5px solid #E2E8F0' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 leading-none">{value}</p>
          <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
      </div>
      <div className="h-0.5 rounded-full mt-4" style={{ background: barColor, opacity: 0.4 }} />
    </div>
  );
}

// ─── Chip seniority ───────────────────────────────────────────────────────────

function SeniorityChip({ s }: { s: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">{s}</span>
  );
}

// ─── Fila proceso ─────────────────────────────────────────────────────────────

function ProcessRow({ proc }: { proc: HiringProcess }) {
  return (
    <tr className="hover:bg-slate-50/60 transition-colors group">
      <td className="px-6 py-4">
        <p className="font-semibold text-slate-900 text-sm leading-tight">{proc.name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{proc.id.slice(0, 8)}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-700">{proc.job_title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{proc.area}</p>
      </td>
      <td className="px-5 py-4">
        <SeniorityChip s={proc.seniority} />
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={proc.status} />
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(proc.created_at)}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/hiring-processes/${proc.id}`}>
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: '#7C3AED' }}>
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HiringProcessesPage() {
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  });

  const activos     = processes.filter((p) => ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'].includes(p.status)).length;
  const enMatch     = processes.filter((p) => p.status === 'MATCHING').length;
  const completados = processes.filter((p) => ['PROFILING_CONFIGURED', 'COMPLETED'].includes(p.status)).length;

  return (
    <div className="space-y-6">
      <Header
        title="Procesos de contratación"
        subtitle={`${processes.length} procesos registrados`}
      >
        <Link
          href="/hiring-processes/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ background: '#7C3AED' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo proceso
        </Link>
      </Header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Activos" value={activos} sub={`de ${processes.length} total`}
          icon={Briefcase} iconBg="#EDE9FE" iconColor="#7C3AED" barColor="#7C3AED" />
        <StatCard label="En matching" value={enMatch} sub="Procesando con IA"
          icon={Zap} iconBg="#FEF3C7" iconColor="#D97706" barColor="#F59E0B" />
        <StatCard label="Completados" value={completados} sub="Match + profiling"
          icon={Trophy} iconBg="#D1FAE5" iconColor="#059669" barColor="#10B981" />
        <StatCard label="Total" value={processes.length} sub="Todos los procesos"
          icon={FileText} iconBg="#DBEAFE" iconColor="#2563EB" barColor="#3B82F6" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E2E8F0' }}>
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900">Listado de procesos</h3>
            <p className="text-xs text-slate-400 mt-0.5">{processes.length} registros en total</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 animate-spin rounded-full"
              style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
          </div>
        ) : processes.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-violet-400" />
            </div>
            <p className="font-semibold text-slate-700">Sin procesos aún</p>
            <p className="text-sm text-slate-400 mt-1">Crea tu primer proceso para comenzar</p>
            <Link href="/hiring-processes/new" className="mt-4 inline-block">
              <span className="px-4 py-2 text-white rounded-lg text-sm font-semibold" style={{ background: '#7C3AED' }}>
                Crear proceso
              </span>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100">
                {['Proceso', 'Cargo · Área', 'Seniority', 'Estado', 'Fecha', ''].map((th) => (
                  <th key={th} className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider first:px-6">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.map((proc: HiringProcess) => (
                <ProcessRow key={proc.id} proc={proc} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
