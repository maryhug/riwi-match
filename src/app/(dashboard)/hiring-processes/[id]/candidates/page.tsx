'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateStatusesRefetchInterval } from '@/lib/polling';
import Link from 'next/link';
import {
  ArrowLeft, Phone, RefreshCw, ChevronDown, ChevronUp,
  CheckSquare, Square, Loader2, Users, FileText, Mic, Minus,
  TrendingUp, TrendingDown, Upload, AlertTriangle,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import UploadCvsModal from '@/components/ui/UploadCvsModal';
import { formatPercent } from '@/lib/utils';
import type { MatchCategory } from '@/lib/types';
import type { DualMatchCandidate, DualKanbanResponse } from '@/lib/types';

// --- View mode ---
type ViewMode = 'both' | 'cv' | 'profiling';

// --- Category config ---
const CATEGORY_STYLES: Record<string, { bg: string; color: string; label: string; headerBg: string; headerBorder: string }> = {
  HIGH:            { bg: 'var(--color-mint-light)', color: 'var(--color-mint-dark)', label: 'Alto',           headerBg: 'var(--color-mint-xlight)', headerBorder: 'var(--color-mint)' },
  MEDIUM:          { bg: 'var(--color-accent-light)', color: 'var(--color-accent-dark)', label: 'Medio',          headerBg: '#FEFCE8', headerBorder: 'var(--color-accent)' },
  LOW:             { bg: 'var(--color-coral-light)', color: 'var(--color-coral-dark)', label: 'Bajo',           headerBg: '#FFF1F2', headerBorder: 'var(--color-coral)' },
  NOT_RECOMMENDED: { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: 'No recomendado', headerBg: 'var(--color-surface)', headerBorder: 'var(--color-border)' },
};

function CategoryPill({ category }: { category: string | null | undefined }) {
  const s = CATEGORY_STYLES[category ?? 'LOW'] ?? CATEGORY_STYLES.LOW;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[var(--radius-full)] uppercase tracking-wide"
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
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-[var(--radius-full)] bg-bg-subtle text-text-muted">
        <Minus className="w-3 h-3" /> Sin cambio
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-[var(--radius-full)] bg-mint-light text-mint-dark">
        <TrendingUp className="w-3 h-3" /> +{delta.toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-[var(--radius-full)] bg-coral-light text-coral-dark">
      <TrendingDown className="w-3 h-3" /> {delta.toFixed(0)}%
    </span>
  );
}

function MatchBar({ label, pct, color, bg }: { label: string; pct: number; color: string; bg: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-ink">{formatPercent(pct)}</span>
      </div>
      <div className="h-1.5 rounded-[var(--radius-full)] overflow-hidden" style={{ background: bg }}>
        <div className="h-full rounded-[var(--radius-full)] transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// --- Candidate Card ---
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
      className={`rounded-[var(--radius-md)] border transition-all duration-200 ${
        selected ? 'border-primary shadow-sm' : 'border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
      }`}
      style={{
        background: 'var(--color-surface)',
        boxShadow: selected ? '0 0 0 2px rgba(124,58,237,0.15)' : undefined,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <button onClick={onToggle} className="shrink-0 mt-0.5 transition-transform active:scale-90 hover:opacity-80">
            {selected
              ? <CheckSquare className="w-5 h-5 text-primary" />
              : <Square className="w-5 h-5 text-border-strong" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight truncate text-ink">
              {pc.candidate.name} {pc.candidate.last_name}
            </p>
            <p className="text-xs mt-1 truncate text-text-muted font-medium">{pc.candidate.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <CategoryPill category={pc.match_category ?? 'LOW'} />
            {hasProfileMatch && profilingPct !== null && (
              <DeltaBadge cvPct={pc.cv_match_percentage} profilingPct={profilingPct} />
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {showCV && (
            <div className="space-y-1 bg-primary-xlight/50 p-2.5 rounded-[var(--radius-sm)] border border-primary-light">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-primary-dark" strokeWidth={2} />
                <span className="text-[10px] font-bold text-primary-dark uppercase tracking-wider">Match CV</span>
              </div>
              <MatchBar label="" pct={pc.cv_match_percentage} color="var(--color-primary)" bg="var(--color-primary-light)" />
            </div>
          )}
          {showProfiling && hasProfileMatch && profilingPct !== null && (
            <div className="space-y-1 bg-mint-xlight/50 p-2.5 rounded-[var(--radius-sm)] border border-mint-light">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mic className="w-3.5 h-3.5 text-mint-dark" strokeWidth={2} />
                <span className="text-[10px] font-bold text-mint-dark uppercase tracking-wider">Match Profiling</span>
              </div>
              <MatchBar label="" pct={profilingPct} color="var(--color-mint)" bg="var(--color-mint-light)" />
            </div>
          )}
          {showProfiling && !hasProfileMatch && (
            <div className="flex items-center gap-2 text-xs font-medium rounded-[var(--radius-sm)] px-3 py-2 bg-bg-subtle text-text-muted border border-dashed border-border">
              <Mic className="w-3.5 h-3.5" strokeWidth={1.8} />
              Profiling pendiente
            </div>
          )}
        </div>

        {((pc.cv_match_explanation?.strengths?.length ?? 0) > 0 || (pc.match_explanation?.strengths?.length ?? 0) > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors w-full justify-center py-1.5 bg-bg-subtle/50 rounded-[var(--radius-sm)] hover:bg-bg-subtle"
          >
            Justificación IA
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3.5 space-y-4 text-xs bg-bg-subtle/30 rounded-b-[var(--radius-md)]">
          {showCV && pc.cv_match_explanation && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="font-bold text-primary text-[11px] uppercase tracking-wider">Análisis del CV</span>
              </div>
              <p className="mb-3 text-text font-medium leading-relaxed">{pc.cv_match_explanation.summary}</p>
              {pc.cv_match_explanation.strengths?.length > 0 && (
                <div className="mb-3">
                  <p className="font-bold mb-1.5 text-mint-dark text-[10px] uppercase tracking-wider">Fortalezas</p>
                  <ul className="space-y-1">
                    {pc.cv_match_explanation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-text font-medium">
                        <span className="text-mint-dark font-bold mt-0.5">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pc.cv_match_explanation.gaps?.length > 0 && (
                <div>
                  <p className="font-bold mb-1.5 text-coral-dark text-[10px] uppercase tracking-wider">Brechas</p>
                  <ul className="space-y-1">
                    {pc.cv_match_explanation.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-text font-medium">
                        <span className="text-coral-dark font-bold mt-0.5">-</span> {g}
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

// --- Kanban Column ---
function KanbanColumn({ category, candidates, selectedIds, onToggle, viewMode }: {
  category: MatchCategory; candidates: DualMatchCandidate[]; selectedIds: Set<string>; onToggle: (id: string) => void; viewMode: ViewMode;
}) {
  const s = CATEGORY_STYLES[category];
  const labels: Record<MatchCategory, string> = {
    HIGH: 'Alto potencial', MEDIUM: 'Potencial medio', LOW: 'Bajo potencial',
  };

  return (
    <div className="flex flex-col flex-1 min-w-[320px] max-w-sm">
      <div
        className="px-5 py-4 rounded-t-[var(--radius-xl)] border-t border-x flex items-center justify-between"
        style={{ background: s.headerBg, borderColor: s.headerBorder, color: s.color }}
      >
        <div className="flex items-center gap-2.5">
          <CategoryPill category={category} />
          <span className="text-[13px] font-bold uppercase tracking-wider">{labels[category]}</span>
        </div>
        <span className="text-xs font-black bg-white/50 px-2 py-0.5 rounded-[var(--radius-full)] backdrop-blur-sm shadow-sm">{candidates.length}</span>
      </div>

      <div
        className="flex-1 rounded-b-[var(--radius-xl)] border border-t-0 p-4 space-y-4 min-h-[500px]"
        style={{ background: `${s.bg}80`, borderColor: s.headerBorder }}
      >
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted/60">
            <Users className="w-10 h-10 opacity-40" />
            <p className="text-sm font-semibold">Sin candidatos</p>
          </div>
        ) : (
          candidates.map((pc) => (
            <CandidateCard
              key={pc.id}
              pc={pc}
              selected={selectedIds.has(pc.id)}
              onToggle={() => onToggle(pc.id)}
              viewMode={viewMode}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function CandidatesKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [pollStart] = useState(() => Date.now());
  const { data: kanban, isLoading, refetch } = useQuery({
    queryKey: ['kanban', id],
    queryFn: () => processesApi.getKanban(id).then((r) => r.data as unknown as DualKanbanResponse),
    refetchInterval: (q) => {
      const d = q.state.data as DualKanbanResponse | undefined;
      const statuses = d
        ? [...d.HIGH, ...d.MEDIUM, ...d.LOW, ...d.LOADED, ...d.PARSING].map((c) => c.status)
        : undefined;
      return candidateStatusesRefetchInterval(statuses, pollStart);
    },
  });

  const profilingMutation = useMutation({
    mutationFn: () => processesApi.startProfiling(id, Array.from(selectedIds)),
    onSuccess: () => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['kanban', id] });
    },
  });

  const toggleSelect = (processCandidateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(processCandidateId)) next.delete(processCandidateId);
      else next.add(processCandidateId);
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
    <div className="bg-bg min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Header title="Match & Ranking" subtitle="Candidatos evaluados por IA — visualización dual">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-2" />
            Subir más CVs
          </Button>
          <Link href={`/hiring-processes/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Volver al proceso
            </Button>
          </Link>
        </div>
      </Header>

      {(() => {
        const err = (profilingMutation.error as { response?: { data?: { detail?: string } } } | null)
          ?.response?.data?.detail;
        return err ? (
          <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] bg-coral-light border border-coral text-xs font-semibold text-coral-dark flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {err}
          </div>
        ) : null;
      })()}

      {/* Control bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-5 py-4 rounded-[var(--radius-lg)] bg-surface border border-border shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-text-muted font-medium">
            <strong className="text-ink text-base">{totalCandidates}</strong> candidatos evaluados
            {pendingCandidates > 0 && (
              <span className="ml-3 text-accent-dark inline-flex items-center bg-accent-light px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-bold">
                <Loader2 className="inline w-3.5 h-3.5 animate-spin mr-1.5" />
                {pendingCandidates} procesando
              </span>
            )}
          </p>
          {selectedIds.size > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-[var(--radius-md)] bg-primary-light text-primary-dark shadow-sm">
              {selectedIds.size} seleccionado(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center rounded-[var(--radius-sm)] overflow-hidden border border-border bg-bg-subtle p-0.5">
            {VIEW_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 text-[11px] font-bold transition-all rounded-[var(--radius-sm)] ${
                  viewMode === mode 
                    ? 'bg-surface text-ink shadow-sm ring-1 ring-border' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()} className="px-2">
            <RefreshCw className="w-4 h-4" />
          </Button>

          {selectedIds.size > 0 && (
            <Button size="sm" onClick={() => profilingMutation.mutate()} loading={profilingMutation.isPending} className="bg-primary text-white hover:bg-primary-dark shadow-md">
              <Phone className="w-4 h-4 mr-2" />
              Iniciar profiling ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-primary animate-spin" />
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-6 snap-x">
          {(['HIGH', 'MEDIUM', 'LOW'] as MatchCategory[]).map((cat) => (
            <div key={cat} className="snap-start shrink-0">
              <KanbanColumn
                category={cat}
                candidates={(kanban?.[cat] ?? []) as DualMatchCandidate[]}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      )}

      <UploadCvsModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        processId={id}
      />
    </div>
  );
}
