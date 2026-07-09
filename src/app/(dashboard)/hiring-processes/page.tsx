'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Plus, FileText, Briefcase, Zap, Trophy,
  MoreHorizontal, Calendar, Search, Filter,
  ExternalLink, Copy, Archive,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/Badge';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { HiringProcess } from '@/lib/types';

type StatFilterKey = 'ALL' | 'ACTIVE_GROUP' | 'MATCHING' | 'COMPLETED_GROUP';

const STAT_STATUS_MAP: Record<StatFilterKey, string[]> = {
  ALL:             [],
  ACTIVE_GROUP:    ['DRAFT', 'READY_FOR_MATCH', 'CVS_UPLOADED'],
  MATCHING:        ['MATCHING'],
  COMPLETED_GROUP: ['PROFILING_CONFIGURED', 'COMPLETED'],
};

// ─── Menú de acciones rápidas por fila ─────────────────────────────────────────

function ActionMenu({ procId, onClose }: { procId: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items = [
    { label: 'Ver detalle', icon: ExternalLink, action: () => console.log('ver', procId) },
    { label: 'Duplicar',    icon: Copy,         action: () => console.log('duplicar', procId) },
    { label: 'Archivar',    icon: Archive,      action: () => console.log('archivar', procId) },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-slate-100 bg-white py-1.5 text-sm shadow-lg shadow-slate-200/60"
    >
      {items.map(({ label, icon: Icon, action }) => (
        <button
          key={label}
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors rounded-lg mx-auto"
          style={{ width: 'calc(100% - 8px)', marginLeft: 4 }}
        >
          <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.8} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Fila de proceso ────────────────────────────────────────────────────────────

function ProcessRow({ proc }: { proc: HiringProcess }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr
      onClick={() => router.push(`/hiring-processes/${proc.id}`)}
      className="relative border-b border-slate-100 hover:bg-violet-50/40 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3.5">
        <p className="font-semibold text-slate-900 text-sm">{proc.name}</p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{proc.id.slice(0, 8)}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-slate-700">{proc.job_title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{proc.area}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100">
          {proc.seniority}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={proc.status} />
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(proc.created_at)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="relative inline-block">
          <button
            aria-label="Acciones"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <ActionMenu procId={proc.id} onClose={() => setMenuOpen(false)} />
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Tema visual de cada tarjeta de stat ───────────────────────────────────────

interface StatCardTheme {
  gradient: string;
  ring: string;
  activeBg: string;
  activeRing: string;
}

const STAT_THEMES: Record<StatFilterKey, StatCardTheme> = {
  ACTIVE_GROUP: {
    gradient:   'from-violet-500 to-violet-700',
    ring:       '#7C3AED',
    activeBg:   'bg-violet-50/70',
    activeRing: 'focus-visible:ring-violet-300',
  },
  MATCHING: {
    gradient:   'from-amber-400 to-orange-500',
    ring:       '#D97706',
    activeBg:   'bg-amber-50/70',
    activeRing: 'focus-visible:ring-amber-300',
  },
  COMPLETED_GROUP: {
    gradient:   'from-emerald-400 to-teal-600',
    ring:       '#059669',
    activeBg:   'bg-emerald-50/70',
    activeRing: 'focus-visible:ring-emerald-300',
  },
  ALL: {
    gradient:   'from-blue-400 to-indigo-600',
    ring:       '#2563EB',
    activeBg:   'bg-blue-50/70',
    activeRing: 'focus-visible:ring-blue-300',
  },
};

// ─── Tarjeta de stat / filtro ───────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  filterKey: StatFilterKey;
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, value, sub, icon: Icon, filterKey, active, onClick }: StatCardProps) {
  const theme = STAT_THEMES[filterKey];

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex-1 px-5 py-5 text-left rounded-xl border transition-all duration-200',
        'focus:outline-none focus-visible:ring-2',
        theme.activeRing,
        active
          ? `${theme.activeBg} border-transparent shadow-md`
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200',
      ].join(' ')}
      aria-pressed={active}
    >
      <div className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-md`}>
        <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pr-12">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-900 leading-none mb-1.5">{value}</p>
      <p className="text-[11px] text-slate-400">{sub}</p>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl transition-opacity duration-200"
        style={{ background: theme.ring, opacity: active ? 1 : 0 }}
      />
    </button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HiringProcessesPage() {
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['hiring-processes'],
    queryFn: () => processesApi.list().then((r) => r.data),
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const activos     = processes.filter((p) => STAT_STATUS_MAP.ACTIVE_GROUP.includes(p.status)).length;
  const enMatch     = processes.filter((p) => p.status === 'MATCHING').length;
  const completados = processes.filter((p) => STAT_STATUS_MAP.COMPLETED_GROUP.includes(p.status)).length;

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.job_title.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === 'ALL') {
      matchStatus = true;
    } else if (statusFilter in STAT_STATUS_MAP) {
      matchStatus = STAT_STATUS_MAP[statusFilter as StatFilterKey].includes(p.status);
    } else {
      matchStatus = p.status === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  const stats: Array<{
    label: string; value: number; sub: string;
    icon: React.ElementType; filterKey: StatFilterKey;
  }> = [
    { label: 'Activos',     value: activos,          sub: `de ${processes.length} total`, icon: Briefcase, filterKey: 'ACTIVE_GROUP'    },
    { label: 'En Matching', value: enMatch,           sub: 'Procesando con IA',           icon: Zap,       filterKey: 'MATCHING'        },
    { label: 'Completados', value: completados,       sub: 'Match + profiling',           icon: Trophy,    filterKey: 'COMPLETED_GROUP' },
    { label: 'Total',       value: processes.length, sub: 'Todos los procesos',          icon: FileText,  filterKey: 'ALL'             },
  ];

  const selectOptions: Array<{ value: string; label: string }> = [
    { value: 'ALL',                  label: 'Todos los estados'      },
    { value: 'ACTIVE_GROUP',         label: 'Activos (grupo)'        },
    { value: 'DRAFT',                label: 'Borrador'               },
    { value: 'READY_FOR_MATCH',      label: 'Listo para match'       },
    { value: 'CVS_UPLOADED',         label: 'CVs subidos'            },
    { value: 'MATCHING',             label: 'En matching'            },
    { value: 'COMPLETED_GROUP',      label: 'Completados (grupo)'    },
    { value: 'PROFILING_CONFIGURED', label: 'Profiling configurado'  },
    { value: 'COMPLETED',            label: 'Completado'             },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60">

      {/* Hero con degradado pastel */}
      <div className="relative px-6 pt-6 pb-2">
        <div
          className="absolute inset-x-0 top-0 h-72 pointer-events-none -z-10"
          style={{
            background:
              'linear-gradient(135deg, rgba(237,233,254,0.55) 0%, rgba(243,232,255,0.40) 35%, rgba(255,237,213,0.30) 70%, transparent 100%)',
          }}
        />

        <div
          className="rounded-2xl px-7 py-6"
          style={{
            background:
              'linear-gradient(120deg, rgba(237,233,254,0.80) 0%, rgba(245,208,254,0.65) 45%, rgba(254,215,170,0.50) 100%)',
            boxShadow: '0 2px 24px 0 rgba(139,92,246,0.08)',
          }}
        >
          <Header
            title="Procesos de contratación"
            subtitle={`${processes.length} procesos registrados`}
          >
            <Link
              href="/hiring-processes/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shrink-0 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #a21caf 60%, #db2777 100%)',
                boxShadow: '0 4px 20px 0 rgba(124,58,237,0.30)',
              }}
            >
              <Plus className="w-4 h-4" />
              Nuevo proceso
            </Link>
          </Header>
        </div>
      </div>

      {/* Stats / filtros clicables */}
      <div className="px-6 py-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            sub={s.sub}
            icon={s.icon}
            filterKey={s.filterKey}
            active={statusFilter === s.filterKey}
            onClick={() =>
              setStatusFilter((prev) => (prev === s.filterKey ? 'ALL' : s.filterKey))
            }
          />
        ))}
      </div>

      {/* Búsqueda y filtro */}
      <div className="mx-6 mb-4">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 max-w-xs">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              strokeWidth={1.8}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proceso..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors placeholder:text-slate-400"
            />
          </div>

          <div className="relative inline-flex items-center gap-1.5">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-full text-slate-600 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors appearance-none cursor-pointer hover:border-violet-300 hover:bg-violet-50/50"
            >
              {selectOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400 ml-auto font-medium">
            <span className="text-slate-600 font-semibold">{filtered.length}</span>{' '}
            registro{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-14">
            <div className="w-5 h-5 border-2 animate-spin rounded-full border-violet-500 border-t-transparent" />
          </div>
        ) : processes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
              <Briefcase className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Sin procesos aún</p>
            <p className="text-xs text-slate-400 mt-1">Crea tu primer proceso para comenzar</p>
            <Link href="/hiring-processes/new" className="mt-5 inline-block">
              <span
                className="px-5 py-2.5 text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #a21caf 60%, #db2777 100%)',
                  boxShadow: '0 4px 16px 0 rgba(124,58,237,0.28)',
                }}
              >
                Crear proceso
              </span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No hay procesos que coincidan.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Proceso', 'Cargo · Área', 'Seniority', 'Estado', 'Fecha', ''].map((th) => (
                  <th
                    key={th}
                    className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest first:px-5"
                  >
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
