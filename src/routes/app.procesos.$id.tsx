import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  PlayCircle,
  Upload,
  Archive,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Phone,
  Eye,
  Download,
  Sparkles,
  PhoneCall,
  Users,
  Settings2,
  FileDown,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { UploadCvsModal } from "@/components/app/UploadCvsModal";
import { ProfilingResultModal } from "@/components/app/ProfilingResultModal";
import { PipelineBoard, ProfilingHistoryDialog } from "@/components/app/PipelineBoard";
import PdfPreviewModal from "@/components/ui/PdfPreviewModal";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  getProcess,
  getProcessMetrics,
  getProcessProgress,
  updateProcessStatus,
  updateProcess,
  assignQuestionSet,
  updateVoiceConfig,
  createJobDescription,
  parseJobDescription,
  getJobDescriptions,
} from "@/lib/api/processes.functions";
import {
  getCandidates,
  analyzeCVs,
  getCandidateDetail,
  overrideCandidate,
  updateCandidateAnalysisContext,
  updateCandidate,
  deleteCandidate,
} from "@/lib/api/candidates.functions";
import { triggerMatch, getMatchStatus } from "@/lib/api/match.functions";
import {
  triggerProfiling,
  cancelProfilingRun,
  getProcessPipeline,
  getProcessProfilingRuns,
  getProfilingRunDetail,
  getProfilingAnswers,
} from "@/lib/api/profiling.functions";
import { submitFeedback } from "@/lib/api/ai-feedback.functions";
import { getQuestionSets } from "@/lib/api/question-sets.functions";
import { LIVE_REFRESH_INTERVAL_MS } from "@/lib/polling";
import {
  PROCESS_STATUS_LABEL,
  CANDIDATE_STATUS_LABEL,
  MATCH_CATEGORY_LABEL,
  ADVANCEMENT_PROBABILITY_LABEL,
  WHATSAPP_CONSENT_STATUS_LABEL,
  type ProcessStatus,
  type MatchCategory,
  type CandidateStatus,
  type AdvancementProbability,
  type WhatsAppConsentStatus,
} from "@/lib/types/enums";
import type {
  CandidateListItem,
  MatchBreakdown,
  ProcessProgressResponse,
  ParseJDResponse,
  ProfilingRunOut,
  PipelineCandidate,
} from "@/lib/types/api";
import { cn, cleanAnswerText } from "@/lib/utils";

export const Route = createFileRoute("/app/procesos/$id")({
  head: () => ({ meta: [{ title: "Match" }] }),
  component: Detalle,
});

const tabs = ["Dashboard", "Ranking de candidatos", "Kanban", "Configuración"] as const;
type TabName = (typeof tabs)[number];

const CATEGORY_COLOR: Record<MatchCategory, { text: string; bg: string; ring: string }> = {
  HIGH: { text: "text-success", bg: "bg-success/15", ring: "#22c55e" },
  MEDIUM: { text: "text-warning-foreground", bg: "bg-warning/15", ring: "#eab308" },
  LOW: { text: "text-destructive", bg: "bg-destructive/15", ring: "#ef4444" },
  NOT_RECOMMENDED: { text: "text-muted-foreground", bg: "bg-muted", ring: "#94a3b8" },
};

const ADVANCE_COLOR: Record<string, string> = {
  HIGH: "bg-success/15 text-success",
  MEDIUM: "bg-warning/15 text-warning-foreground",
  LOW: "bg-destructive/15 text-destructive",
};

const BREAKDOWN_LABELS: Record<keyof MatchBreakdown, string> = {
  technical_skills: "Skills técnicos",
  relevant_experience: "Experiencia",
  seniority: "Seniority",
  industry_domain: "Industria",
  languages: "Idiomas",
  education_certifications: "Educación",
};

const WHATSAPP_CONSENT_STYLE: Record<
  WhatsAppConsentStatus,
  { icon: typeof ThumbsUp; className: string }
> = {
  ACCEPTED: { icon: ThumbsUp, className: "text-emerald-600 bg-emerald-500/10" },
  REJECTED: { icon: ThumbsDown, className: "text-rose-600 bg-rose-500/10" },
  PENDING: { icon: AlertCircle, className: "text-amber-600 bg-amber-500/10" },
  TIMEOUT: { icon: XCircle, className: "text-muted-foreground bg-muted" },
};

function WhatsAppConsentBadge({ status }: { status: WhatsAppConsentStatus }) {
  const { icon: Icon, className } = WHATSAPP_CONSENT_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold",
        className,
      )}
      title={`Autorización WhatsApp: ${WHATSAPP_CONSENT_STATUS_LABEL[status]}`}
    >
      <Icon className="h-3 w-3" />
      {WHATSAPP_CONSENT_STATUS_LABEL[status]}
    </span>
  );
}

function MatchRing({
  pct,
  category,
  size = 44,
}: {
  pct: number;
  category: MatchCategory | null;
  size?: number;
}) {
  const color = category ? CATEGORY_COLOR[category].ring : "#94a3b8";
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-muted/30"
        strokeWidth={size * 0.1}
      />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.1}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: "stroke-dashoffset .5s" }}
      />
      <text
        x={c}
        y={c}
        dy=".32em"
        textAnchor="middle"
        fontSize={size * 0.26}
        fontWeight={700}
        fill={color}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function Detalle() {
  const { id } = useParams({ from: "/app/procesos/$id" });
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabName>("Dashboard");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerCandidate, setDrawerCandidate] = useState<CandidateListItem | null>(null);
  const [profilingModalRun, setProfilingModalRun] = useState<ProfilingRunOut | null>(null);
  const [historyCandidate, setHistoryCandidate] = useState<PipelineCandidate | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ title: string; url: string } | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CandidateListItem | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<CandidateListItem | null>(null);
  const [closeProcessModalOpen, setCloseProcessModalOpen] = useState(false);
  const { data: process, isLoading: processLoading } = useQuery({
    queryKey: ["process", id],
    queryFn: () => getProcess({ data: { processId: id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const { data: progress } = useQuery({
    queryKey: ["process-progress", id],
    queryFn: () => getProcessProgress({ data: { processId: id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", id],
    queryFn: () => getCandidates({ data: { processId: id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const { data: profilingRunsData } = useQuery({
    queryKey: ["profiling-runs", id],
    queryFn: () => getProcessProfilingRuns({ data: { processId: id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const { data: pipelineData } = useQuery({
    queryKey: ["process-pipeline", id],
    queryFn: () => getProcessPipeline({ data: { processId: id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const { data: matchStatus } = useQuery({
    queryKey: ["match-status", id],
    queryFn: () => getMatchStatus({ data: { processId: id } }),
    enabled: progress?.stage === "MATCH_PROCESSING",
    refetchInterval: (q) => (q.state.data?.is_complete ? false : LIVE_REFRESH_INTERVAL_MS),
  });

  const candidates = candidatesData?.candidates ?? [];
  const profilingRuns = profilingRunsData?.profiling_runs ?? [];

  const latestRunByPc = useMemo(() => {
    const map = new Map<string, ProfilingRunOut>();
    for (const r of profilingRunsData?.profiling_runs ?? []) {
      const existing = map.get(r.process_candidate_id);
      if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
        map.set(r.process_candidate_id, r);
      }
    }
    return map;
  }, [profilingRunsData]);

  const pipelineByPc = useMemo(
    () =>
      new Map((pipelineData?.candidates ?? []).map((item) => [item.process_candidate_id, item])),
    [pipelineData],
  );

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeCVs({ data: { processId: id } }),
    onSuccess: (res) => {
      toast.success(
        res.queued > 0
          ? `Análisis de CVs iniciado — ${res.queued} candidato(s) en cola`
          : res.message,
        {
          description: res.skipped.length > 0 ? `${res.skipped.length} omitido(s)` : undefined,
        },
      );
      qc.invalidateQueries({ queryKey: ["candidates", id] });
      qc.invalidateQueries({ queryKey: ["process-progress", id] });
      qc.invalidateQueries({ queryKey: ["process", id] });
      qc.invalidateQueries({ queryKey: ["processes"] });
      qc.invalidateQueries({ queryKey: ["match-status", id] });
      qc.invalidateQueries({ queryKey: ["process-pipeline", id] });
      qc.invalidateQueries({ queryKey: ["profiling-runs", id] });
      qc.invalidateQueries({ queryKey: ["process-metrics", id] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el análisis de CVs"),
  });

  const matchMutation = useMutation({
    mutationFn: () => triggerMatch({ data: { processId: id } }),
    onSuccess: (res) => {
      if ("tasks" in res) toast.success(`Match iniciado — ${res.queued} candidato(s) en cola`);
      else toast.info(res.message);
      qc.invalidateQueries({ queryKey: ["process", id] });
      qc.invalidateQueries({ queryKey: ["process-progress", id] });
      qc.invalidateQueries({ queryKey: ["candidates", id] });
      qc.invalidateQueries({ queryKey: ["process-pipeline", id] });
      qc.invalidateQueries({ queryKey: ["match-status", id] });
      qc.invalidateQueries({ queryKey: ["process-metrics", id] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el match"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateProcessStatus({ data: { processId: id, status } }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["process", id] });
      qc.invalidateQueries({ queryKey: ["process-progress", id] });
      qc.invalidateQueries({ queryKey: ["process-metrics", id] });
      qc.invalidateQueries({ queryKey: ["processes"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar"),
  });

  const profilingMutation = useMutation({
    mutationFn: (ids: string[]) =>
      triggerProfiling({ data: { processId: id, processCandidateIds: ids } }),
    onSuccess: (res) => {
      toast.success(`${res.queued} llamada(s) encolada(s)`, {
        description: res.skipped.length > 0 ? `${res.skipped.length} omitido(s)` : undefined,
      });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["candidates", id] });
      qc.invalidateQueries({ queryKey: ["profiling-runs", id] });
      qc.invalidateQueries({ queryKey: ["process-progress", id] });
      qc.invalidateQueries({ queryKey: ["process-pipeline", id] });
      qc.invalidateQueries({ queryKey: ["process-metrics", id] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo activar profiling"),
  });

  const cancelProfilingMutation = useMutation({
    mutationFn: (item: PipelineCandidate) =>
      cancelProfilingRun({ data: { runId: item.latest_run!.id } }),
    onSuccess: () => {
      toast.success("Corrida cancelada");
      qc.invalidateQueries({ queryKey: ["process-pipeline", id] });
      qc.invalidateQueries({ queryKey: ["profiling-runs", id] });
      qc.invalidateQueries({ queryKey: ["process-progress", id] });
      qc.invalidateQueries({ queryKey: ["process-metrics", id] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar"),
  });

  const openLatestRun = async (item: PipelineCandidate) => {
    if (!item.latest_run) return;
    try {
      const run = await qc.fetchQuery({
        queryKey: ["profiling-run", item.latest_run.id],
        queryFn: () => getProfilingRunDetail({ data: { runId: item.latest_run!.id } }),
      });
      setProfilingModalRun(run);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el intento");
    }
  };

  if (processLoading) {
    return <LoadingIndicator className="py-20" label="Cargando proceso…" />;
  }
  if (!process) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">Proceso no encontrado.</div>
    );
  }

  const isActive = process.status !== "CLOSED" && process.status !== "ARCHIVED";
  const hasUnanalyzedCVs = candidates.some((candidate) =>
    ["LOADED", "CV_PROCESSING", "CV_ERROR"].includes(candidate.status),
  );
  const canAnalyzeCVs =
    isActive && candidates.some((candidate) => ["LOADED", "CV_ERROR"].includes(candidate.status));
  const canRunMatch =
    !!process.job_description &&
    isActive &&
    !hasUnanalyzedCVs &&
    progress?.stage !== "CV_PROCESSING" &&
    progress?.stage !== "MATCH_PROCESSING";
  const matchDisabledReason = !process.job_description
    ? "El proceso necesita una Job Description"
    : hasUnanalyzedCVs
      ? "Analiza todos los CVs antes de ejecutar el match"
      : progress?.stage === "CV_PROCESSING" || progress?.stage === "MATCH_PROCESSING"
        ? "Hay un análisis en curso"
        : undefined;

  return (
    <div className="space-y-6">
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a procesos
      </Link>

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{process.name}</h1>
              <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-primary/15 text-primary">
                {progress?.stage_label ?? PROCESS_STATUS_LABEL[process.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {process.job_title} · {process.area} · {process.seniority} · Reclutador:{" "}
              {process.recruiter_name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={!canAnalyzeCVs || analyzeMutation.isPending}
              title={
                !canAnalyzeCVs && hasUnanalyzedCVs
                  ? "No hay CVs pendientes o con error para analizar"
                  : undefined
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-semibold disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />{" "}
              {analyzeMutation.isPending ? "Analizando CVs…" : "Analizar CVs"}
            </button>
            <button
              onClick={() => matchMutation.mutate()}
              disabled={!canRunMatch || matchMutation.isPending || analyzeMutation.isPending}
              title={matchDisabledReason}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
            >
              <PlayCircle className="h-4 w-4" />{" "}
              {matchMutation.isPending ? "Iniciando…" : "Ejecutar análisis de match"}
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              disabled={!isActive}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/60 text-sm disabled:opacity-40"
            >
              <Upload className="h-3.5 w-3.5" /> Cargar más CVs
            </button>
            {isActive ? (
              <button
                onClick={() => setCloseProcessModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 text-sm font-semibold transition cursor-pointer shadow-xs"
              >
                <XCircle className="h-4 w-4 text-rose-500" /> Cerrar proceso
              </button>
            ) : process.status === "CLOSED" ? (
              <button
                onClick={() => statusMutation.mutate("ARCHIVED")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/60 text-sm"
              >
                <Archive className="h-3.5 w-3.5" /> Archivar
              </button>
            ) : null}
          </div>
        </div>

        {progress?.stage === "MATCH_PROCESSING" && matchStatus && !matchStatus.is_complete && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-primary font-medium">
                Procesando match… {matchStatus.matched}/{matchStatus.total_candidates}
              </span>
              <span className="text-muted-foreground">{matchStatus.progress_pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${matchStatus.progress_pct}%` }}
              />
            </div>
          </div>
        )}

        {progress?.stage === "CV_PROCESSING" && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            Analizando CVs… {progress.counts.cv_processed}/{progress.counts.total_cvs} completados
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
          {process.budget_max_usd > 0 ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border/60 bg-muted/30 text-xs">
              <span className="text-muted-foreground font-medium">Presupuesto máximo:</span>
              <span className="font-bold text-foreground font-mono">
                ${process.budget_max_usd.toFixed(2)} USD
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <a
              href={`/dl/export/ranking/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/60 bg-background/80 hover:bg-accent text-xs font-semibold text-foreground transition cursor-pointer shadow-xs"
            >
              <FileDown className="h-3.5 w-3.5 text-primary" /> Exportar ranking
            </a>
            <a
              href={`/dl/export/costs/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/60 bg-background/80 hover:bg-accent text-xs font-semibold text-foreground transition cursor-pointer shadow-xs"
            >
              <FileDown className="h-3.5 w-3.5 text-primary" /> Exportar costos
            </a>
          </div>
        </div>
      </GlassCard>

      <div className="flex items-center gap-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && (
        <DashboardTab
          processId={id}
          budgetMax={process.budget_max_usd}
          profilingRuns={profilingRuns}
          progress={progress}
        />
      )}

      {tab === "Ranking de candidatos" && (
        <RankingTab
          processId={id}
          candidates={candidates}
          latestRunByPc={latestRunByPc}
          pipelineByPc={pipelineByPc}
          hasQuestionSet={!!process.question_set_id}
          selected={selected}
          setSelected={setSelected}
          onOpenDrawer={setDrawerCandidate}
          onOpenProfilingModal={setProfilingModalRun}
          onActivateProfiling={(ids) => profilingMutation.mutate(ids)}
          activating={profilingMutation.isPending}
          onPreviewNormalized={(c) => {
            setPreviewData({
              title: c.name,
              url: `/dl/cv-normalized/${id}/${c.process_candidate_id}`,
            });
          }}
          onEditCandidate={setEditingCandidate}
          onDeleteCandidate={setDeletingCandidate}
        />
      )}

      {tab === "Kanban" && (
        <PipelineBoard
          items={pipelineData?.candidates ?? []}
          includeCvMatch
          onOpenLatest={openLatestRun}
          onOpenHistory={setHistoryCandidate}
          onRetry={(item) => profilingMutation.mutate([item.process_candidate_id])}
          onCancel={(item) => cancelProfilingMutation.mutate(item)}
          actionPending={profilingMutation.isPending || cancelProfilingMutation.isPending}
        />
      )}

      {tab === "Configuración" && <ConfigTab processId={id} process={process} />}

      {drawerCandidate && (
        <CandidatoDrawer
          processId={id}
          candidate={drawerCandidate}
          latestRun={latestRunByPc.get(drawerCandidate.process_candidate_id) ?? null}
          onClose={() => setDrawerCandidate(null)}
          onOpenProfilingModal={setProfilingModalRun}
          onPreviewNormalized={(c) => {
            setPreviewData({
              title: c.name,
              url: `/dl/cv-normalized/${id}/${c.process_candidate_id}`,
            });
          }}
          onPreviewOriginal={(c) => {
            setPreviewData({
              title: `${c.name} (Original)`,
              url: `/dl/cv/${id}/${c.process_candidate_id}`,
            });
          }}
          onEditCandidate={setEditingCandidate}
          onDeleteCandidate={setDeletingCandidate}
        />
      )}

      <EditCandidateModal
        isOpen={!!editingCandidate}
        onClose={() => setEditingCandidate(null)}
        processId={id}
        candidate={editingCandidate}
      />

      <DeleteCandidateModal
        isOpen={!!deletingCandidate}
        onClose={() => setDeletingCandidate(null)}
        processId={id}
        candidate={deletingCandidate}
      />

      <CloseProcessConfirmModal
        isOpen={closeProcessModalOpen}
        onClose={() => setCloseProcessModalOpen(false)}
        onConfirm={() => {
          statusMutation.mutate("CLOSED", {
            onSuccess: () => setCloseProcessModalOpen(false),
          });
        }}
        isPending={statusMutation.isPending}
        processName={process?.name ?? "este proceso"}
      />

      <ProfilingResultModal
        run={profilingModalRun}
        open={!!profilingModalRun}
        onClose={() => setProfilingModalRun(null)}
      />

      <ProfilingHistoryDialog
        candidate={historyCandidate}
        onClose={() => setHistoryCandidate(null)}
        onSelect={(run) => {
          setHistoryCandidate(null);
          setProfilingModalRun(run);
        }}
      />

      <PdfPreviewModal
        isOpen={!!previewData}
        onClose={() => setPreviewData(null)}
        title={previewData?.title ?? ""}
        fileUrl={previewData?.url ?? ""}
      />

      <UploadCvsModal processId={id} open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

const PIE_COLORS: Record<string, string> = {
  HIGH: "#22c55e",
  MEDIUM: "#eab308",
  LOW: "#ef4444",
  NOT_RECOMMENDED: "#94a3b8",
};

function DashboardTab({
  processId,
  budgetMax,
  profilingRuns,
  progress,
}: {
  processId: string;
  budgetMax: number;
  profilingRuns: ProfilingRunOut[];
  progress?: ProcessProgressResponse;
}) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["process-metrics", processId],
    queryFn: () => getProcessMetrics({ data: { processId } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  if (isLoading || !metrics || !progress) {
    return <LoadingIndicator className="py-16" label="Cargando métricas…" />;
  }

  const counts = progress?.counts;
  const procesados = counts?.cv_processed ?? 0;
  const conError = counts?.cv_errors ?? 0;
  const pendientes = counts?.cv_pending ?? 0;

  const pieData = Object.entries(metrics.match_distribution).map(([k, v]) => ({
    name: MATCH_CATEGORY_LABEL[k as MatchCategory],
    value: v,
    key: k,
  }));

  const avanceCounts: Record<AdvancementProbability, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const r of profilingRuns) {
    if (r.advancement_probability) avanceCounts[r.advancement_probability]++;
  }
  const avanceData = (Object.keys(avanceCounts) as AdvancementProbability[]).map((k) => ({
    name: ADVANCEMENT_PROBABILITY_LABEL[k],
    value: avanceCounts[k],
  }));

  const budgetPct = budgetMax > 0 ? Math.min(100, (metrics.total_cost_usd / budgetMax) * 100) : 0;

  return (
    <div className="space-y-6">
      {budgetMax > 0 && budgetPct >= 80 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 text-sm text-warning-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Este proceso alcanzó el{" "}
          {budgetPct.toFixed(0)}% de su presupuesto.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total CVs", value: counts?.total_cvs ?? metrics.total_cvs },
          { label: "Procesados", value: procesados },
          { label: "Con error", value: conError },
          { label: "Pendientes", value: pendientes },
        ].map((k) => (
          <GlassCard key={k.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-2xl font-bold">{k.value}</div>
          </GlassCard>
        ))}
        {[
          { label: "Costo acumulado", value: `$${metrics.total_cost_usd.toFixed(2)}` },
          {
            label: "Costo prom./CV",
            value:
              metrics.total_cvs > 0
                ? `$${(metrics.total_cost_usd / metrics.total_cvs).toFixed(3)}`
                : "—",
          },
        ].map((k) => (
          <GlassCard key={k.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-2xl font-bold">{k.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <div className="text-sm font-semibold mb-3">Distribución de match</div>
          {pieData.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              Sin datos de match aún.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={PIE_COLORS[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-sm font-semibold mb-3">Posibilidad de avance (profiling)</div>
          {profilingRuns.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              Sin profiling iniciado.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={avanceData}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(248 100% 68%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      {budgetMax > 0 && (
        <GlassCard className="p-5">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold">Consumo de presupuesto</span>
            <span className="text-muted-foreground">
              ${metrics.total_cost_usd.toFixed(2)} de ${budgetMax.toFixed(2)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budgetPct >= 100 ? "bg-destructive" : budgetPct >= 80 ? "bg-warning" : "bg-primary",
              )}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-5">
        <div className="text-sm font-semibold mb-3">Costo por categoría</div>
        {metrics.total_cost_usd === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            Sin costos registrados aún.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                ["voz", "Voz (ElevenLabs)"],
                ["twilio", "Twilio (telefonía)"],
                ["whatsapp", "WhatsApp"],
                ["llm", "LLM (OpenAI)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <div className="mt-1 text-lg font-bold tabular-nums">
                  ${metrics.cost_by_category[key].toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Edit & Delete Candidate Modals ─────────────────────────────────────────

function EditCandidateModal({
  isOpen,
  onClose,
  processId,
  candidate,
}: {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  candidate: CandidateListItem | null;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (candidate) {
      setName(candidate.name ?? "");
      setEmail(candidate.email ?? "");
      setPhone(candidate.phone ?? "");
      setCity(candidate.city ?? "");
    }
  }, [candidate]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCandidate({
        data: {
          processId,
          pcId: candidate!.process_candidate_id,
          name,
          email,
          phone,
          city,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates", processId] });
      qc.invalidateQueries({
        queryKey: ["candidate-detail", processId, candidate?.process_candidate_id],
      });
      toast.success("Candidato actualizado con éxito");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error al actualizar candidato");
    },
  });

  if (!isOpen || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 cursor-default p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Editar Candidato</h3>
              <p className="text-xs text-slate-500">Actualiza la información del perfil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Ubicación</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Medellín, Colombia"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {updateMutation.isPending ? "Guardando…" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCandidateModal({
  isOpen,
  onClose,
  processId,
  candidate,
}: {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  candidate: CandidateListItem | null;
}) {
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteCandidate({
        data: {
          processId,
          pcId: candidate!.process_candidate_id,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates", processId] });
      toast.success("Candidato eliminado del proceso");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error al eliminar candidato");
    },
  });

  if (!isOpen || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 cursor-default p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 shrink-0 mt-0.5">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar candidato?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong className="text-slate-800">{candidate.name}</strong> de este proceso de
              selección? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {deleteMutation.isPending ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseProcessConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  processName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  processName: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 cursor-default p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 shrink-0 mt-0.5">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">¿Cerrar este proceso?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Estás a punto de cerrar el proceso{" "}
              <strong className="text-slate-800">{processName}</strong>. Al cerrarlo no se podrán
              ejecutar más análisis de match ni llamadas de profiling automáticamente.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isPending ? "Cerrando…" : "Sí, cerrar proceso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ranking Tab ────────────────────────────────────────────────────────────

const RANKING_PAGE_SIZE = 10;

function RankingTab({
  processId,
  candidates,
  latestRunByPc,
  pipelineByPc,
  hasQuestionSet,
  selected,
  setSelected,
  onOpenDrawer,
  onOpenProfilingModal,
  onActivateProfiling,
  activating,
  onPreviewNormalized,
  onEditCandidate,
  onDeleteCandidate,
}: {
  processId: string;
  candidates: CandidateListItem[];
  latestRunByPc: Map<string, ProfilingRunOut>;
  pipelineByPc: Map<string, PipelineCandidate>;
  hasQuestionSet: boolean;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  onOpenDrawer: (c: CandidateListItem) => void;
  onOpenProfilingModal: (r: ProfilingRunOut) => void;
  onActivateProfiling: (ids: string[]) => void;
  activating: boolean;
  onPreviewNormalized?: (c: CandidateListItem) => void;
  onEditCandidate?: (c: CandidateListItem) => void;
  onDeleteCandidate?: (c: CandidateListItem) => void;
}) {
  const [subView, setSubView] = useState<"match" | "profiling">("match");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleSubViewChange = (v: "match" | "profiling") => {
    setSubView(v);
    setPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleQuickFilterChange = (v: string | null) => {
    setQuickFilter(v);
    setPage(1);
  };

  const toggleSelect = (pcId: string) => {
    const next = new Set(selected);
    if (next.has(pcId)) next.delete(pcId);
    else next.add(pcId);
    setSelected(next);
  };

  const matchFiltered = useMemo(() => {
    return candidates.filter((c) => {
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.email.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (quickFilter === "high" && c.match_category !== "HIGH") return false;
      if (quickFilter === "medium" && c.match_category !== "MEDIUM") return false;
      if (
        quickFilter === "calling" &&
        !["PROFILING_CALLING", "PROFILING_QUEUED"].includes(c.status)
      )
        return false;
      if (quickFilter === "completed" && c.status !== "PROFILING_COMPLETED") return false;
      return true;
    });
  }, [candidates, search, quickFilter]);

  const profilingCandidates = useMemo(() => {
    return candidates.filter((c) =>
      [
        "SELECTED_FOR_PROFILING",
        "PROFILING_QUEUED",
        "PROFILING_CALLING",
        "PROFILING_COMPLETED",
        "PROFILING_FAILED",
      ].includes(c.status),
    );
  }, [candidates]);

  const currentList = subView === "match" ? matchFiltered : profilingCandidates;
  const totalPages = Math.ceil(currentList.length / RANKING_PAGE_SIZE) || 1;

  const paginatedCandidates = useMemo(() => {
    const start = (page - 1) * RANKING_PAGE_SIZE;
    return currentList.slice(start, start + RANKING_PAGE_SIZE);
  }, [currentList, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["match", "profiling"] as const).map((v) => (
          <button
            key={v}
            onClick={() => handleSubViewChange(v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
              subView === v
                ? "bg-primary text-primary-foreground"
                : "bg-background/60 border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "match" ? "Match" : "Profiling"}
          </button>
        ))}
      </div>

      {subView === "match" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar candidato…"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {[
              { k: "high", l: "Match alto" },
              { k: "medium", l: "Match medio" },
              { k: "calling", l: "En llamada" },
              { k: "completed", l: "Completado" },
            ].map((f) => (
              <button
                key={f.k}
                onClick={() => handleQuickFilterChange(quickFilter === f.k ? null : f.k)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer",
                  quickFilter === f.k
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background/60 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f.l}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => onActivateProfiling([...selected])}
              disabled={!hasQuestionSet || selected.size === 0 || activating}
              title={
                !hasQuestionSet
                  ? "Asigna un set de preguntas al proceso para habilitar profiling"
                  : undefined
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5" /> Activar profiling ({selected.size})
            </button>
          </div>
          {selected.size > 4 && (
            <div className="text-xs text-warning-foreground bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
              Las llamadas se encolarán — máximo 4 simultáneas.
            </div>
          )}

          <GlassCard className="p-0 overflow-hidden">
            {matchFiltered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {candidates.length === 0
                  ? "No hay candidatos. Sube CVs para comenzar."
                  : "Sin resultados para los filtros aplicados."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                        <th className="px-4 py-3"></th>
                        <th className="text-left font-medium px-3 py-3">Candidato</th>
                        <th className="text-left font-medium px-3 py-3">Match</th>
                        <th className="text-left font-medium px-3 py-3">Categoría</th>
                        <th className="text-left font-medium px-3 py-3">Ciudad</th>
                        <th className="text-left font-medium px-3 py-3">WhatsApp</th>
                        <th className="text-left font-medium px-3 py-3">Profiling</th>
                        <th className="text-left font-medium px-3 py-3">Avance</th>
                        <th className="text-right font-medium px-3 py-3">Costo</th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCandidates.map((c) => {
                        const run = latestRunByPc.get(c.process_candidate_id);
                        return (
                          <tr
                            key={c.process_candidate_id}
                            onClick={() => onOpenDrawer(c)}
                            className="cursor-pointer border-t border-border/30 hover:bg-accent/30 transition"
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selected.has(c.process_candidate_id)}
                                onChange={() => toggleSelect(c.process_candidate_id)}
                                className="h-3.5 w-3.5"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-bold">
                                  {initials(c.name)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{c.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {c.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <MatchRing pct={c.match_percentage} category={c.match_category} />
                            </td>
                            <td className="px-3 py-3">
                              {c.match_category ? (
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded-md text-[10px] font-semibold",
                                    CATEGORY_COLOR[c.match_category].bg,
                                    CATEGORY_COLOR[c.match_category].text,
                                  )}
                                >
                                  {MATCH_CATEGORY_LABEL[c.match_category]}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-muted-foreground text-xs">
                              {c.city ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              <WhatsAppConsentBadge status={c.whatsapp_consent} />
                            </td>
                            <td className="px-3 py-3 text-xs">
                              {pipelineByPc.get(c.process_candidate_id)?.state_label ??
                                CANDIDATE_STATUS_LABEL[c.status]}
                            </td>
                            <td className="px-3 py-3 text-xs">
                              {run?.advancement_probability
                                ? ADVANCEMENT_PROBABILITY_LABEL[run.advancement_probability]
                                : "—"}
                            </td>
                            <td className="px-3 py-3 text-xs text-right tabular-nums text-muted-foreground">
                              {c.total_cost > 0 ? `$${c.total_cost.toFixed(4)}` : "—"}
                            </td>
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                {c.normalized_cv_url && onPreviewNormalized && (
                                  <button
                                    onClick={() => onPreviewNormalized(c)}
                                    className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition cursor-pointer"
                                    title="Ver CV normalizado (PDF)"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onOpenDrawer(c)}
                                  className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition cursor-pointer"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                                {onEditCandidate && (
                                  <button
                                    onClick={() => onEditCandidate(c)}
                                    className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition cursor-pointer text-muted-foreground hover:text-foreground"
                                    title="Editar candidato"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {onDeleteCandidate && (
                                  <button
                                    onClick={() => onDeleteCandidate(c)}
                                    className="h-7 w-7 grid place-items-center rounded-md hover:bg-rose-500/10 transition cursor-pointer text-muted-foreground hover:text-rose-600"
                                    title="Eliminar candidato del proceso"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 text-xs text-muted-foreground">
                    <div>
                      Mostrando {(page - 1) * RANKING_PAGE_SIZE + 1} -{" "}
                      {Math.min(page * RANKING_PAGE_SIZE, currentList.length)} de{" "}
                      {currentList.length} candidatos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-foreground cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                      </button>
                      <span className="px-2 font-semibold text-foreground">
                        Página {page} de {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-foreground cursor-pointer"
                      >
                        Siguiente <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          {profilingCandidates.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay candidatos en profiling.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                      <th className="text-left font-medium px-4 py-3">Candidato</th>
                      <th className="text-left font-medium px-3 py-3">Estado de llamada</th>
                      <th className="text-left font-medium px-3 py-3">Insights</th>
                      <th className="text-left font-medium px-3 py-3">Avance</th>
                      <th className="text-right font-medium px-3 py-3">Costo</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map((c) => {
                      const run = latestRunByPc.get(c.process_candidate_id);
                      return (
                        <tr
                          key={c.process_candidate_id}
                          onClick={() => onOpenDrawer(c)}
                          className="cursor-pointer border-t border-border/30 hover:bg-accent/30 transition"
                        >
                          <td className="px-4 py-3 font-medium">{c.name}</td>
                          <td className="px-3 py-3 text-xs">
                            {pipelineByPc.get(c.process_candidate_id)?.state_label ??
                              CANDIDATE_STATUS_LABEL[c.status]}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs truncate">
                            {run?.transcript_summary ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-xs">
                            {run?.advancement_probability
                              ? ADVANCEMENT_PROBABILITY_LABEL[run.advancement_probability]
                              : "—"}
                          </td>
                          <td className="px-3 py-3 text-xs text-right tabular-nums text-muted-foreground">
                            {c.total_cost > 0 ? `$${c.total_cost.toFixed(4)}` : "—"}
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            {run && run.status === "COMPLETED" && (
                              <button
                                onClick={() => onOpenProfilingModal(run)}
                                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="h-3 w-3" /> Ver resultado
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 text-xs text-muted-foreground">
                  <div>
                    Mostrando {(page - 1) * RANKING_PAGE_SIZE + 1} -{" "}
                    {Math.min(page * RANKING_PAGE_SIZE, currentList.length)} de {currentList.length}{" "}
                    candidatos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-foreground cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                    </button>
                    <span className="px-2 font-semibold text-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-foreground cursor-pointer"
                    >
                      Siguiente <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ─── Kanban Tab ─────────────────────────────────────────────────────────────

const PIPELINE_COLUMNS: { key: string; label: string; statuses: CandidateStatus[] }[] = [
  {
    key: "cv",
    label: "CV / Match",
    statuses: [
      "LOADED",
      "CV_PROCESSING",
      "CV_ERROR",
      "MATCH_PENDING",
      "MATCH_PROCESSING",
      "MATCHED",
      "DISCARDED",
    ],
  },
  {
    key: "selected",
    label: "Seleccionado",
    statuses: ["SELECTED_FOR_PROFILING", "PROFILING_QUEUED"],
  },
  {
    key: "calling",
    label: "En Profiling",
    statuses: ["PROFILING_CALLING"],
  },
  {
    key: "done",
    label: "Profiling finalizado",
    statuses: ["PROFILING_COMPLETED", "PROFILING_FAILED"],
  },
];

const AVANCE_COLUMNS: { key: AdvancementProbability; label: string; color: string }[] = [
  { key: "HIGH", label: "Alta", color: "border-success/40 bg-success/5" },
  { key: "MEDIUM", label: "Media", color: "border-warning/40 bg-warning/5" },
  { key: "LOW", label: "Baja", color: "border-destructive/40 bg-destructive/5" },
];

function KanbanTab({
  candidates,
  latestRunByPc,
  onOpenDrawer,
}: {
  candidates: CandidateListItem[];
  latestRunByPc: Map<string, ProfilingRunOut>;
  onOpenDrawer: (c: CandidateListItem) => void;
}) {
  const [view, setView] = useState<"pipeline" | "avance">("pipeline");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["pipeline", "avance"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
              view === v
                ? "bg-primary text-primary-foreground"
                : "bg-background/60 border border-border text-muted-foreground",
            )}
          >
            {v === "pipeline" ? "Pipeline" : "Avance"}
          </button>
        ))}
      </div>

      {view === "pipeline" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PIPELINE_COLUMNS.map((col) => {
            const items = candidates.filter((c) => col.statuses.includes(c.status));
            return (
              <div key={col.key} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {items.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8 rounded-xl border border-dashed border-border">
                      Vacío
                    </div>
                  ) : (
                    items.map((c) => (
                      <GlassCard
                        key={c.process_candidate_id}
                        className="p-3 cursor-pointer"
                        onClick={() => onOpenDrawer(c)}
                      >
                        <div className="font-medium text-sm truncate">{c.name}</div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-muted-foreground">{c.email}</span>
                          {c.match_category && (
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                                CATEGORY_COLOR[c.match_category].bg,
                                CATEGORY_COLOR[c.match_category].text,
                              )}
                            >
                              {Math.round(c.match_percentage)}%
                            </span>
                          )}
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AVANCE_COLUMNS.map((col) => {
            const items = candidates.filter(
              (c) => latestRunByPc.get(c.process_candidate_id)?.advancement_probability === col.key,
            );
            return (
              <div key={col.key} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div className={cn("space-y-2 min-h-[100px] rounded-xl border p-2", col.color)}>
                  {items.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">Vacío</div>
                  ) : (
                    items.map((c) => (
                      <GlassCard
                        key={c.process_candidate_id}
                        className="p-3 cursor-pointer"
                        onClick={() => onOpenDrawer(c)}
                      >
                        <div className="font-medium text-sm truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.email}</div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Configuración Tab ──────────────────────────────────────────────────────

function ConfigTab({
  processId,
  process,
}: {
  processId: string;
  process: NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof getProcess>>>>["data"]>;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(process.name);
  const [jobTitle, setJobTitle] = useState(process.job_title);
  const [area, setArea] = useState(process.area);
  const [seniority, setSeniority] = useState(process.seniority);
  const [budget, setBudget] = useState(String(process.budget_max_usd || ""));
  const [selectedSetId, setSelectedSetId] = useState(process.question_set_id ?? "");
  const [voicePrompt, setVoicePrompt] = useState(process.voice_override_system_prompt ?? "");
  const [voiceGreeting, setVoiceGreeting] = useState(process.voice_override_first_message ?? "");
  const [jdAnalysis, setJdAnalysis] = useState<ParseJDResponse | null>(null);
  const [jdText, setJdText] = useState(process.job_description?.jd_raw_text ?? "");

  const { data: questionSets } = useQuery({
    queryKey: ["question-sets"],
    queryFn: () => getQuestionSets(),
  });
  const { data: jds } = useQuery({
    queryKey: ["job-descriptions", processId],
    queryFn: () => getJobDescriptions({ data: { processId } }),
  });

  const isActive = process.status !== "CLOSED" && process.status !== "ARCHIVED";

  const updateBasicsMutation = useMutation({
    mutationFn: () =>
      updateProcess({
        data: {
          processId,
          name,
          job_title: jobTitle,
          area,
          seniority,
          budget_max_usd: budget ? Number(budget) : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Datos actualizados");
      qc.invalidateQueries({ queryKey: ["process", processId] });
      qc.invalidateQueries({ queryKey: ["process-progress", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  const assignSetMutation = useMutation({
    mutationFn: () => assignQuestionSet({ data: { processId, questionSetId: selectedSetId } }),
    onSuccess: () => {
      toast.success("Set de preguntas asignado");
      qc.invalidateQueries({ queryKey: ["process", processId] });
      qc.invalidateQueries({ queryKey: ["process-progress", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo asignar"),
  });

  const voiceMutation = useMutation({
    mutationFn: () =>
      updateVoiceConfig({
        data: {
          processId,
          voice_override_system_prompt: voicePrompt || null,
          voice_override_first_message: voiceGreeting || null,
        },
      }),
    onSuccess: () => {
      toast.success("Configuración de voz guardada");
      qc.invalidateQueries({ queryKey: ["process", processId] });
      qc.invalidateQueries({ queryKey: ["process-progress", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  const analyzeJDMutation = useMutation({
    mutationFn: () => parseJobDescription({ data: { processId, jdRawText: jdText } }),
    onSuccess: (res) => {
      setJdAnalysis(res);
      if (res.enhanced_jd) setJdText(res.enhanced_jd);
      toast.success("JD analizada y enriquecida por IA", {
        description: "La versión mejorada ya está en el campo de texto — puedes editarla.",
      });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo analizar la JD"),
  });

  const saveJDMutation = useMutation({
    mutationFn: () => createJobDescription({ data: { processId, jdRawText: jdText } }),
    onSuccess: () => {
      toast.success("Nueva versión de la JD guardada");
      setJdAnalysis(null);
      qc.invalidateQueries({ queryKey: ["job-descriptions", processId] });
      qc.invalidateQueries({ queryKey: ["process", processId] });
      qc.invalidateQueries({ queryKey: ["process-progress", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la JD"),
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <GlassCard className="p-5 space-y-4">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" /> Datos básicos
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nombre
            </label>
            <input
              disabled={!isActive}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cargo
            </label>
            <input
              disabled={!isActive}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Área
            </label>
            <input
              disabled={!isActive}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Seniority
            </label>
            <input
              disabled={!isActive}
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Presupuesto máx. USD
            </label>
            <input
              disabled={!isActive}
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
            />
          </div>
        </div>
        <button
          onClick={() => updateBasicsMutation.mutate()}
          disabled={!isActive || updateBasicsMutation.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
        >
          {updateBasicsMutation.isPending ? "Guardando…" : "Guardar cambios"}
        </button>
        {!isActive && (
          <p className="text-xs text-muted-foreground">
            Proceso {PROCESS_STATUS_LABEL[process.status].toLowerCase()} — no se puede editar.
          </p>
        )}
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="text-sm font-semibold">Job Description</div>
        {jds && jds.length > 0 ? (
          <div className="space-y-1.5">
            {jds.map((jd) => (
              <div
                key={jd.jd_id}
                className="text-xs px-3 py-2 rounded-lg bg-background/50 border border-border"
              >
                <span className="font-medium">v{jd.version}</span> — {jd.text_preview}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin JD aún.</p>
        )}

        <textarea
          disabled={!isActive}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Pega aquí la descripción del cargo…"
          className="w-full min-h-[140px] rounded-xl bg-background/70 border border-border p-3 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => saveJDMutation.mutate()}
            disabled={!isActive || jdText.trim().length < 10 || saveJDMutation.isPending}
            className="px-3 py-1.5 rounded-lg border border-border bg-background/60 text-xs font-medium disabled:opacity-40"
          >
            {saveJDMutation.isPending ? "Guardando…" : "Guardar como nueva versión"}
          </button>
          <button
            onClick={() => analyzeJDMutation.mutate()}
            disabled={!isActive || jdText.trim().length < 10 || analyzeJDMutation.isPending}
            className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary bg-primary/5 text-xs font-medium disabled:opacity-40"
          >
            {analyzeJDMutation.isPending ? "Analizando…" : "Analizar y enriquecer con IA"}
          </button>
        </div>

        {jdAnalysis && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            {[
              {
                l: "Requisitos obligatorios",
                c: jdAnalysis.must_have,
                color: "bg-primary/15 text-primary",
              },
              {
                l: "Deseables",
                c: jdAnalysis.nice_to_have,
                color: "bg-info/30 text-info-foreground",
              },
              {
                l: "Criterios excluyentes",
                c: jdAnalysis.deal_breakers,
                color: "bg-destructive/15 text-destructive",
              },
            ].map(
              (g) =>
                g.c.length > 0 && (
                  <div key={g.l}>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      {g.l}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.c.map((x) => (
                        <span
                          key={x}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium ${g.color}`}
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                ),
            )}
            {(jdAnalysis.recommendations.length > 0 || jdAnalysis.missing_elements.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {jdAnalysis.recommendations.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Recomendaciones
                    </div>
                    <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                      {jdAnalysis.recommendations.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {jdAnalysis.missing_elements.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Elementos faltantes
                    </div>
                    <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                      {jdAnalysis.missing_elements.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              La versión mejorada ya se cargó arriba en el campo de texto — edítala y luego "Guardar
              como nueva versión".
            </p>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="text-sm font-semibold">Set de preguntas de profiling</div>

        {process.question_set_id ? (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-primary">Set asignado</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Copia única para este proceso. Edítala sin afectar la plantilla original.
              </p>
            </div>
            <Link
              to="/app/sets/$id"
              params={{ id: process.question_set_id }}
              search={{ processId }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap shadow-md shadow-primary/20"
            >
              Editar preguntas
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Aún no hay preguntas. Elige una plantilla base para comenzar a perfilar candidatos.
          </p>
        )}

        <div className="pt-2 border-t border-border/40">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {process.question_set_id
              ? "Reemplazar con otra plantilla base:"
              : "Seleccionar plantilla base:"}
          </div>
          <div className="flex items-center gap-2">
            <AppSelect
              value={
                selectedSetId === process.question_set_id || !selectedSetId ? "none" : selectedSetId
              }
              onValueChange={(value) => setSelectedSetId(value === "none" ? "" : value)}
              disabled={!isActive}
              className="flex-1"
            >
              <AppSelectItem value="none">— Selecciona una plantilla —</AppSelectItem>
              {(questionSets?.question_sets ?? [])
                .filter((qs) => qs.status === "ACTIVE")
                .map((qs) => (
                  <AppSelectItem key={qs.id} value={qs.id}>
                    {qs.name}
                  </AppSelectItem>
                ))}
            </AppSelect>
            <button
              onClick={() => assignSetMutation.mutate()}
              disabled={
                !isActive ||
                !selectedSetId ||
                selectedSetId === process.question_set_id ||
                assignSetMutation.isPending
              }
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
            >
              {process.question_set_id ? "Reemplazar" : "Asignar"}
            </button>
          </div>
          {!process.question_set_id && (
            <div className="mt-2 text-right">
              <Link to="/app/sets/nuevo" className="text-xs text-primary hover:underline">
                Crear nueva plantilla base
              </Link>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="text-sm font-semibold">Configuración de voz (override del proceso)</div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            System prompt
          </label>
          <textarea
            disabled={!isActive}
            value={voicePrompt}
            onChange={(e) => setVoicePrompt(e.target.value)}
            className="mt-1.5 w-full min-h-[80px] px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Primer saludo
          </label>
          <input
            disabled={!isActive}
            value={voiceGreeting}
            onChange={(e) => setVoiceGreeting(e.target.value)}
            className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
          />
        </div>
        <button
          onClick={() => voiceMutation.mutate()}
          disabled={!isActive || voiceMutation.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
        >
          {voiceMutation.isPending ? "Guardando…" : "Guardar configuración de voz"}
        </button>
      </GlassCard>
    </div>
  );
}

// ─── Candidato Drawer ───────────────────────────────────────────────────────

function CandidatoDrawer({
  processId,
  candidate,
  latestRun,
  onClose,
  onOpenProfilingModal,
  onPreviewNormalized,
  onPreviewOriginal,
  onEditCandidate,
  onDeleteCandidate,
}: {
  processId: string;
  candidate: CandidateListItem;
  latestRun: ProfilingRunOut | null;
  onClose: () => void;
  onOpenProfilingModal: (r: ProfilingRunOut) => void;
  onPreviewNormalized?: (c: CandidateListItem) => void;
  onPreviewOriginal?: (c: CandidateListItem) => void;
  onEditCandidate?: (c: CandidateListItem) => void;
  onDeleteCandidate?: (c: CandidateListItem) => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [analysisContext, setAnalysisContext] = useState("");
  const [overrideScore, setOverrideScore] = useState("");
  const [notesInit, setNotesInit] = useState(false);
  const [analysisContextInit, setAnalysisContextInit] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["candidate-detail", processId, candidate.process_candidate_id],
    queryFn: () =>
      getCandidateDetail({ data: { processId, pcId: candidate.process_candidate_id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  if (detail && !notesInit) {
    setNotes(detail.human_notes ?? "");
    setOverrideScore(
      detail.human_override_match != null ? String(detail.human_override_match) : "",
    );
    setNotesInit(true);
  }

  if (detail && !analysisContextInit) {
    setAnalysisContext(detail.analysis_context ?? "");
    setAnalysisContextInit(true);
  }

  const overrideMutation = useMutation({
    mutationFn: () =>
      overrideCandidate({
        data: {
          processId,
          pcId: candidate.process_candidate_id,
          human_notes: notes || null,
          human_override_match: overrideScore ? Number(overrideScore) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Guardado");
      qc.invalidateQueries({
        queryKey: ["candidate-detail", processId, candidate.process_candidate_id],
      });
      qc.invalidateQueries({ queryKey: ["candidates", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  const analysisContextMutation = useMutation({
    mutationFn: () =>
      updateCandidateAnalysisContext({
        data: {
          processId,
          pcId: candidate.process_candidate_id,
          analysis_context: analysisContext.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Comentario guardado para el análisis");
      qc.invalidateQueries({
        queryKey: ["candidate-detail", processId, candidate.process_candidate_id],
      });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el comentario"),
  });

  const feedbackMutation = useMutation({
    mutationFn: (evaluation: "CORRECT" | "PARTIAL" | "INCORRECT") =>
      submitFeedback({
        data: {
          processCandidateId: candidate.process_candidate_id,
          context: "MATCH",
          evaluation,
          notes,
        },
      }),
    onSuccess: () => toast.success("Feedback registrado"),
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo registrar"),
  });

  const { data: answersData, isLoading: answersLoading } = useQuery({
    queryKey: ["profiling-answers", latestRun?.id],
    queryFn: () => getProfilingAnswers({ data: { runId: latestRun!.id } }),
    enabled: !!latestRun && latestRun.status === "COMPLETED",
  });

  const breakdown =
    detail?.match?.breakdown && Object.keys(detail.match.breakdown).length > 0
      ? (detail.match.breakdown as MatchBreakdown)
      : null;

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("No se pudo abrir la ventana de exportación PDF.");
      return;
    }

    const strengthsHtml = detail?.match?.strengths.length
      ? detail.match.strengths.map((s) => `<li style="margin-bottom:4px;">${s}</li>`).join("")
      : "<li style='color:#64748b;'>No especificadas</li>";

    const gapsHtml = detail?.match?.gaps.length
      ? detail.match.gaps.map((g) => `<li style="margin-bottom:4px;">${g}</li>`).join("")
      : "<li style='color:#64748b;'>Sin brechas destacadas</li>";

    const breakdownHtml = breakdown
      ? (Object.keys(BREAKDOWN_LABELS) as (keyof MatchBreakdown)[])
          .map((key) => {
            const item = breakdown[key];
            if (!item) return "";
            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 12px; font-weight: 500; color: #334155;">${BREAKDOWN_LABELS[key]}</td>
                <td style="padding: 8px 12px; text-align: center; color: #64748b;">${item.weight}%</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #4338ca;">${item.raw_score}%</td>
              </tr>
            `;
          })
          .join("")
      : "<tr><td colspan='3' style='padding:10px; color:#64748b;'>Sin desglose disponible</td></tr>";

    const answersHtml = answersData?.answers.length
      ? answersData.answers
          .map(
            (a) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; background-color: #ffffff;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span>${a.question.is_critical ? "[CRÍTICA] " : ""}${a.question.text}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${a.requires_review ? "#b45309" : "#166534"}; border: 1px solid ${a.requires_review ? "#fde68a" : "#a7f3d0"}; padding: 2px 6px; border-radius: 4px; background: transparent;">
              ${a.requires_review ? "Revisión" : "✓ OK"}
            </span>
          </div>
          <div style="font-size: 12px; color: #334155; background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; line-height: 1.5;">
            <strong>Respuesta:</strong> ${cleanAnswerText(a.normalized_answer, a.transcription)}
          </div>
        </div>
      `,
          )
          .join("")
      : "<p style='color: #64748b; font-size: 12px;'>Sin respuestas de profiling registradas.</p>";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Match - ${candidate.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.4; font-size: 12px; padding: 10px; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .subtitle { font-size: 12px; color: #64748b; margin: 0; }
          .badge-category { font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; display: inline-block; }
          .match-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .match-score { font-size: 32px; font-weight: 800; color: #4338ca; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 20px 0 10px 0; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .box-green { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          .box-red { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          ul { margin: 4px 0 0 16px; padding: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
          th { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; padding: 8px 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${candidate.name}</h1>
            <p class="subtitle">${candidate.email} ${candidate.phone ? " • " + candidate.phone : ""} ${candidate.city ? " • " + candidate.city : ""}</p>
          </div>
          <div>
            <span class="badge-category">
              ${candidate.match_category ? (MATCH_CATEGORY_LABEL[candidate.match_category] ?? candidate.match_category) : "Sin Categoría"}
            </span>
          </div>
        </div>

        <div class="match-card">
          <div style="flex: 1; padding-right: 16px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #4338ca; margin-bottom: 2px;">Análisis de Compatibilidad AI</div>
            <div style="font-size: 12px; color: #334155;">${detail?.match?.summary ?? "Compatibilidad calculada con base en el perfil del cargo."}</div>
          </div>
          <div class="match-score">${detail?.match?.percentage ?? 0}%</div>
        </div>

        <div class="grid-2">
          <div class="box-green">
            <div style="font-weight: 700; color: #166534; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Fortalezas Principales</div>
            <ul style="color: #334155;">${strengthsHtml}</ul>
          </div>
          <div class="box-red">
            <div style="font-weight: 700; color: #dc2626; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Brechas Identificadas</div>
            <ul style="color: #334155;">${gapsHtml}</ul>
          </div>
        </div>

        <div class="section-title">Desglose por Criterios de Evaluación</div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Criterio</th>
              <th style="text-align: center;">Peso Ponderado</th>
              <th style="text-align: right;">Puntaje</th>
            </tr>
          </thead>
          <tbody>
            ${breakdownHtml}
          </tbody>
        </table>

        ${
          latestRun
            ? `
          <div class="section-title">Entrevista de Profiling de Voz</div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Dictamen de Evaluación:</div>
            <div style="color: #334155; margin-bottom: 6px;">${latestRun.advancement_explanation ?? "Entrevista completada."}</div>
            <div style="font-size: 11px; color: #64748b;">
              <strong>Estado de Avance:</strong> ${latestRun.advancement_probability ? (ADVANCEMENT_PROBABILITY_LABEL[latestRun.advancement_probability] ?? latestRun.advancement_probability) : "—"}
            </div>
          </div>

          <div class="section-title">Respuestas Evaluadas de Entrevista</div>
          ${answersHtml}
        `
            : ""
        }
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 cursor-default p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Banner */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 bg-white sticky top-0 z-20 rounded-t-3xl">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary text-white grid place-items-center font-bold text-xl shadow-md">
              {initials(candidate.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {candidate.name}
                </h2>
                {candidate.match_category && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      CATEGORY_COLOR[candidate.match_category].bg,
                      CATEGORY_COLOR[candidate.match_category].text,
                    )}
                  >
                    {MATCH_CATEGORY_LABEL[candidate.match_category]}
                  </span>
                )}
                {latestRun?.advancement_probability && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      ADVANCE_COLOR[latestRun.advancement_probability],
                    )}
                  >
                    Avance: {ADVANCEMENT_PROBABILITY_LABEL[latestRun.advancement_probability]}
                  </span>
                )}
                <WhatsAppConsentBadge status={candidate.whatsapp_consent} />
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-primary" /> {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-primary" /> {candidate.phone}
                  </span>
                )}
                {candidate.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {candidate.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Descargar reporte completo en PDF"
            >
              <Download className="h-3.5 w-3.5" /> Descargar PDF
            </button>
            {onEditCandidate && (
              <button
                onClick={() => {
                  onClose();
                  onEditCandidate(candidate);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Editar candidato"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-500" /> Editar
              </button>
            )}
            {onDeleteCandidate && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteCandidate(candidate);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Eliminar del proceso"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Eliminar
              </button>
            )}
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer shadow-xs ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <span>Cargando expediente del candidato…</span>
          </div>
        ) : (
          <div className="p-6 grid md:grid-cols-2 gap-6 bg-slate-50/50">
            {/* ── Columna izquierda: análisis de match ── */}
            <div className="space-y-5">
              <div className="p-5 space-y-3 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Información adicional para el análisis
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Escribe aquí cualquier dato que ayude a interpretar este CV. Se enviará a la IA
                    junto con la hoja de vida cuando ejecutes el análisis.
                  </div>
                </div>
                <textarea
                  value={analysisContext}
                  onChange={(e) => setAnalysisContext(e.target.value)}
                  disabled={!!detail && !["LOADED", "CV_ERROR"].includes(detail.status)}
                  maxLength={4000}
                  placeholder="Ejemplo: el nombre correcto es Juan Pérez y su número es 3001234567; el documento no lo muestra claramente."
                  className="w-full min-h-[110px] px-3 py-2.5 rounded-xl bg-white border border-primary/20 text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500">
                    {detail?.status === "LOADED" || detail?.status === "CV_ERROR"
                      ? `${analysisContext.length}/4000 caracteres`
                      : "El análisis ya comenzó; este comentario es de solo lectura."}
                  </span>
                  <button
                    type="button"
                    onClick={() => analysisContextMutation.mutate()}
                    disabled={
                      analysisContextMutation.isPending ||
                      !detail ||
                      !["LOADED", "CV_ERROR"].includes(detail.status) ||
                      analysisContext.trim() === (detail.analysis_context ?? "").trim()
                    }
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analysisContextMutation.isPending ? "Guardando…" : "Guardar comentario"}
                  </button>
                </div>
              </div>

              {detail?.match && (
                <div className="p-5 space-y-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Análisis de Match IA</div>
                        <div className="text-[10px] text-slate-500">
                          Compatibilidad automatizada con el perfil
                        </div>
                      </div>
                    </div>
                    <MatchRing
                      pct={detail.match.percentage}
                      category={detail.match.category}
                      size={58}
                    />
                  </div>

                  {detail.match.summary && (
                    <div className="text-xs text-slate-700 leading-relaxed font-normal border-l-2 border-primary pl-3 py-0.5">
                      {detail.match.summary}
                    </div>
                  )}

                  {/* Fortalezas y Brechas - Clean boxes with border */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    {detail.match.strengths.length > 0 && (
                      <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-white space-y-2">
                        <div className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          Fortalezas
                        </div>
                        <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                          {detail.match.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-emerald-600 font-bold">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {detail.match.gaps.length > 0 && (
                      <div className="p-3.5 rounded-xl border border-rose-200/80 bg-white space-y-2">
                        <div className="text-[11px] uppercase tracking-wider text-rose-600 font-bold flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          Brechas
                        </div>
                        <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                          {detail.match.gaps.map((g, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-rose-600 font-bold">•</span> {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Breakdown */}
                  {breakdown && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2.5">
                        Desglose Por Criterio (Breakdown)
                      </div>
                      <div className="space-y-2.5">
                        {(Object.keys(BREAKDOWN_LABELS) as (keyof MatchBreakdown)[]).map((key) => {
                          const item = breakdown[key];
                          if (!item) return null;
                          return (
                            <div key={key} className="text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">
                                  {BREAKDOWN_LABELS[key]}{" "}
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    (Peso {item.weight}%)
                                  </span>
                                </span>
                                <span className="font-bold tabular-nums text-slate-900">
                                  {item.raw_score}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${item.raw_score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documentos CV */}
              {(detail?.candidate.cv_url || detail?.candidate.normalized_cv_url) && (
                <div className="p-5 space-y-3 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Documentos y Hoja de Vida
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {detail.candidate.cv_url && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            CV Original
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {onPreviewOriginal && (
                            <button
                              onClick={() => onPreviewOriginal(candidate)}
                              className="h-7 w-7 grid place-items-center rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-900 cursor-pointer"
                              title="Ver vista previa"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <a
                            href={`/dl/cv/${processId}/${candidate.process_candidate_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 grid place-items-center rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-900"
                            title="Descargar PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {detail.candidate.normalized_cv_url && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-primary/40 bg-white hover:bg-primary/5 transition">
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-primary truncate">
                            CV Normalizado
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {onPreviewNormalized && (
                            <button
                              onClick={() => onPreviewNormalized(candidate)}
                              className="h-7 w-7 grid place-items-center rounded-lg bg-primary/10 hover:bg-primary/20 transition text-primary cursor-pointer"
                              title="Ver formato estructurado"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <a
                            href={`/dl/cv-normalized/${processId}/${candidate.process_candidate_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 grid place-items-center rounded-lg bg-primary/10 hover:bg-primary/20 transition text-primary"
                            title="Descargar PDF estructurado"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Columna derecha: profiling + override ── */}
            <div className="space-y-5">
              {/* Card Profiling */}
              <div className="p-5 space-y-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Respuestas de Profiling (Voz)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Estado: {CANDIDATE_STATUS_LABEL[candidate.status] ?? candidate.status}
                      </div>
                    </div>
                  </div>
                  {latestRun?.status === "COMPLETED" && (
                    <button
                      onClick={() => onOpenProfilingModal(latestRun)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Transcripción
                    </button>
                  )}
                </div>

                {!latestRun ? (
                  <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                    Sin llamada de profiling ejecutada todavía.
                  </div>
                ) : latestRun.status !== "COMPLETED" ? (
                  <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                    La llamada de profiling aún no ha finalizado.
                  </div>
                ) : answersLoading ? (
                  <div className="text-xs text-slate-500 py-6 text-center flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary animate-spin" />
                    <span>Cargando respuestas…</span>
                  </div>
                ) : !answersData?.answers.length ? (
                  <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                    Sin respuestas registradas en esta sesión.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {answersData.answers.map((a) => (
                      <details
                        key={a.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 group transition [&[open]]:bg-slate-50"
                      >
                        <summary className="cursor-pointer text-xs font-semibold flex items-center justify-between gap-2 select-none">
                          <span className="flex items-center gap-1.5 text-slate-800 leading-snug">
                            {a.question.is_critical && (
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            {a.question.text}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border",
                              a.requires_review
                                ? "border-amber-200 text-amber-700 bg-amber-50"
                                : "border-emerald-200 text-emerald-700 bg-transparent",
                            )}
                          >
                            {a.requires_review ? "Revisión" : "✓ OK"}
                          </span>
                        </summary>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                          {cleanAnswerText(a.normalized_answer, a.transcription)}
                        </div>
                        {a.confidence_score !== null && (
                          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  a.confidence_score < 0.7 ? "bg-amber-500" : "bg-emerald-500",
                                )}
                                style={{ width: `${a.confidence_score * 100}%` }}
                              />
                            </div>
                            <span className="text-slate-400 font-medium">
                              Confianza {Math.round(a.confidence_score * 100)}%
                            </span>
                          </div>
                        )}
                      </details>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Override del Recruiter */}
              <div className="p-5 space-y-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Evaluación Manual y Notas del Recruiter
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Score Manual Override (0 - 100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(e.target.value)}
                      placeholder="Usar score de IA"
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => overrideMutation.mutate()}
                      disabled={overrideMutation.isPending}
                      className="w-full py-2 px-4 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
                    >
                      {overrideMutation.isPending ? "Guardando…" : "Guardar Evaluación"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Observaciones y notas internas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribe comentarios u observaciones sobre la entrevista…"
                    className="mt-1 w-full min-h-[75px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-medium text-slate-500">
                    ¿Qué tan preciso fue el análisis de IA?
                  </div>
                  <div className="flex items-center gap-2">
                    {(["CORRECT", "PARTIAL", "INCORRECT"] as const).map((ev) => (
                      <button
                        key={ev}
                        onClick={() => feedbackMutation.mutate(ev)}
                        disabled={feedbackMutation.isPending}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 text-slate-700",
                          ev === "CORRECT"
                            ? "hover:border-emerald-500 hover:text-emerald-600"
                            : ev === "PARTIAL"
                              ? "hover:border-amber-500 hover:text-amber-600"
                              : "hover:border-rose-500 hover:text-rose-600",
                        )}
                      >
                        {ev === "CORRECT" ? (
                          <>
                            <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" /> Correcto
                          </>
                        ) : ev === "PARTIAL" ? (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Parcial
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-3.5 w-3.5 text-rose-600" /> Incorrecto
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
