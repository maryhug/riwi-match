'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Plus, FileText, Briefcase, Zap, Trophy,
  MoreHorizontal, Calendar, ArrowRight, Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/Badge';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { HiringProcess } from '@/lib/types';

function StatCard({
  label, value, sub, icon: Icon, accentColor,
}: {
  label: string; value: number; sub: string;
  icon: React.ElementType; accentColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <Icon className="w-4 h-4" style={{ color: accentColor }} strokeWidth={2} />
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <div>
        <p className="text-[11px] text-slate-400 mb-1.5">{sub}</p>
        <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '100%', background: accentColor, opacity: 0.35 }} />
        </div>
      </div>
    </div>
  );
}

function ProcessRow({ proc }: { proc: HiringProcess }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-3">
        <p className="font-semibold text-slate-900 text-sm leading-tight">{proc.name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{proc.id.slice(0, 8)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-700">{proc.job_title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{proc.area}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
          {proc.seniority}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={proc.status} />
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(proc.created_at)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/hiring-processes/${proc.id}`}>
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors">
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
          <button className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function HiringProcessesPage() {
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const activos     = processes.filter((p) => ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'].includes(p.status)).length;
  const enMatch     = processes.filter((p) => p.status === 'MATCHING').length;
  const completados = processes.filter((p) => ['PROFILING_CONFIGURED', 'COMPLETED'].includes(p.status)).length;

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.job_title.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <Header
        title="Procesos de contratación"
        subtitle={`${processes.length} procesos registrados`}
      >
        <Link
          href="/hiring-processes/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded bg-violet-600 hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo proceso
        </Link>
      </Header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Activos"     value={activos}           sub={`de ${processes.length} total`} icon={Briefcase} accentColor="#7C3AED" />
        <StatCard label="En matching" value={enMatch}           sub="Procesando con IA"              icon={Zap}       accentColor="#D97706" />
        <StatCard label="Completados" value={completados}       sub="Match + profiling"              icon={Trophy}    accentColor="#059669" />
        <StatCard label="Total"       value={processes.length}  sub="Todos los procesos"             icon={FileText}  accentColor="#2563EB" />
      </div>

      {/* Filters + table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proceso..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded border border-slate-200 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors placeholder:text-slate-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-3 py-1.5 bg-white text-slate-700 outline-none focus:border-violet-400 transition-colors"
          >
            <option value="ALL">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="READY_FOR_MATCH">Listo para match</option>
            <option value="CVS_UPLOADED">CVs subidos</option>
            <option value="MATCHING">En matching</option>
            <option value="PROFILING_CONFIGURED">Profiling configurado</option>
            <option value="COMPLETED">Completado</option>
          </select>
          <p className="text-xs text-slate-400 ml-auto">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-14">
            <div className="w-5 h-5 border-2 animate-spin rounded-full border-violet-600 border-t-transparent" />
          </div>
        ) : processes.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 text-sm">Sin procesos aún</p>
            <p className="text-xs text-slate-400 mt-1">Crea tu primer proceso para comenzar</p>
            <Link href="/hiring-processes/new" className="mt-4 inline-block">
              <span className="px-4 py-2 text-white rounded text-xs font-semibold bg-violet-600 hover:bg-violet-700 transition-colors">
                Crear proceso
              </span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No hay procesos que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Proceso', 'Cargo · Área', 'Seniority', 'Estado', 'Fecha', ''].map((th) => (
                  <th key={th} className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((proc: HiringProcess) => (
                <ProcessRow key={proc.id} proc={proc} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
