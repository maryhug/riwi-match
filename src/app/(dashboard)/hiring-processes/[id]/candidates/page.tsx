'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, Phone, RefreshCw, ChevronDown, ChevronUp,
  CheckSquare, Square, Loader2, Users, FileText, Mic, Minus,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import { formatPercent } from '@/lib/utils';
import type { MatchCategory } from '@/lib/types';
import type { DualMatchCandidate, DualKanbanResponse } from '@/lib/types';

// ─── View mode ───────────────────────────────────────────────────────────────
type ViewMode = 'both' | 'cv' | 'profiling';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<MatchCategory, { bg: string; color: string; label: string; headerBg: string; headerBorder: string }> = {
  HIGH:   { bg: '#ECFDF5', color: '#059669', label: 'Alto',  headerBg: '#F0FDF4', headerBorder: '#BBF7D0' },
  MEDIUM: { bg: '#FFFBEB', color: '#D97706', label: 'Medio', headerBg: '#FEFCE8', headerBorder: '#FDE68A' },
  LOW:    { bg: '#FEF2F2', color: '#DC2626', label: 'Bajo',  headerBg: '#FFF1F2', headerBorder: '#FECDD3' },
};

function CategoryPill({ category }: { category: MatchCategory }) {
  const s = CATEGORY_STYLES[category];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function DeltaBadge({ cvPct, profilingPct }: { cvPct: number; profilingPct: number | null }) {
  if (profilingPct === null) return null;
  const delta = profilingPct - cvPct;
  if (Math.abs(delta) < 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        <Minus className="w-3 h-3" /> Sin cambio
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        <TrendingUp className="w-3 h-3" /> +{delta.toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
      <TrendingDown className="w-3 h-3" /> {delta.toFixed(0)}%
    </span>
  );
}

function MatchBar({ label, pct, color, bg }: { label: string; pct: number; color: string; bg: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-900">{formatPercent(pct)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bg }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────
function CandidateCard({ pc, selected, onToggle, viewMode }: {
  pc: DualMatchCandidate; selected: boolean; onToggle: () => void; viewMode: ViewMode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasProfileMatch = pc.match_percentage !== pc.cv_match_percentage;
  const profilingPct = hasProfileMatch ? pc.match_percentage : null;
  const showCV        = viewMode === 'both' || viewMode === 'cv';
  const showProfiling = viewMode === 'both' || viewMode === 'profiling';

  return (
    <div
      className="rounded-lg border transition-all duration-150"
      style={{
        background: 'white',
        borderColor: selected ? '#7C3AED' : '#E2E8F0',
        boxShadow: selected ? '0 0 0 2px rgba(124,58,237,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-2 mb-3">
          <button onClick={onToggle} className="shrink-0 mt-0.5 transition-transform active:scale-90">
            {selected
              ? <CheckSquare className="w-4.5 h-4.5 text-violet-600" />
              : <Square className="w-4.5 h-4.5 text-slate-300" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate text-slate-900">
              {pc.candidate.name} {pc.candidate.last_name}
            </p>
            <p className="text-xs mt-0.5 truncate text-slate-400">{pc.candidate.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <CategoryPill category={pc.match_category ?? 'LOW'} />
            {hasProfileMatch && profilingPct !== null && (
              <DeltaBadge cvPct={pc.cv_match_percentage} profilingPct={profilingPct} />
            )}
          </div>
        </div>

        <div className="space-y-2.5 mb-3">
          {showCV && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3 h-3 text-violet-600" strokeWidth={2} />
                <span className="text-xs font-semibold text-violet-600">Match CV</span>
              </div>
              <MatchBar label="" pct={pc.cv_match_percentage} color="#7C3AED" bg="#EDE9FE" />
            </div>
          )}
          {showProfiling && hasProfileMatch && profilingPct !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                <span className="text-xs font-semibold text-emerald-600">Match Profiling</span>
              </div>
              <MatchBar label="" pct={profilingPct} color="#059669" bg="#D1FAE5" />
            </div>
          )}
          {showProfiling && !hasProfileMatch && (
            <div className="flex items-center gap-2 text-xs rounded-md px-3 py-2 bg-slate-50 text-slate-400 border border-dashed border-slate-200">
              <Mic className="w-3.5 h-3.5" strokeWidth={1.8} />
              Profiling pendiente
            </div>
          )}
        </div>

        {((pc.cv_match_explanation?.strengths?.length ?? 0) > 0 || (pc.match_explanation?.strengths?.length ?? 0) > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
          >
            Justificación IA
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-3.5 py-3 space-y-3 text-xs bg-slate-50 rounded-b-lg">
          {showCV && pc.cv_match_explanation && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-violet-600" />
                <span className="font-semibold text-violet-600">Análisis del CV</span>
              </div>
              <p className="mb-2 text-slate-500">{pc.cv_match_explanation.summary}</p>
              {pc.cv_match_explanation.strengths?.length > 0 && (
                <div className="mb-2">
                  <p className="font-semibold mb-1 text-emerald-700">Fortalezas</p>
                  <ul className="space-y-0.5">
                    {pc.cv_match_explanation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700"><span className="text-emerald-600">+</span> {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pc.cv_match_explanation.gaps?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1 text-red-700">Brechas</p>
                  <ul className="space-y-0.5">
                    {pc.cv_match_explanation.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700"><span className="text-red-600">-</span> {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ category, candidates, selectedIds, onToggle, viewMode }: {
  category: MatchCategory; candidates: DualMatchCandidate[]; selectedIds: Set<string>; onToggle: (id: string) => void; viewMode: ViewMode;
}) {
  const s = CATEGORY_STYLES[category];
  const labels: Record<MatchCategory, string> = {
    HIGH: 'Alto potencial', MEDIUM: 'Potencial medio', LOW: 'Bajo potencial',
  };

  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-sm">
      <div
        className="px-4 py-3 rounded-t-lg border-t border-x flex items-center justify-between"
        style={{ background: s.headerBg, borderColor: s.headerBorder, color: s.color }}
      >
        <div className="flex items-center gap-2">
          <CategoryPill category={category} />
          <span className="text-sm font-semibold">{labels[category]}</span>
        </div>
        <span className="text-sm font-bold">{candidates.length}</span>
      </div>

      <div
        className="flex-1 rounded-b-lg border border-t-0 p-3 space-y-3 min-h-[420px]"
        style={{ background: `${s.bg}99`, borderColor: s.headerBorder }}
      >
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-300">
            <Users className="w-7 h-7 opacity-50" />
            <p className="text-sm">Sin candidatos</p>
          </div>
        ) : (
          candidates.map((pc) => (
            <CandidateCard
              key={pc.id}
              pc={pc}
              selected={selectedIds.has(pc.candidate_id)}
              onToggle={() => onToggle(pc.candidate_id)}
              viewMode={viewMode}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CandidatesKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('both');

  const { data: kanban, isLoading, refetch } = useQuery({
    queryKey: ['kanban', id],
    queryFn: () => processesApi.getKanban(id).then((r) => r.data as unknown as DualKanbanResponse),
    refetchInterval: 20_000,
  });

  const profilingMutation = useMutation({
    mutationFn: () => processesApi.startProfiling(id, Array.from(selectedIds)),
    onSuccess: () => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['kanban', id] });
    },
  });

  const toggleSelect = (candidateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  const totalCandidates  = kanban ? (kanban.HIGH?.length ?? 0) + (kanban.MEDIUM?.length ?? 0) + (kanban.LOW?.length ?? 0) : 0;
  const pendingCandidates = kanban ? (kanban.LOADED?.length ?? 0) + (kanban.PARSING?.length ?? 0) : 0;

  const VIEW_OPTIONS: { mode: ViewMode; label: string }[] = [
    { mode: 'both',      label: 'CV + Profiling' },
    { mode: 'cv',        label: 'Solo CV' },
    { mode: 'profiling', label: 'Solo Profiling' },
  ];

  return (
    <div>
      <Header title="Match & Ranking" subtitle="Candidatos evaluados por IA — visualización dual">
        <Link href={`/hiring-processes/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Proceso
          </Button>
        </Link>
      </Header>

      {/* Control bar */}
      <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg bg-white border border-slate-200">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-900">{totalCandidates}</strong> candidatos evaluados
            {pendingCandidates > 0 && (
              <span className="ml-2 text-amber-600">
                <Loader2 className="inline w-3.5 h-3.5 animate-spin mr-1" />
                {pendingCandidates} procesando
              </span>
            )}
          </p>
          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-violet-50 text-violet-700">
              {selectedIds.size} seleccionado(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md overflow-hidden border border-slate-200">
            {VIEW_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: viewMode === mode ? '#7C3AED' : 'transparent',
                  color:      viewMode === mode ? 'white' : '#94A3B8',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {selectedIds.size > 0 && (
            <Button size="sm" onClick={() => profilingMutation.mutate()} loading={profilingMutation.isPending}>
              <Phone className="w-3.5 h-3.5" />
              Iniciar profiling ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent border-violet-600 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(['HIGH', 'MEDIUM', 'LOW'] as MatchCategory[]).map((cat) => (
            <KanbanColumn
              key={cat}
              category={cat}
              candidates={(kanban?.[cat] ?? []) as DualMatchCandidate[]}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
