'use client';

import Link from 'next/link';
import { Plus, FileText, CheckCircle2, PhoneCall, LayoutGrid, MoreHorizontal, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/Badge';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { HiringProcess } from '@/lib/types';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, subtext, icon: Icon, accent }: {
  label: string;
  value: number | string;
  subtext: string;
  icon: React.ElementType;
  accent: { bg: string; text: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent.bg }}>
        <Icon className="w-5 h-5" style={{ color: accent.text }} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

// ─── Seniority chip ───────────────────────────────────────────────────────────

function SeniorityChip({ s }: { s: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
      {s}
    </span>
  );
}

// ─── Process row ──────────────────────────────────────────────────────────────

function ProcessRow({ proc }: { proc: HiringProcess }) {
  return (
    <tr className="hover:bg-slate-50/70 transition-colors group">
      <td className="px-6 py-4">
        <p className="font-semibold text-slate-900 leading-tight">{proc.name}</p>
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
            <button className="px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              Ver proceso
            </button>
          </Link>
          <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
          style={{ background: 'var(--color-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo proceso
        </Link>
      </Header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Activos"
          value={activos}
          subtext={`de ${processes.length} total`}
          icon={LayoutGrid}
          accent={{ bg: '#EDE9FE', text: '#7C3AED' }}
        />
        <StatCard
          label="En match"
          value={enMatch}
          subtext="procesando con IA"
          icon={CheckCircle2}
          accent={{ bg: '#D1FAE5', text: '#059669' }}
        />
        <StatCard
          label="Completados"
          value={completados}
          subtext="match + profiling"
          icon={PhoneCall}
          accent={{ bg: '#DBEAFE', text: '#2563EB' }}
        />
        <StatCard
          label="Total"
          value={processes.length}
          subtext="todos los procesos"
          icon={FileText}
          accent={{ bg: '#FEF3C7', text: '#D97706' }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Listado de procesos</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {processes.length} registros
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : processes.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Sin procesos aún</p>
            <p className="text-sm text-slate-400 mt-1">Crea tu primer proceso para comenzar</p>
            <Link href="/hiring-processes/new" className="mt-4 inline-block">
              <span className="px-4 py-2 text-white rounded-lg text-sm font-semibold"
                style={{ background: 'var(--color-primary)' }}>
                Crear proceso
              </span>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proceso</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cargo · Área</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Seniority</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-3 w-32" />
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
