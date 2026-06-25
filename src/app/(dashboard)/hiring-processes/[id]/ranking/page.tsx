'use client';

import { use, useState, useCallback, useEffect, Fragment } from 'react';

function withToken(url: string): string {
  const token = localStorage.getItem('access_token');
  return token ? `${url}?token=${token}` : url;
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Search, AlertTriangle, X, Upload,
  ChevronDown, ChevronUp, Users, Phone, Sparkles,
  MapPin, Mail, PhoneCall, FileText, User, Eye, Download, ExternalLink,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import PdfPreviewModal from '@/components/ui/PdfPreviewModal';
import UploadCvsModal from '@/components/ui/UploadCvsModal';
import type { CandidateListItem, CandidateDetail, MatchBreakdown } from '@/lib/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CFG = {
  HIGH:            { label: 'Alto',           color: '#059669', bg: '#ECFDF5' },
  MEDIUM:          { label: 'Medio',          color: '#D97706', bg: '#FFFBEB' },
  LOW:             { label: 'Bajo',           color: '#DC2626', bg: '#FEF2F2' },
  NOT_RECOMMENDED: { label: 'No recomendado', color: '#94A3B8', bg: '#F8FAFC' },
} as const;

const BREAKDOWN_META: Record<string, { label: string; defaultWeight: number }> = {
  technical_skills:         { label: 'Skills técnicos', defaultWeight: 45 },
  relevant_experience:      { label: 'Experiencia',      defaultWeight: 25 },
  seniority:                { label: 'Seniority',        defaultWeight: 15 },
  industry_domain:          { label: 'Industria',        defaultWeight: 7  },
  languages:                { label: 'Idiomas',          defaultWeight: 5  },
  education_certifications: { label: 'Educación',        defaultWeight: 3  },
};

const BREAKDOWN_ORDER = [
  'technical_skills', 'relevant_experience', 'seniority',
  'industry_domain', 'languages', 'education_certifications',
];

const PROFILING_MAP: Record<string, { label: string; variant: 'active' | 'done' | 'idle' | 'queued' | 'failed' }> = {
  SELECTED_FOR_PROFILING: { label: 'En cola',     variant: 'queued' },
  PROFILING_QUEUED:       { label: 'En cola',     variant: 'queued' },
  PROFILING_CALLING:      { label: 'En llamada',  variant: 'active' },
  PROFILING_COMPLETED:    { label: 'Completado',  variant: 'done'   },
  PROFILING_FAILED:       { label: 'No contestó', variant: 'failed' },
  DISCARDED:              { label: 'Descartado',  variant: 'failed' },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((p) => (p[0] ?? '').toUpperCase()).join('');
}

function catCfg(category: string | null | undefined) {
  return CATEGORY_CFG[(category as keyof typeof CATEGORY_CFG) ?? 'LOW'] ?? CATEGORY_CFG.LOW;
}

function applyFilters(candidates: CandidateListItem[], filter: FilterKey, search: string) {
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

// ─── Micro-components ─────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.3, background: getAvatarColor(name) }}
    >
      {initials(name)}
    </div>
  );
}

function MatchRing({ pct, category, size = 50 }: { pct: number; category: string | null; size?: number }) {
  const cfg = catCfg(category);
  const r   = size * 0.39;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const cx    = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#F1F5F9" strokeWidth={size * 0.098} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={cfg.color} strokeWidth={size * 0.098}
        strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={cx} y={cx} dy=".3em" textAnchor="middle"
        fontSize={size * 0.22} fontWeight="700" fill={cfg.color} fontFamily="inherit">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function CategoryChip({ category }: { category: string | null | undefined }) {
  if (!category) return <span className="text-slate-300">—</span>;
  const cfg = catCfg(category);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
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
        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
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
    active: 'text-violet-600', done: 'text-emerald-600',
    queued: 'text-amber-600', failed: 'text-slate-400', idle: 'text-slate-400',
  };
  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${colorMap[cfg.variant]}`}>
      {cfg.variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />}
      {cfg.label}
    </span>
  );
}

function BreakdownBars({ breakdown }: { breakdown: MatchBreakdown | Record<string, unknown> }) {
  return (
    <div className="space-y-2.5">
      {BREAKDOWN_ORDER.map((key) => {
        const item = (breakdown as MatchBreakdown)[key as keyof MatchBreakdown];
        const meta = BREAKDOWN_META[key];
        if (!meta) return null;
        const score  = item?.raw_score ?? 0;
        const weight = item?.weight ?? meta.defaultWeight;
        const color  = catCfg(score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW').color;
        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-600 font-medium">{meta.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">peso {weight}%</span>
                <span className="text-xs font-semibold" style={{ color }}>{score}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Expandable row ───────────────────────────────────────────────────────────

function ExpandedRow({ candidate, onOpenDetail }: { candidate: CandidateListItem; onOpenDetail: () => void }) {
  const hasBreakdown = candidate.breakdown && Object.keys(candidate.breakdown).length > 0;
  const strengths = candidate.strengths ?? [];
  const gaps      = candidate.gaps ?? [];

  return (
    <tr>
      <td colSpan={9} className="bg-slate-50 border-b border-slate-100 px-0">
        <div className="px-5 py-4 grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Breakdown</p>
            {hasBreakdown
              ? <BreakdownBars breakdown={candidate.breakdown!} />
              : <p className="text-xs text-slate-400">Sin datos aún</p>}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-3">Fortalezas</p>
            {strengths.length > 0 ? (
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-400">—</p>}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-3">Brechas</p>
            {gaps.length > 0 ? (
              <ul className="space-y-1.5">
                {gaps.map((g, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-400">—</p>}
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-2.5 flex justify-end">
          <button onClick={onOpenDetail}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
            <Sparkles className="w-3 h-3" />
            Ver análisis completo de IA
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  processId,
  candidate,
  onClose,
  onPreviewNormalized,
  onPreviewOriginal,
}: {
  processId: string;
  candidate: CandidateListItem;
  onClose: () => void;
  onPreviewNormalized: () => void;
  onPreviewOriginal: () => void;
}) {
  const { data: detail, isLoading } = useQuery<CandidateDetail>({
    queryKey: ['candidate-detail', processId, candidate.process_candidate_id],
    queryFn: () => processesApi.getCandidateDetail(processId, candidate.process_candidate_id).then((r) => r.data),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[520px] max-w-full bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={candidate.name} size={40} />
            <div>
              <p className="font-semibold text-slate-900 text-sm">{candidate.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{candidate.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Score band */}
              <div className="flex items-center gap-6 px-5 py-4 border-b border-slate-100">
                <MatchRing pct={candidate.match_percentage} category={candidate.match_category} size={72} />
                <div className="flex-1 space-y-2">
                  <CategoryChip category={candidate.match_category} />
                  <div className="flex flex-wrap gap-3 mt-1">
                    {detail?.candidate.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <PhoneCall className="w-3 h-3 shrink-0" /> {detail.candidate.phone}
                      </span>
                    )}
                    {candidate.city && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" /> {candidate.city}
                      </span>
                    )}
                    {detail?.candidate.email && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="w-3 h-3 shrink-0" /> {detail.candidate.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {detail?.match && (
                <div className="border-b border-slate-100">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Análisis de IA</p>
                  </div>

                  {detail.match.summary && (
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">{detail.match.summary}</p>
                    </div>
                  )}

                  {detail.match.breakdown && Object.keys(detail.match.breakdown).length > 0 && (
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Breakdown de dimensiones</p>
                      <BreakdownBars breakdown={detail.match.breakdown} />
                    </div>
                  )}

                  {(detail.match.strengths.length > 0 || detail.match.gaps.length > 0) && (
                    <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">Fortalezas</p>
                        <ul className="space-y-1.5">
                          {detail.match.strengths.map((s, i) => (
                            <li key={i} className="flex gap-2 text-xs text-slate-700">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-2">Brechas</p>
                        <ul className="space-y-1.5">
                          {detail.match.gaps.map((g, i) => (
                            <li key={i} className="flex gap-2 text-xs text-slate-700">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documentos adjuntos */}
              <div className="border-b border-slate-100">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Documentos adjuntos</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {detail?.candidate.cv_url && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">CV Original</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Archivo subido por el candidato</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={onPreviewOriginal}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                        <a href={withToken(processesApi.getCvFileUrl(processId, candidate.process_candidate_id))}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          Bajar
                        </a>
                      </div>
                    </div>
                  )}

                  {detail?.candidate.normalized_cv_url && (
                    <div className="flex items-center justify-between bg-violet-50/50 border border-violet-100 rounded-lg p-3">
                      <div>
                        <p className="text-xs font-semibold text-violet-900">CV Normalizado</p>
                        <p className="text-[10px] text-violet-500 mt-0.5">CV estructurado y estandarizado por IA</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={onPreviewNormalized}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-violet-200 text-violet-600 text-xs font-medium hover:bg-slate-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                        <a href={withToken(processesApi.getNormalizedCvFileUrl(processId, candidate.process_candidate_id))}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          Bajar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Override */}
              <OverrideSection detail={detail} processId={processId} pcId={candidate.process_candidate_id} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Override section ─────────────────────────────────────────────────────────

function OverrideSection({
  detail,
  processId,
  pcId,
}: {
  detail: CandidateDetail | undefined;
  processId: string;
  pcId: string;
}) {
  const qc       = useQueryClient();
  const [notes, setNotes]     = useState('');
  const [override, setOverride] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (detail) {
      setNotes(detail.human_notes ?? '');
      setOverride(detail.human_override_match != null ? String(detail.human_override_match) : '');
    }
  }, [detail]);

  const save = useCallback(async () => {
    await fetch(`/api/v1/processes/${processId}/candidates/${pcId}/override`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        human_notes: notes || null,
        human_override_match: override ? parseFloat(override) : null,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    qc.invalidateQueries({ queryKey: ['candidate-detail', processId, pcId] });
    qc.invalidateQueries({ queryKey: ['candidates', processId] });
  }, [notes, override, processId, pcId, qc]);

  return (
    <div>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        <User className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Override del recruiter</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Score manual (0–100)</label>
          <input type="number" min={0} max={100} value={override}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="Dejar vacío para usar score de IA"
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Notas del recruiter</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones, contexto adicional..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 resize-none" />
        </div>
        <button onClick={save}
          className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors">
          {saved ? 'Guardado ✓' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc     = useQueryClient();

  const [search, setSearch]               = useState('');
  const [activeFilter, setActiveFilter]   = useState<FilterKey>('ALL');
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [drawerCandidate, setDrawerCandidate] = useState<CandidateListItem | null>(null);
  const [previewData, setPreviewData] = useState<{ title: string; url: string } | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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

  const toggleExpand = useCallback((pcId: string) =>
    setExpandedId((prev) => (prev === pcId ? null : pcId)), []);

  const toggleSelect = useCallback((pcId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pcId)) next.delete(pcId); else next.add(pcId);
      return next;
    }), []);

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.process_candidate_id)));
  };

  return (
    <div>
      <Header title="Ranking de candidatos" subtitle="Resultados del match de IA ordenados por puntuación">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-3.5 h-3.5" />
            Subir más CVs
          </Button>
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar candidato..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveFilter(activeFilter === key ? 'ALL' : key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                activeFilter === key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200'
              }`}>
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
          <span className="rounded bg-white/20 text-[10px] font-bold px-1">
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
        <div className="bg-white border-y border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pl-4 pr-3 py-3 w-9">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600 cursor-pointer" />
                </th>
                {['#', 'Candidato', 'Match', 'Categoría', 'Top Skills', 'Ciudad', 'Profiling', ''].map((th) => (
                  <th key={th} className="px-3 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{th}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => {
                const isMatched  = c.match_percentage > 0;
                const isExpanded = expandedId === c.process_candidate_id;
                const criticalGap = c.gaps?.find(
                  (g) => g.toLowerCase().includes('requerido') || g.toLowerCase().includes('excluyente') || g.toLowerCase().includes('no cumplido'),
                );

                return (
                  <Fragment key={c.process_candidate_id}>
                    <tr
                      className={`border-b border-slate-100 transition-colors group ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>

                      <td className="pl-4 pr-3 py-3.5">
                        <input type="checkbox" checked={selected.has(c.process_candidate_id)}
                          onChange={() => toggleSelect(c.process_candidate_id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600 cursor-pointer" />
                      </td>

                      <td className="px-3 py-3.5 text-xs font-semibold text-slate-400 tabular-nums">#{c.rank}</td>

                      <td className="px-3 py-3.5 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} />
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
                        {isMatched
                          ? <MatchRing pct={c.match_percentage} category={c.match_category} />
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      <td className="px-3 py-3.5">
                        <CategoryChip category={isMatched ? c.match_category : null} />
                      </td>

                      <td className="px-3 py-3.5 min-w-[140px]">
                        <SkillChips skills={c.strengths ?? []} />
                      </td>

                      <td className="px-3 py-3.5">
                        {c.city
                          ? <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-300" />{c.city}
                            </span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      <td className="px-3 py-3.5">
                        <ProfilingStatusCell status={c.status} />
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1">
                          {c.normalized_cv_url && (
                            <button onClick={() => {
                              setPreviewData({ title: c.name, url: withToken(processesApi.getNormalizedCvFileUrl(id, c.process_candidate_id)) });
                            }}
                              className="p-1.5 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                              title="Ver CV normalizado (PDF)">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setDrawerCandidate(c)}
                            className="p-1.5 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            title="Ver análisis completo">
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleExpand(c.process_candidate_id)}
                            className={`p-1.5 rounded transition-colors ${
                              isExpanded ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Breakdown">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <ExpandedRow
                        key={`${c.process_candidate_id}-exp`}
                        candidate={c}
                        onOpenDetail={() => setDrawerCandidate(c)}
                      />
                    )}
                  </Fragment>
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

      {drawerCandidate && (
        <DetailDrawer
          processId={id}
          candidate={drawerCandidate}
          onClose={() => setDrawerCandidate(null)}
          onPreviewNormalized={() => {
            setPreviewData({ title: drawerCandidate.name, url: withToken(processesApi.getNormalizedCvFileUrl(id, drawerCandidate.process_candidate_id)) });
          }}
          onPreviewOriginal={() => {
            setPreviewData({ title: `${drawerCandidate.name} (Original)`, url: withToken(processesApi.getCvFileUrl(id, drawerCandidate.process_candidate_id)) });
          }}
        />
      )}

      {/* Visor de PDF */}
      <PdfPreviewModal
        isOpen={!!previewData}
        onClose={() => setPreviewData(null)}
        title={previewData?.title ?? ''}
        fileUrl={previewData?.url ?? ''}
      />

      <UploadCvsModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        processId={id}
      />
    </div>
  );
}
