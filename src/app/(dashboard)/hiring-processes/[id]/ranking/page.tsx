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
  HIGH:   { label: 'Alto',  color: '#059669', bg: '#ECFDF5' },
  MEDIUM: { label: 'Medio', color: '#D97706', bg: '#FFFBEB' },
  LOW:    { label: 'Bajo',  color: '#DC2626', bg: '#FEF2F2' },
} as const;

const PROFILING_MAP: Record<string, { label: string; variant: 'active' | 'done' | 'idle' | 'queued' | 'failed' }> = {
  SELECTED_FOR_PROFILING: { label: 'En cola',    variant: 'queued' },
  PROFILING_QUEUED:       { label: 'En cola',    variant: 'queued' },
  PROFILING_CALLING:      { label: 'En llamada', variant: 'active' },
  PROFILING_COMPLETED:    { label: 'Completado', variant: 'done' },
  PROFILING_FAILED:       { label: 'No contestada', variant: 'failed' },
  DISCARDED:              { label: 'Descartado', variant: 'failed' },
};

const AVATAR_COLORS = [
  '#7C3AED','#059669','#2563EB','#D97706','#DC2626','#8B5CF6','#0891B2','#EC4899',
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
  const initials = name.split(' ').slice(0, 2).map((p) => (p[0] ?? '').toUpperCase()).join('');
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>
      {initials}
    </div>
  );
}

function MatchRing({ pct, category }: { pct: number; category: string | null }) {
  const cfg = CATEGORY_CFG[category as keyof typeof CATEGORY_CFG] ?? CATEGORY_CFG.LOW;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="shrink-0">
      <circle cx="23" cy="23" r={r} fill="none" stroke="#F1F5F9" strokeWidth="4.5" />
      <circle cx="23" cy="23" r={r} fill="none" stroke={cfg.color} strokeWidth="4.5"
        strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`} strokeLinecap="round"
        transform="rotate(-90 23 23)" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill={cfg.color} fontFamily="inherit">
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function SkillChips({ skills }: { skills: string[] }) {
  if (!skills.length) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 3).map((s, i) => (
        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
          {s.length > 18 ? s.slice(0, 18) + '…' : s}
        </span>
      ))}
    </div>
  );
}

function ProfilingStatusCell({ status }: { status: string }) {
  const cfg = PROFILING_MAP[status];
  if (!cfg) return <span className="text-xs text-slate-400">Sin iniciar</span>;
  const colorMap = {
    active: 'text-violet-600', done: 'text-emerald-600', queued: 'text-amber-600',
    failed: 'text-slate-400', idle: 'text-slate-400',
  };
  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${colorMap[cfg.variant]}`}>
      {cfg.variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />}
      {cfg.label}
    </span>
  );
}

function AdvanceChip({ status, category }: { status: string; category: string | null }) {
  if (status !== 'PROFILING_COMPLETED' || !category) return <span className="text-slate-300 text-xs">—</span>;
  const cfg = CATEGORY_CFG[category as keyof typeof CATEGORY_CFG];
  if (!cfg) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function applyFilters(candidates: CandidateListItem[], filter: FilterKey, search: string): CandidateListItem[] {
  let out = candidates;
  if (search.trim()) {
    const q = search.toLowerCase();
    out = out.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
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
      <Header title="Ranking de candidatos" subtitle="Resultados del match de IA ordenados por puntuación">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Link href={`/hiring-processes/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Proceso
            </Button>
          </Link>
        </div>
      </Header>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar candidato..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(activeFilter === key ? 'ALL' : key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                activeFilter === key
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className={`ml-auto flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity ${
            selected.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          } bg-violet-600`}
          disabled={selected.size === 0 || profilingMutation.isPending}
          onClick={() => profilingMutation.mutate()}
        >
          <Phone className="w-3.5 h-3.5" />
          Activar profiling
          <span className="w-4.5 h-4.5 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold px-1">
            {selected.size}
          </span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded bg-slate-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">Sin candidatos aún</p>
            <p className="text-xs text-slate-400 mt-1">Sube CVs y ejecuta el match para ver el ranking</p>
          </div>
          <Link href={`/hiring-processes/${id}`}>
            <Button size="sm" variant="outline">Ir al proceso</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pl-4 pr-3 py-3 w-9">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600 cursor-pointer"
                  />
                </th>
                {['Candidato', 'Match', 'Categoría', 'Top Skills', 'Profiling', 'Avance', ''].map((th) => (
                  <th key={th} className="px-3 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => {
                const isMatched = c.match_percentage > 0;
                const criticalGap = c.gaps?.find(
                  (g) => g.toLowerCase().includes('requerido') || g.toLowerCase().includes('excluyente') || g.toLowerCase().includes('no cumplido'),
                );

                return (
                  <tr key={c.process_candidate_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="pl-4 pr-3 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(c.process_candidate_id)}
                        onChange={() => toggleSelect(c.process_candidate_id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600 cursor-pointer"
                      />
                    </td>

                    <td className="px-3 py-3.5 min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        <CandidateAvatar name={c.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{c.email}</p>
                          {criticalGap && (
                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium max-w-[220px]">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{criticalGap}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      {isMatched ? <MatchRing pct={c.match_percentage} category={c.match_category} /> : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    <td className="px-3 py-3.5">
                      <CategoryChip category={isMatched ? c.match_category : null} />
                    </td>

                    <td className="px-3 py-3.5 min-w-[140px]">
                      <SkillChips skills={c.strengths ?? []} />
                    </td>

                    <td className="px-3 py-3.5">
                      <ProfilingStatusCell status={c.status} />
                    </td>

                    <td className="px-3 py-3.5">
                      <AdvanceChip status={c.status} category={c.match_category} />
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/hiring-processes/${id}/ranking/${c.process_candidate_id}`}>
                          <button className="p-1.5 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">
              No hay candidatos que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
