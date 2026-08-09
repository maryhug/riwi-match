import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Clock,
  History,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { UploadCvsModal } from "@/components/app/UploadCvsModal";
import { ProfilingResultModal } from "@/components/app/ProfilingResultModal";
import { PipelineBoard, ProfilingHistoryDialog } from "@/components/app/PipelineBoard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  createProcessAIPrompt,
  getProcessAIPrompts,
  restoreProcessAIPromptTemplate,
  assignProcessWhatsAppTemplate,
} from "@/lib/api/processes.functions";
import { getSelectableWhatsAppTemplates } from "@/lib/api/whatsapp-templates.functions";
import {
  getCandidates,
  analyzeCVs,
  getCandidateDetail,
  overrideCandidate,
  updateCandidateAnalysisContext,
  updateCandidate,
  deleteCandidate,
  discardCandidate,
  restoreCandidate,
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
  AVAILABILITY_PREFERENCE_LABEL,
  type ProcessStatus,
  type MatchCategory,
  type CandidateStatus,
  type AdvancementProbability,
  type WhatsAppConsentStatus,
  AI_TASK_TYPE_LABEL,
  type AITaskType,
} from "@/lib/types/enums";
import type {
  CandidateListItem,
  MatchBreakdown,
  ProcessProgressResponse,
  ParseJDResponse,
  ProfilingRunOut,
  PipelineCandidate,
  AvailabilityPreference,
  ProcessAIPromptOut,
  ProcessWhatsAppTemplate,
  WhatsAppTemplateOut,
} from "@/lib/types/api";
import { useAuth } from "@/lib/auth-context";
import { cn, cleanAnswerText } from "@/lib/utils";

export const Route = createFileRoute("/app/procesos/$id")({
  head: () => ({ meta: [{ title: "Match" }] }),
  component: Detalle,
});

const tabs = ["Dashboard", "Ranking de candidatos", "Kanban", "Configuración"] as const;
type TabName = (typeof tabs)[number];

function isProfilingRunOut(run: { id: string }): run is ProfilingRunOut {
  return "process_candidate_id" in run && "candidate_name" in run;
}

const VOICE_LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "pt", label: "Portugués" },
];

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

function WhatsAppConsentBadge({ status }: { status?: WhatsAppConsentStatus | null }) {
  if (!status || !WHATSAPP_CONSENT_STYLE[status]) return null;
  const { icon: Icon, className } = WHATSAPP_CONSENT_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold",
        className,
      )}
      title={`Autorización WhatsApp: ${WHATSAPP_CONSENT_STATUS_LABEL[status] ?? ""}`}
    >
      <Icon className="h-3 w-3" />
      {WHATSAPP_CONSENT_STATUS_LABEL[status]}
    </span>
  );
}

function formatAvailability(pref: AvailabilityPreference | null): string | null {
  if (!pref) return null;
  if (pref.preference === "SPECIFIC_WINDOW") {
    const range =
      pref.start_time && pref.end_time ? `${pref.start_time}–${pref.end_time}` : pref.start_time;
    return (
      [pref.date, range].filter(Boolean).join(" · ") ||
      AVAILABILITY_PREFERENCE_LABEL[pref.preference]
    );
  }
  return AVAILABILITY_PREFERENCE_LABEL[pref.preference];
}

function AvailabilityBadge({ pref }: { pref: AvailabilityPreference | null }) {
  const text = formatAvailability(pref);
  if (!text) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {text}
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
  const { data: progress } = useQuery({
    queryKey: ["process-progress", id],
    queryFn: () => getProcessProgress({ data: { processId: id } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const isActiveProcessing =
    progress?.stage === "MATCH_PROCESSING" ||
    progress?.stage === "CV_PROCESSING" ||
    (progress?.counts?.calls_active ?? 0) > 0 ||
    (progress?.counts?.profiling_active ?? 0) > 0;

  const dynamicRefetchInterval = isActiveProcessing ? LIVE_REFRESH_INTERVAL_MS : 15000;

  const { data: process, isLoading: processLoading } = useQuery({
    queryKey: ["process", id],
    queryFn: () => getProcess({ data: { processId: id } }),
    refetchInterval: dynamicRefetchInterval,
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", id],
    queryFn: () => getCandidates({ data: { processId: id } }),
    refetchInterval: dynamicRefetchInterval,
  });

  const { data: profilingRunsData } = useQuery({
    queryKey: ["profiling-runs", id],
    queryFn: () => getProcessProfilingRuns({ data: { processId: id } }),
    refetchInterval: dynamicRefetchInterval,
  });

  const { data: pipelineData } = useQuery({
    queryKey: ["process-pipeline", id],
    queryFn: () => getProcessPipeline({ data: { processId: id } }),
    refetchInterval: dynamicRefetchInterval,
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

  const openProfilingRun = (
    target: PipelineCandidate | ProfilingRunOut | { id: string } | null,
  ) => {
    if (!target) return;
    const run = "latest_run" in target ? target.latest_run : target;
    if (!run) return;
    if (isProfilingRunOut(run)) {
      setProfilingModalRun(run);
      return;
    }
    void getProfilingRunDetail({ data: { runId: run.id } })
      .then(setProfilingModalRun)
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "No se pudo cargar la corrida"),
      );
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 text-sm font-semibold transition cursor-pointer shadow-xs"
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
          onOpenProfilingModal={openProfilingRun}
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
          onOpenLatest={openProfilingRun}
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
          onOpenProfilingModal={openProfilingRun}
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
                ["storage", "Almacenamiento (R2)"],
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
                  ${(metrics.cost_by_category[key] ?? 0).toFixed(4)}
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

/**
 * DISCARDED se revierte desde aquí. MATCHED/PROFILING_FAILED admiten descarte reversible
 * (RB-008, CandidateStateMachine). Cualquier otro estado (profiling en curso/completado,
 * pendiente de match, etc.) no tiene transición válida a DISCARDED — solo se ofrece el
 * borrado físico permanente.
 */
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
  const isDiscarded = candidate?.status === "DISCARDED";
  const canDiscard = candidate?.status === "MATCHED" || candidate?.status === "PROFILING_FAILED";

  const invalidateAndClose = (message: string) => {
    qc.invalidateQueries({ queryKey: ["candidates", processId] });
    toast.success(message);
    onClose();
  };

  const discardMutation = useMutation({
    mutationFn: () =>
      discardCandidate({ data: { processId, pcId: candidate!.process_candidate_id } }),
    onSuccess: () =>
      invalidateAndClose("Candidato descartado del ranking — puedes revertirlo cuando quieras"),
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo descartar el candidato"),
  });

  const restoreMutation = useMutation({
    mutationFn: () =>
      restoreCandidate({ data: { processId, pcId: candidate!.process_candidate_id } }),
    onSuccess: () => invalidateAndClose("Descarte revertido — el candidato vuelve al ranking"),
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo revertir el descarte"),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteCandidate({ data: { processId, pcId: candidate!.process_candidate_id } }),
    onSuccess: () => invalidateAndClose("Candidato eliminado del proceso"),
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Error al eliminar candidato"),
  });

  if (!isOpen || !candidate) return null;

  if (isDiscarded) {
    return (
      <ConfirmActionModal
        onClose={onClose}
        icon={<ThumbsUp className="h-5 w-5" />}
        iconClassName="bg-emerald-50 text-emerald-600"
        title="¿Revertir descarte?"
        description={
          <>
            <strong className="text-slate-800">{candidate.name}</strong> vuelve al ranking activo
            del proceso, con estado Rankeado (MATCHED).
          </>
        }
        confirmLabel="Sí, revertir"
        confirmPendingLabel="Revirtiendo…"
        confirmClassName="bg-emerald-600 hover:bg-emerald-700"
        isPending={restoreMutation.isPending}
        onConfirm={() => restoreMutation.mutate()}
      />
    );
  }

  if (canDiscard) {
    return (
      <ConfirmActionModal
        onClose={onClose}
        icon={<Trash2 className="h-5 w-5" />}
        iconClassName="bg-amber-50 text-amber-600"
        title="¿Descartar candidato?"
        description={
          <>
            <strong className="text-slate-800">{candidate.name}</strong> sale del ranking activo,
            pero no se borra — puedes revertir el descarte cuando quieras desde el mismo botón.
          </>
        }
        confirmLabel="Sí, descartar"
        confirmPendingLabel="Descartando…"
        confirmClassName="bg-amber-600 hover:bg-amber-700"
        isPending={discardMutation.isPending}
        onConfirm={() => discardMutation.mutate()}
      />
    );
  }

  return (
    <ConfirmActionModal
      onClose={onClose}
      icon={<Trash2 className="h-5 w-5" />}
      iconClassName="bg-rose-50 text-rose-600"
      title="¿Eliminar candidato?"
      description={
        <>
          <strong className="text-slate-800">{candidate.name}</strong> está en un estado (
          {CANDIDATE_STATUS_LABEL[candidate.status]}) que no admite descarte reversible — solo se
          puede eliminar de forma permanente. Esta acción no se puede deshacer.
        </>
      }
      confirmLabel="Sí, eliminar"
      confirmPendingLabel="Eliminando…"
      confirmClassName="bg-rose-600 hover:bg-rose-700"
      isPending={deleteMutation.isPending}
      onConfirm={() => deleteMutation.mutate()}
    />
  );
}

function ConfirmActionModal({
  onClose,
  icon,
  iconClassName,
  title,
  description,
  confirmLabel,
  confirmPendingLabel,
  confirmClassName,
  isPending,
  onConfirm,
}: {
  onClose: () => void;
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmPendingLabel: string;
  confirmClassName: string;
  isPending: boolean;
  onConfirm: () => void;
}) {
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
          <div className={cn("p-2.5 rounded-2xl shrink-0 mt-0.5", iconClassName)}>{icon}</div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">{description}</p>
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
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50 shadow-xs",
              confirmClassName,
            )}
          >
            {isPending ? confirmPendingLabel : confirmLabel}
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
                        <th className="text-left font-medium px-3 py-3">Disponibilidad</th>
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
                            <td className="px-3 py-3 text-xs">
                              {c.whatsapp_consent ? (
                                <WhatsAppConsentBadge status={c.whatsapp_consent} />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <AvailabilityBadge pref={c.availability_preference} />
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
                                    title={
                                      c.status === "DISCARDED"
                                        ? "Revertir descarte"
                                        : "Descartar / eliminar candidato"
                                    }
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

const PROCESS_COMMUNICATION_TASKS: AITaskType[] = ["WHATSAPP_MESSAGE", "VOICE_CALL_AGENT"];

function whatsappTemplateBody(template?: ProcessWhatsAppTemplate | WhatsAppTemplateOut | null) {
  return (
    template?.components.find((component) => component.type.toUpperCase() === "BODY")?.text ??
    "Sin vista previa disponible"
  );
}

function ProcessCommunicationPanel({
  processId,
  whatsappTemplate,
  isActive,
  canEdit,
  voiceLanguage,
  onVoiceLanguageChange,
  onSaveVoiceLanguage,
  isSavingVoiceLanguage,
}: {
  processId: string;
  whatsappTemplate: ProcessWhatsAppTemplate | null;
  isActive: boolean;
  canEdit: boolean;
  voiceLanguage: string;
  onVoiceLanguageChange: (value: string) => void;
  onSaveVoiceLanguage: () => void;
  isSavingVoiceLanguage: boolean;
}) {
  const qc = useQueryClient();
  const [editingTask, setEditingTask] = useState<AITaskType | null>(null);
  const [historyTask, setHistoryTask] = useState<AITaskType | null>(null);
  const [text, setText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(whatsappTemplate?.id ?? "none");
  useEffect(() => {
    setSelectedTemplateId(whatsappTemplate?.id ?? "none");
  }, [whatsappTemplate?.id]);
  const { data, isLoading } = useQuery({
    queryKey: ["process-ai-prompts", processId],
    queryFn: () => getProcessAIPrompts({ data: { processId } }),
  });
  const prompts = data?.prompts ?? [];
  const { data: whatsappTemplatesData, isLoading: isLoadingWhatsAppTemplates } = useQuery({
    queryKey: ["whatsapp-templates", "selectable"],
    queryFn: () => getSelectableWhatsAppTemplates(),
  });
  const whatsappTemplates = whatsappTemplatesData?.templates ?? [];
  const selectedWhatsAppTemplate = whatsappTemplates.find(
    (template) => template.id === selectedTemplateId,
  );
  const activeByTask = new Map(
    prompts.filter((prompt) => prompt.is_active).map((prompt) => [prompt.task_type, prompt]),
  );
  const invalidate = () => qc.invalidateQueries({ queryKey: ["process-ai-prompts", processId] });
  const saveMutation = useMutation({
    mutationFn: () =>
      createProcessAIPrompt({
        data: {
          processId,
          taskType: editingTask!,
          systemPromptText: text,
        },
      }),
    onSuccess: () => {
      toast.success(
        editingTask === "VOICE_CALL_AGENT"
          ? "Agente de llamada actualizado"
          : "Mensaje de WhatsApp actualizado",
      );
      invalidate();
      setEditingTask(null);
      setText("");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el prompt"),
  });
  const assignWhatsAppTemplateMutation = useMutation({
    mutationFn: () =>
      assignProcessWhatsAppTemplate({
        data: { processId, templateId: selectedTemplateId },
      }),
    onSuccess: () => {
      toast.success("Plantilla inicial de WhatsApp actualizada");
      qc.invalidateQueries({ queryKey: ["process", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo asignar la plantilla"),
  });
  const restoreMutation = useMutation({
    mutationFn: (taskType: AITaskType) =>
      restoreProcessAIPromptTemplate({ data: { processId, taskType } }),
    onSuccess: () => {
      toast.success("Se creó una nueva versión desde la plantilla global");
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo restaurar la plantilla"),
  });
  const history = historyTask ? prompts.filter((prompt) => prompt.task_type === historyTask) : [];

  return (
    <GlassCard id="communication" className="space-y-5 p-5 sm:p-6 scroll-mt-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-primary" /> Comunicación con candidatos
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            Ajusta cómo inicia la llamada y cómo se comunica este proceso por WhatsApp. Los prompts
            de análisis se administran globalmente desde Admin.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
          {isLoading ? "Cargando…" : `${activeByTask.size}/2 canales configurados`}
        </span>
      </div>

      <div className="rounded-xl border border-border/70 bg-background/45 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Idioma de comunicación
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Se comparte entre la llamada de ElevenLabs y los mensajes de WhatsApp.
            </p>
            <AppSelect
              disabled={!isActive || !canEdit}
              value={voiceLanguage || "auto"}
              onValueChange={(value) => onVoiceLanguageChange(value === "auto" ? "" : value)}
              className="mt-3 w-full sm:max-w-sm"
            >
              <AppSelectItem value="auto">Usar idioma técnico del set</AppSelectItem>
              {VOICE_LANGUAGES.map((language) => (
                <AppSelectItem key={language.value} value={language.value}>
                  {language.label}
                </AppSelectItem>
              ))}
            </AppSelect>
          </div>
          <button
            onClick={onSaveVoiceLanguage}
            disabled={!isActive || !canEdit || isSavingVoiceLanguage}
            className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-40"
          >
            {isSavingVoiceLanguage ? "Guardando…" : "Guardar idioma"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {PROCESS_COMMUNICATION_TASKS.map((taskType) => {
          const prompt = activeByTask.get(taskType) as ProcessAIPromptOut | undefined;
          const isCallAgent = taskType === "VOICE_CALL_AGENT";
          return (
            <div
              key={taskType}
              className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    {isCallAgent ? <PhoneCall className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {isCallAgent ? "Agente de llamada" : "Mensaje de WhatsApp"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      {prompt?.version_name ?? "Sin versión activa"}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold",
                    prompt?.source_prompt_id
                      ? "bg-info/30 text-info-foreground"
                      : "bg-accent text-accent-foreground",
                  )}
                >
                  {prompt?.source_prompt_id ? "Plantilla" : "Propio"}
                </span>
              </div>
              {isCallAgent && (
                <div className="rounded-lg bg-muted/45 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Saludo inicial
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                    {prompt?.first_message_text || "Falta aplicar una plantilla de Admin"}
                  </p>
                </div>
              )}
              {!isCallAgent && (
                <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Plantilla inicial aprobada por Meta
                    </div>
                    {whatsappTemplate && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {whatsappTemplate.language}
                      </span>
                    )}
                  </div>
                  <AppSelect
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                    disabled={!isActive || !canEdit || isLoadingWhatsAppTemplates}
                    className="w-full"
                  >
                    <AppSelectItem value="none">
                      {isLoadingWhatsAppTemplates
                        ? "Cargando plantillas…"
                        : "Selecciona una plantilla aprobada"}
                    </AppSelectItem>
                    {whatsappTemplates.map((template) => (
                      <AppSelectItem key={template.id} value={template.id}>
                        {template.name} · {template.language}
                        {template.is_default ? " (predeterminada)" : ""}
                      </AppSelectItem>
                    ))}
                  </AppSelect>
                  <p className="line-clamp-3 text-[11px] leading-5 text-muted-foreground">
                    {whatsappTemplateBody(selectedWhatsAppTemplate ?? whatsappTemplate)}
                  </p>
                  <button
                    onClick={() => assignWhatsAppTemplateMutation.mutate()}
                    disabled={
                      !isActive ||
                      !canEdit ||
                      selectedTemplateId === "none" ||
                      selectedTemplateId === whatsappTemplate?.id ||
                      assignWhatsAppTemplateMutation.isPending
                    }
                    className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40 dark:text-emerald-300"
                  >
                    {assignWhatsAppTemplateMutation.isPending
                      ? "Asignando…"
                      : "Usar esta plantilla en el proceso"}
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
                {prompt?.system_prompt_text ?? "Este canal aún no tiene instrucciones propias."}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                <button
                  onClick={() => {
                    setEditingTask(taskType);
                    setText(prompt?.system_prompt_text ?? "");
                  }}
                  disabled={!isActive || !canEdit}
                  className="text-primary font-medium hover:underline disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  onClick={() => setHistoryTask(taskType)}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <History className="h-3.5 w-3.5" /> Historial
                </button>
                <button
                  onClick={() => restoreMutation.mutate(taskType)}
                  disabled={!isActive || !canEdit || restoreMutation.isPending}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {isCallAgent ? "Aplicar base Admin" : "Restaurar prompt base"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask === "VOICE_CALL_AGENT"
                ? "Editar agente de llamada"
                : "Editar mensaje de WhatsApp"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Al guardar se crea una nueva versión para este proceso. Los datos del candidato, el
            consentimiento y las preguntas se agregan automáticamente al ejecutar el flujo.
          </p>
          {editingTask === "VOICE_CALL_AGENT" && (
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold">Saludo inicial</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Gestionado por Admin
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {activeByTask.get("VOICE_CALL_AGENT")?.first_message_text ??
                  "Falta aplicar una plantilla de Admin"}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Puedes personalizar las instrucciones. Para cambiar el saludo, aplica una nueva
                plantilla base publicada por Admin.
              </p>
            </div>
          )}
          <div>
            <label htmlFor="communication-instructions" className="text-xs font-semibold">
              {editingTask === "VOICE_CALL_AGENT"
                ? "Instrucciones del agente"
                : "Contenido e instrucciones"}
            </label>
            <textarea
              id="communication-instructions"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="mt-2 min-h-64 w-full rounded-xl border border-border bg-background/70 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 rounded-xl border border-border text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!text.trim() || saveMutation.isPending}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
            >
              {saveMutation.isPending ? "Guardando…" : "Guardar nueva versión"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyTask !== null} onOpenChange={(open) => !open && setHistoryTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial — {historyTask && AI_TASK_TYPE_LABEL[historyTask]}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto scrollbar-visible">
            {history.map((prompt) => (
              <div key={prompt.id} className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-semibold">{prompt.version_name}</span>
                  <span className="text-muted-foreground">
                    {new Date(prompt.created_at).toLocaleString("es-CO")}
                  </span>
                </div>
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-2 text-[11px] scrollbar-visible">
                  {prompt.system_prompt_text}
                </pre>
                {historyTask === "VOICE_CALL_AGENT" && (
                  <div className="mt-2 rounded-lg border border-border/60 p-2 text-[11px]">
                    <span className="font-semibold">Saludo: </span>
                    {prompt.first_message_text || "Sin saludo registrado"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

function ConfigTab({
  processId,
  process,
}: {
  processId: string;
  process: NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof getProcess>>>>["data"]>;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState(process.name);
  const [jobTitle, setJobTitle] = useState(process.job_title);
  const [area, setArea] = useState(process.area);
  const [seniority, setSeniority] = useState(process.seniority);
  const [budget, setBudget] = useState(String(process.budget_max_usd || ""));
  const [selectedSetId, setSelectedSetId] = useState(process.question_set_id ?? "");
  const [voiceLanguage, setVoiceLanguage] = useState(process.voice_override_language ?? "");
  const [jdAnalysis, setJdAnalysis] = useState<ParseJDResponse | null>(null);
  const [jdText, setJdText] = useState(process.job_description?.jd_raw_text ?? "");
  const [preEnhanceJdText, setPreEnhanceJdText] = useState<string | null>(null);

  const { data: questionSets } = useQuery({
    queryKey: ["question-sets"],
    queryFn: () => getQuestionSets(),
  });
  const { data: jds } = useQuery({
    queryKey: ["job-descriptions", processId],
    queryFn: () => getJobDescriptions({ data: { processId } }),
  });
  const { data: promptData } = useQuery({
    queryKey: ["process-ai-prompts", processId],
    queryFn: () => getProcessAIPrompts({ data: { processId } }),
  });

  const isActive = process.status !== "CLOSED" && process.status !== "ARCHIVED";
  const canEditPrompts =
    user?.role === "ADMIN" || (user?.role === "RECRUITER" && user.id === process.recruiter_id);
  const activePromptCount = promptData?.prompts.filter((prompt) => prompt.is_active).length ?? 0;

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
          voice_override_language: voiceLanguage || null,
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
      if (res.enhanced_jd) {
        setPreEnhanceJdText(jdText);
        setJdText(res.enhanced_jd);
      }
      toast.success("JD analizada y enriquecida por IA", {
        description: "La versión mejorada ya está en el campo de texto — puedes editarla.",
      });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo analizar la JD"),
  });

  const undoEnhance = () => {
    if (preEnhanceJdText === null) return;
    setJdText(preEnhanceJdText);
    setPreEnhanceJdText(null);
    toast.info("Se restauró el texto anterior a la mejora de IA");
  };

  const saveJDMutation = useMutation({
    mutationFn: () => createJobDescription({ data: { processId, jdRawText: jdText } }),
    onSuccess: () => {
      toast.success("Nueva versión de la JD guardada");
      setJdAnalysis(null);
      setPreEnhanceJdText(null);
      qc.invalidateQueries({ queryKey: ["job-descriptions", processId] });
      qc.invalidateQueries({ queryKey: ["process", processId] });
      qc.invalidateQueries({ queryKey: ["process-progress", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la JD"),
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <GlassCard className="p-5 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-primary font-semibold">
              Configuración propia
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Ajustes del proceso</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define el proceso, su profiling y el comportamiento de IA sin alterar otras vacantes.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {PROCESS_STATUS_LABEL[process.status]}
          </span>
        </div>
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border/50">
          {[
            ["general", "General"],
            ["jd", "Job Description"],
            ["profiling", "Profiling"],
            ["communication", "Comunicación"],
          ].map(([target, label]) => (
            <a
              key={target}
              href={`#${target}`}
              className="shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-primary transition"
            >
              {label}
            </a>
          ))}
        </div>
      </GlassCard>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          <GlassCard id="general" className="p-5 sm:p-6 space-y-4 scroll-mt-6">
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

          <GlassCard id="jd" className="p-5 sm:p-6 space-y-3 scroll-mt-6">
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
              {preEnhanceJdText !== null && (
                <button
                  onClick={undoEnhance}
                  title="Restaurar el texto anterior a la mejora de IA"
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition"
                >
                  Deshacer
                </button>
              )}
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
                {(jdAnalysis.recommendations.length > 0 ||
                  jdAnalysis.missing_elements.length > 0) && (
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
                  La versión mejorada ya se cargó arriba en el campo de texto — edítala y luego
                  "Guardar como nueva versión".
                </p>
              </div>
            )}
          </GlassCard>

          <GlassCard id="profiling" className="p-5 sm:p-6 space-y-3 scroll-mt-6">
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
                    selectedSetId === process.question_set_id || !selectedSetId
                      ? "none"
                      : selectedSetId
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

          <ProcessCommunicationPanel
            processId={processId}
            whatsappTemplate={process.whatsapp_template}
            isActive={isActive}
            canEdit={canEditPrompts}
            voiceLanguage={voiceLanguage}
            onVoiceLanguageChange={setVoiceLanguage}
            onSaveVoiceLanguage={() => voiceMutation.mutate()}
            isSavingVoiceLanguage={voiceMutation.isPending}
          />
        </div>

        <aside className="hidden xl:block xl:sticky xl:top-6">
          <GlassCard className="space-y-5 p-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Centro de control
              </div>
              <h3 className="mt-1 text-base font-bold tracking-tight">Contexto del proceso</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Cada ajuste aplica únicamente a esta vacante y conserva el resto del espacio de
                trabajo.
              </p>
            </div>

            <div className="space-y-2.5 border-y border-border/60 py-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Estado</span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">
                  {PROCESS_STATUS_LABEL[process.status]}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Perfil</span>
                <span className="max-w-[10rem] text-right font-medium">{process.job_title}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Preguntas</span>
                <span className="font-medium">
                  {process.question_set_id ? "Set asignado" : "Pendiente"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Comunicación</span>
                <span className="font-medium tabular-nums">{activePromptCount}/2 canales</span>
              </div>
            </div>

            <nav aria-label="Secciones de configuración" className="space-y-1">
              {[
                ["general", "Datos básicos", Settings2],
                ["jd", "Job Description", FileText],
                ["profiling", "Profiling", Users],
                ["communication", "Comunicación", PhoneCall],
              ].map(([target, label, Icon]) => {
                const SectionIcon = Icon as typeof Settings2;
                return (
                  <a
                    key={target as string}
                    href={`#${target}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <SectionIcon className="h-3.5 w-3.5 text-primary" />
                    {label as string}
                  </a>
                );
              })}
            </nav>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}

// ─── Candidato Drawer ───────────────────────────────────────────────────────

export function CandidatoDrawer({
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
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-visible rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 cursor-default p-0"
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
                {candidate.match_category && CATEGORY_COLOR[candidate.match_category] && (
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
                {latestRun?.advancement_probability &&
                  ADVANCE_COLOR[latestRun.advancement_probability] && (
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
                {formatAvailability(candidate.availability_preference) && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" />{" "}
                    {formatAvailability(candidate.availability_preference)}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition cursor-pointer shadow-xs"
                title={
                  candidate.status === "DISCARDED" ? "Revertir descarte" : "Descartar / eliminar"
                }
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                {candidate.status === "DISCARDED" ? "Revertir" : "Descartar"}
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
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto scrollbar-visible pr-1">
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
