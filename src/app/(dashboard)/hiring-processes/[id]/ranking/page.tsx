'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Search, AlertTriangle, Eye,
  ChevronDown, Users, Phone,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import type { CandidateListItem } from '@/lib/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CFG = {
  HIGH:   { label: 'Alto',  color: '#065F46', bg: '#D1FAE5', ring: '#10B981' },
  MEDIUM: { label: 'Medio', color: '#92400E', bg: '#FEF3C7', ring: '#F59E0B' },
  LOW:    { label: 'Bajo',  color: '#991B1B', bg: '#FEE2E2', ring: '#EF4444' },
} as const;

const PROFILING_MAP: Record<string, { label: string; variant: 'active' | 'done' | 'idle' | 'queued' | 'failed' }> = {
  SELECTED_FOR_PROFILING: { label: 'En cola',       variant: 'queued' },
  PROFILING_QUEUED:       { label: 'En cola',       variant: 'queued' },
  PROFILING_CALLING:      { label: 'En llamada',    variant: 'active' },
  PROFILING_COMPLETED:    { label: 'Completado',    variant: 'done' },
  PROFILING_FAILED:       { label: 'No contestada', variant: 'failed' },
  DISCARDED:              { label: 'Descartado',    variant: 'failed' },
};

const AVATAR_COLORS = [
  '#957DF3','#10B981','#3B82F6','#F97316','#EF4444','#8B5CF6','#06B6D4','#EC4899',
];

type FilterKey = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CALLING' | 'COMPLETED';

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'HIGH',      label: 'Match alto'  },
  { key: 'MEDIUM',    label: 'Match medio' },
  { key: 'CALLING',   label: 'En llamada'  },
  { key: 'COMPLETED', label: 'Completado'  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CandidateAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => (p[0] ?? '').toUpperCase())
    .join('');
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 select-none"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function MatchRing({ pct, category }: { pct: number; category: string | null }) {
  const cfg = CATEGORY_CFG[category as keyof typeof CATEGORY_CFG] ?? CATEGORY_CFG.LOW;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#F1F5F9" strokeWidth="5" />
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke={cfg.ring}
        strokeWidth="5"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="26" y="30"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={cfg.color}
        fontFamily="inherit"
      >
        {pct}%
      </text>
    </svg>
  );
}

function CategoryChip({ category }: { category: string | null }) {
  if (!category) return <span className="text-slate-300">—</span>;
  const cfg = CATEGORY_CFG[category as keyof typeof CATEGORY_CFG];
  if (!cfg) return null;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function SkillChips({ skills }: { skills: string[] }) {
  if (!skills.length) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 3).map((s, i) => {
        const short = s.length > 18 ? s.slice(0, 18) + '…' : s;
        return (
          <span
            key={i}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap"
          >
            {short}
          </span>
        );
      })}
    </div>
  );
}

function ProfilingStatusCell({ status }: { status: string }) {
  const cfg = PROFILING_MAP[status];
  if (!cfg) return <span className="text-xs text-slate-400">Sin iniciar</span>;

  const colorMap = {
    active:  'text-violet-600',
    done:    'text-emerald-600',
    queued:  'text-amber-600',
    failed:  'text-slate-400',
    idle:    'text-slate-400',
  };

  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${colorMap[cfg.variant]}`}>
      {cfg.variant === 'active' && (
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
      )}
      {cfg.label}
    </span>
  );
}

function AdvanceChip({ status, category }: { status: string; category: string | null }) {
  if (status !== 'PROFILING_COMPLETED' || !category) {
    return <span className="text-slate-300 text-sm">—</span>;
  }
  const map = {
    HIGH:   { label: 'Alta',  bg: '#F0FDF4', color: '#166534' },
    MEDIUM: { label: 'Media', bg: '#FEFCE8', color: '#854D0E' },
    LOW:    { label: 'Baja',  bg: '#FFF1F2', color: '#9F1239' },
  };
  const cfg = map[category as keyof typeof map];
  if (!cfg) return <span className="text-slate-300 text-sm">—</span>;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Filter logic ──────────────────────────────────────────────────────────────

function applyFilters(
  candidates: CandidateListItem[],
  filter: FilterKey,
  search: string,
): CandidateListItem[] {
  let out = candidates;
  if (search.trim()) {
    const q = search.toLowerCase();
    out = out.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }
  if (filter === 'HIGH')      out = out.filter((c) => c.match_category === 'HIGH');
  if (filter === 'MEDIUM')    out = out.filter((c) => c.match_category === 'MEDIUM');
  if (filter === 'LOW')       out = out.filter((c) => c.match_category === 'LOW');
  if (filter === 'CALLING')   out = out.filter((c) => c.status === 'PROFILING_CALLING');
  if (filter === 'COMPLETED') out = out.filter((c) => c.status === 'PROFILING_COMPLETED');
  return out;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const [search, setSearch]           = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [selected, setSelected]       = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => processesApi.getCandidatesList(id).then((r) => r.data),
    refetchInterval: (q) => {
      const d = q.state.data as import('@/lib/types').CandidateListResponse | undefined;
      const anyPending = d?.candidates?.some(
        (c) => !['MATCHED', 'CV_ERROR', 'DISCARDED', 'PROFILING_COMPLETED', 'PROFILING_FAILED'].includes(c.status),
      );
      return anyPending ? 5000 : false;
    },
  });

  const profilingMutation = useMutation({
    mutationFn: () => processesApi.startProfiling(id, Array.from(selected)),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['candidates', id] });
    },
  });

  const allCandidates = data?.candidates ?? [];
  const filtered      = applyFilters(allCandidates, activeFilter, search);

  const toggleSelect = (pcId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pcId)) next.delete(pcId); else next.add(pcId);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.process_candidate_id)));
  };

  return (
    <div>
      <Header
        title="Ranking de candidatos"
        subtitle="Resultados del match de IA ordenados por puntuación"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href={`/hiring-processes/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Proceso
            </Button>
          </Link>
        </div>
      </Header>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar candidato..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(activeFilter === key ? 'ALL' : key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeFilter === key
                  ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-primary-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Activar profiling */}
        <button
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity ${
            selected.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{ background: '#957DF3' }}
          disabled={selected.size === 0 || profilingMutation.isPending}
          onClick={() => profilingMutation.mutate()}
        >
          <Phone className="w-4 h-4" />
          <span className="flex items-center gap-1.5">
            Activar profiling
            <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[11px] font-bold">
              {selected.size}
            </span>
          </span>
        </button>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Sin candidatos aún</p>
            <p className="text-sm text-slate-400 mt-1">Sube CVs y ejecuta el match para ver el ranking</p>
          </div>
          <Link href={`/hiring-processes/${id}`}>
            <Button size="sm" variant="outline">Ir al proceso</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pl-5 pr-3 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 accent-primary-dark cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Candidato
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Match
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Top Skills
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Profiling
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Avance
                </th>
                <th className="px-4 py-3.5 w-20" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => {
                const isMatched = c.match_percentage > 0;
                const criticalGap = c.gaps?.find(
                  (g) =>
                    g.toLowerCase().includes('requerido') ||
                    g.toLowerCase().includes('excluyente') ||
                    g.toLowerCase().includes('no cumplido'),
                );

                return (
                  <tr
                    key={c.process_candidate_id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="pl-5 pr-3 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(c.process_candidate_id)}
                        onChange={() => toggleSelect(c.process_candidate_id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary-dark cursor-pointer"
                      />
                    </td>

                    {/* Candidato */}
                    <td className="px-4 py-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <CandidateAvatar name={c.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 leading-tight truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{c.email}</p>
                          {criticalGap && (
                            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-medium max-w-[260px]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">{criticalGap}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Match ring */}
                    <td className="px-4 py-4">
                      {isMatched ? (
                        <MatchRing pct={c.match_percentage} category={c.match_category} />
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-4">
                      <CategoryChip category={isMatched ? c.match_category : null} />
                    </td>

                    {/* Top Skills */}
                    <td className="px-4 py-4 min-w-[160px]">
                      <SkillChips skills={c.strengths ?? []} />
                    </td>

                    {/* Profiling */}
                    <td className="px-4 py-4">
                      <ProfilingStatusCell status={c.status} />
                    </td>

                    {/* Avance */}
                    <td className="px-4 py-4">
                      <AdvanceChip status={c.status} category={c.match_category} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/hiring-processes/${id}/ranking/${c.process_candidate_id}`}>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-primary-dark hover:bg-primary-xlight transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No hay candidatos que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
