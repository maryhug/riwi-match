'use client';

import Link from 'next/link';
import { Plus, FileText, CheckCircle2, PhoneCall, DollarSign, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { HiringProcess } from '@/lib/types';

function StatCard({ label, value, subtext, icon: Icon, color }: {
  label: string;
  value: number | string;
  subtext: string;
  icon: React.ElementType;
  color: { bg: string; text: string };
}) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{subtext}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: color.bg }}>
          <Icon className="w-5 h-5" style={{ color: color.text }} />
        </div>
      </CardContent>
    </Card>
  );
}

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
      <Header title="Procesos de contratación" subtitle={`Operación viva del equipo · ${processes.length} procesos`}>
        <Link
          href="/hiring-processes/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors"
          style={{ background: '#957DF3' }}
        >
          <Plus className="w-4 h-4" />
          Crear proceso
        </Link>
      </Header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="PROCESOS ACTIVOS"
          value={activos}
          subtext={`de ${processes.length} en total`}
          icon={FileText}
          color={{ bg: '#F5F3FF', text: '#8B5CF6' }}
        />
        <StatCard
          label="EN MATCH"
          value={enMatch}
          subtext="procesando con IA"
          icon={CheckCircle2}
          color={{ bg: '#ECFDF5', text: '#10B981' }}
        />
        <StatCard
          label="COMPLETADOS"
          value={completados}
          subtext="match + profiling"
          icon={PhoneCall}
          color={{ bg: '#F5F3FF', text: '#8B5CF6' }}
        />
        <StatCard
          label="TOTAL"
          value={processes.length}
          subtext="procesos registrados"
          icon={DollarSign}
          color={{ bg: '#FFF7ED', text: '#F97316' }}
        />
      </div>

      {/* Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-100">
          <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Listado de procesos</h3>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
            </div>
          ) : processes.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Sin procesos aún</p>
              <p className="text-sm text-slate-400 mt-1">Crea tu primer proceso para comenzar</p>
              <Link href="/hiring-processes/new" className="mt-4 inline-block">
                <span className="px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-medium">
                  Crear proceso
                </span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">PROCESO</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">CARGO · ÁREA</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">SENIORITY</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">ESTADO</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">FECHA</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {processes.map((proc: HiringProcess) => (
                  <ProcessRow key={proc.id} proc={proc} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessRow({ proc }: { proc: HiringProcess }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-8 py-4">
        <p className="font-semibold text-slate-900">{proc.name}</p>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">#{proc.id.slice(0, 8)}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-slate-700 font-medium">{proc.job_title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{proc.area}</p>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
          {proc.seniority}
        </span>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={proc.status} />
      </td>
      <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(proc.created_at)}</td>
      <td className="px-6 py-4 text-right">
        <Link href={`/hiring-processes/${proc.id}`}>
          <button className="text-slate-400 hover:text-primary-dark text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver →
          </button>
        </Link>
      </td>
    </tr>
  );
}
