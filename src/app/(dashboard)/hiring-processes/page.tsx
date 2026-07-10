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
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
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

// --- Menú de acciones rápidas por fila ---
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
      className="absolute right-0 top-full mt-1 z-20 w-44 rounded-[var(--radius-md)] border border-border bg-surface-raised py-1.5 text-sm shadow-lg shadow-black/5"
    >
      {items.map(({ label, icon: Icon, action }) => (
        <button
          key={label}
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-text hover:bg-bg-subtle hover:text-ink transition-colors rounded-[var(--radius-sm)] mx-1"
          style={{ width: 'calc(100% - 8px)' }}
        >
          <Icon className="w-3.5 h-3.5 shrink-0 text-text-muted" strokeWidth={1.8} />
          {label}
        </button>
      ))}
    </div>
  );
}

// --- Fila de proceso ---
function ProcessRow({ proc }: { proc: HiringProcess }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr
      onClick={() => router.push(`/hiring-processes/${proc.id}`)}
      className="relative border-b border-border hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3.5">
        <p className="font-semibold text-ink text-sm">{proc.name}</p>
        <p className="text-[11px] text-text-muted font-mono mt-0.5">{proc.id.slice(0, 8)}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-text">{proc.job_title}</p>
        <p className="text-xs text-text-muted mt-0.5">{proc.area}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-light text-primary border border-primary-light">
          {proc.seniority}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={proc.status} />
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
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
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:text-primary hover:bg-primary-light transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

// --- Tema visual de cada tarjeta de stat ---
interface StatCardTheme {
  bg: string;
  iconColor: string;
  activeBg: string;
  activeRing: string;
  barColor: string;
}

const STAT_THEMES: Record<StatFilterKey, StatCardTheme> = {
  ACTIVE_GROUP: {
    bg: 'bg-primary-light',
    iconColor: 'text-primary',
    activeBg: 'bg-primary-light/70',
    activeRing: 'focus-visible:ring-primary',
    barColor: 'var(--color-primary)'
  },
  MATCHING: {
    bg: 'bg-accent-light',
    iconColor: 'text-accent-dark',
    activeBg: 'bg-accent-light/70',
    activeRing: 'focus-visible:ring-accent',
    barColor: 'var(--color-accent)'
  },
  COMPLETED_GROUP: {
    bg: 'bg-mint-light',
    iconColor: 'text-mint-dark',
    activeBg: 'bg-mint-light/70',
    activeRing: 'focus-visible:ring-mint',
    barColor: 'var(--color-mint)'
  },
  ALL: {
    bg: 'bg-blue-light',
    iconColor: 'text-blue',
    activeBg: 'bg-blue-light/70',
    activeRing: 'focus-visible:ring-blue',
    barColor: 'var(--color-blue)'
  },
};

// --- Tarjeta de stat / filtro ---
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
        'relative flex-1 px-5 py-5 text-left rounded-[var(--radius-md)] border transition-all duration-200 overflow-hidden',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        theme.activeRing,
        active
          ? `${theme.activeBg} border-transparent shadow-sm`
          : 'bg-surface border-border hover:border-border-strong hover:bg-bg-subtle/30',
      ].join(' ')}
      aria-pressed={active}
    >
      <div className={`absolute top-4 right-4 w-9 h-9 rounded-full ${theme.bg} ${theme.iconColor} flex items-center justify-center`}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>

      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 pr-12">
        {label}
      </p>
      <p className="text-3xl font-bold text-ink leading-none mb-1.5">{value}</p>
      <p className="text-[11px] text-text-muted">{sub}</p>

      <div
        className="absolute bottom-0 left-0 right-0 h-1 transition-opacity duration-200"
        style={{ background: theme.barColor, opacity: active ? 1 : 0 }}
      />
    </button>
  );
}

// --- Página ---
export default function HiringProcessesPage() {
  const router = useRouter();
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
    <div className="bg-bg min-h-screen py-6 px-6 lg:px-8">
      
      {/* Header con botón primario */}
      <Header
        title="Procesos de contratación"
        subtitle={`${processes.length} procesos registrados`}
      >
        <Button onClick={() => router.push('/hiring-processes/new')} className="ml-4 gap-2 px-5 rounded-[var(--radius-md)]">
          <Plus className="w-4 h-4" />
          Nuevo proceso
        </Button>
      </Header>

      {/* Stats / filtros clicables */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
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

      {/* Tarjeta principal con tabla y filtros */}
      <Card>
        <CardContent className="p-0">
          
          {/* Búsqueda y filtro */}
          <div className="p-4 border-b border-border bg-surface-raised flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:max-w-xs">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proceso..."
                leftIcon={<Search size={16} />}
              />
            </div>

            <div className="w-full sm:max-w-xs relative">
              <Select
                options={selectOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <Filter size={16} />
              </div>
            </div>

            <p className="text-xs text-text-muted sm:ml-auto font-medium">
              <span className="text-ink font-semibold">{filtered.length}</span>{' '}
              registro{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto bg-surface">
            {isLoading ? (
              <div className="flex justify-center py-14">
                <div className="w-5 h-5 border-2 animate-spin rounded-full border-primary border-t-transparent" />
              </div>
            ) : processes.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4 border border-primary-light">
                  <Briefcase className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <p className="font-semibold text-ink text-sm">Sin procesos aún</p>
                <p className="text-xs text-text-muted mt-1">Crea tu primer proceso para comenzar</p>
                <div className="mt-5">
                  <Button onClick={() => router.push('/hiring-processes/new')}>
                    Crear proceso
                  </Button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">
                No hay procesos que coincidan.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle/50">
                    {['Proceso', 'Cargo · Área', 'Seniority', 'Estado', 'Fecha', ''].map((th) => (
                      <th
                        key={th}
                        className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest first:px-5"
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
        </CardContent>
      </Card>
    </div>
  );
}
