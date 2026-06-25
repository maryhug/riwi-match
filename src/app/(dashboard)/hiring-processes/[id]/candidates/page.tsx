'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, Phone, RefreshCw, ChevronDown, ChevronUp,
  CheckSquare, Square, Loader2, Users, TrendingUp, TrendingDown,
  Minus, FileText, Mic,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import { formatPercent } from '@/lib/utils';
import type { MatchCategory } from '@/lib/types';
import type { DualMatchCandidate, DualKanbanResponse } from '@/lib/mockData';

// ─── View mode ───────────────────────────────────────────────────────────────
type ViewMode = 'both' | 'cv' | 'profiling';

// ─── Match bar ────────────────────────────────────────────────────────────────
function MatchBar({
  label,
  pct,
  color,
  bg,
}: {
  label: string;
  pct: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{formatPercent(pct)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bg }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Delta indicator ──────────────────────────────────────────────────────────
function DeltaBadge({ cvPct, profilingPct }: { cvPct: number; profilingPct: number | null }) {
  if (profilingPct === null) return null;
  const delta = profilingPct - cvPct;
  if (Math.abs(delta) < 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
        <Minus className="w-3 h-3" />
        Sin cambio
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>
        <TrendingUp className="w-3 h-3" />
        +{delta.toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#991B1B' }}>
      <TrendingDown className="w-3 h-3" />
      {delta.toFixed(0)}%
    </span>
  );
}

// ─── Category dot ─────────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<MatchCategory, { bg: string; color: string; label: string }> = {
  HIGH:   { bg: '#DCFCE7', color: '#16A34A', label: 'Alto' },
  MEDIUM: { bg: '#FEF9C3', color: '#CA8A04', label: 'Medio' },
  LOW:    { bg: '#FEE2E2', color: '#DC2626', label: 'Bajo' },
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

// ─── Candidate Card ───────────────────────────────────────────────────────────
function CandidateCard({
  pc,
  selected,
  onToggle,
  viewMode,
}: {
  pc: DualMatchCandidate;
  selected: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasProfileMatch = pc.match_percentage !== pc.cv_match_percentage;

  const profilingPct = hasProfileMatch ? pc.match_percentage : null;
  const showCV       = viewMode === 'both' || viewMode === 'cv';
  const showProfiling = viewMode === 'both' || viewMode === 'profiling';

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: 'white',
        borderColor:    selected ? 'var(--color-primary)' : 'var(--color-primary-light)',
        boxShadow: selected
          ? '0 0 0 2px rgba(149,125,243,0.25), 0 2px 8px rgba(149,125,243,0.1)'
          : '0 1px 4px rgba(149,125,243,0.06)',
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-3">
          <button
            onClick={onToggle}
            className="shrink-0 mt-0.5 transition-transform active:scale-90"
          >
            {selected
              ? <CheckSquare className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              : <Square className="w-5 h-5" style={{ color: '#D1D5DB' }} />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-ink)' }}>
              {pc.candidate.name} {pc.candidate.last_name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {pc.candidate.email}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <CategoryPill category={pc.match_category ?? 'LOW'} />
            {hasProfileMatch && profilingPct !== null && (
              <DeltaBadge cvPct={pc.cv_match_percentage} profilingPct={profilingPct} />
            )}
          </div>
        </div>

        {/* Dual match bars */}
        <div className="space-y-2.5 mb-3">
          {showCV && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3 h-3" style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Match CV</span>
              </div>
              <MatchBar
                label=""
                pct={pc.cv_match_percentage}
                color="var(--color-primary)"
                bg="var(--color-primary-light)"
              />
            </div>
          )}

          {showProfiling && hasProfileMatch && profilingPct !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-3 h-3" style={{ color: 'var(--color-mint)' }} strokeWidth={2} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-mint)' }}>Match Profiling</span>
              </div>
              <MatchBar
                label=""
                pct={profilingPct}
                color="var(--color-mint)"
                bg="#DAFBF2"
              />
            </div>
          )}

          {showProfiling && !hasProfileMatch && (
            <div
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
              style={{ background: '#F9FAFB', color: 'var(--color-text-muted)', border: '1px dashed #E5E7EB' }}
            >
              <Mic className="w-3.5 h-3.5" strokeWidth={1.8} />
              Profiling pendiente
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {((pc.cv_match_explanation?.strengths?.length ?? 0) > 0 || (pc.match_explanation?.strengths?.length ?? 0) > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
          >
            Justificacion IA
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expanded explanations */}
      {expanded && (
        <div
          className="border-t px-4 py-3 space-y-4 text-xs rounded-b-xl"
          style={{ background: '#F9FAFB', borderColor: '#EDE8FB' }}
        >
          {/* CV explanation */}
          {showCV && pc.cv_match_explanation && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Analisis del CV</span>
              </div>
              <p className="mb-2" style={{ color: '#6B7280' }}>{pc.cv_match_explanation.summary}</p>
              {pc.cv_match_explanation.strengths?.length > 0 && (
                <div className="mb-2">
                  <p className="font-semibold mb-1" style={{ color: '#166534' }}>Fortalezas</p>
                  <ul className="space-y-0.5">
                    {pc.cv_match_explanation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <span style={{ color: '#16A34A' }}>+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pc.cv_match_explanation.gaps?.length > 0 && (
                <div className="mb-2">
                  <p className="font-semibold mb-1" style={{ color: '#991B1B' }}>Brechas</p>
                  <ul className="space-y-0.5">
                    {pc.cv_match_explanation.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <span style={{ color: '#DC2626' }}>-</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pc.cv_match_explanation.risk_flags?.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 rounded-lg px-2.5 py-2 mt-1"
                  style={{ background: '#FEF9C3', color: '#92400E' }}
                >
                  <span className="shrink-0">!</span> {f}
                </div>
              ))}
            </div>
          )}

          {/* Profiling explanation */}
          {showProfiling && hasProfileMatch && pc.match_explanation?.summary && (
            <div style={{ borderTop: showCV ? '1px solid var(--color-primary-light)' : 'none', paddingTop: showCV ? '12px' : '0' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Mic className="w-3.5 h-3.5" style={{ color: 'var(--color-mint)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-mint)' }}>Entrevista de voz</span>
              </div>
              <p className="mb-2" style={{ color: '#6B7280' }}>{pc.match_explanation.summary}</p>
              {pc.match_explanation.strengths?.length > 0 && (
                <div className="mb-2">
                  <p className="font-semibold mb-1" style={{ color: '#166534' }}>Destacados</p>
                  <ul className="space-y-0.5">
                    {pc.match_explanation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <span style={{ color: 'var(--color-mint)' }}>+</span> {s}
                      </li>
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
const COLUMN_STYLES: Record<MatchCategory, { headerBg: string; headerColor: string; bodyBg: string; border: string }> = {
  HIGH:   { headerBg: '#F0FDF4', headerColor: '#166534', bodyBg: '#F0FDF4', border: '#BBF7D0' },
  MEDIUM: { headerBg: '#FEFCE8', headerColor: '#713F12', bodyBg: '#FEFCE8', border: '#FDE68A' },
  LOW:    { headerBg: '#FFF1F2', headerColor: '#9F1239', bodyBg: '#FFF1F2', border: '#FECDD3' },
};

function KanbanColumn({
  category,
  candidates,
  selectedIds,
  onToggle,
  viewMode,
}: {
  category: MatchCategory;
  candidates: DualMatchCandidate[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  viewMode: ViewMode;
}) {
  const s = COLUMN_STYLES[category];
  const labels: Record<MatchCategory, string> = {
    HIGH: 'Alto potencial',
    MEDIUM: 'Potencial medio',
    LOW: 'Bajo potencial',
  };

  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-sm">
      <div
        className="px-4 py-3 rounded-t-xl border-t border-x flex items-center justify-between"
        style={{ background: s.headerBg, borderColor: s.border, color: s.headerColor }}
      >
        <div className="flex items-center gap-2">
          <CategoryPill category={category} />
          <span className="text-sm font-semibold">{labels[category]}</span>
        </div>
        <span className="text-sm font-bold">{candidates.length}</span>
      </div>

      <div
        className="flex-1 rounded-b-xl border border-t-0 p-3 space-y-3 min-h-[420px]"
        style={{ background: `${s.bodyBg}66`, borderColor: s.border }}
      >
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: '#D1D5DB' }}>
            <Users className="w-8 h-8 opacity-50" />
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
    queryFn:  () => processesApi.getKanban(id).then((r) => r.data as unknown as DualKanbanResponse),
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

  const totalCandidates  = kanban
    ? (kanban.HIGH?.length ?? 0) + (kanban.MEDIUM?.length ?? 0) + (kanban.LOW?.length ?? 0)
    : 0;
  const pendingCandidates = kanban ? (kanban.LOADED?.length ?? 0) + (kanban.PARSING?.length ?? 0) : 0;

  const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: React.ElementType }[] = [
    { mode: 'both',      label: 'CV + Profiling', icon: Minus },
    { mode: 'cv',        label: 'Solo CV',         icon: FileText },
    { mode: 'profiling', label: 'Solo Profiling',  icon: Mic },
  ];

  return (
    <div>
      <Header
        title="Match & Ranking"
        subtitle="Candidatos evaluados por IA — visualizacion dual"
      >
        <Link href={`/hiring-processes/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Proceso
          </Button>
        </Link>
      </Header>

      {/* Control bar */}
      <div
        className="flex items-center justify-between mb-5 px-5 py-3.5 rounded-xl"
        style={{ background: 'white', border: '1px solid var(--color-primary-light)' }}
      >
        <div className="flex items-center gap-4">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            <strong style={{ color: 'var(--color-ink)' }}>{totalCandidates}</strong> candidatos evaluados
            {pendingCandidates > 0 && (
              <span className="ml-2" style={{ color: '#FFB863' }}>
                <Loader2 className="inline w-3.5 h-3.5 animate-spin mr-1" />
                {pendingCandidates} procesando
              </span>
            )}
          </p>
          {selectedIds.size > 0 && (
            <span
              className="text-sm font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
            >
              {selectedIds.size} seleccionado(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-primary-light)', background: '#F9F7FF' }}
          >
            {VIEW_OPTIONS.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: viewMode === mode ? 'var(--color-primary)' : 'transparent',
                  color:      viewMode === mode ? 'white' : 'var(--color-text-muted)',
                }}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={viewMode === mode ? 2.5 : 2} />
                {label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>

          {selectedIds.size > 0 && (
            <Button
              size="sm"
              onClick={() => profilingMutation.mutate()}
              loading={profilingMutation.isPending}
            >
              <Phone className="w-4 h-4" />
              Iniciar profiling ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
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
