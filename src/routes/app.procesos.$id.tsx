import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  PlayCircle,
  Upload,
  Archive,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Phone,
  Eye,
  Download,
  Sparkles,
  PhoneCall,
  Users,
  Settings2,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { UploadCvsModal } from "@/components/app/UploadCvsModal";
import { ProfilingResultModal } from "@/components/app/ProfilingResultModal";
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
  updateProcessStatus,
  updateProcess,
  assignQuestionSet,
  updateVoiceConfig,
  enhanceJobDescription,
  getJobDescriptions,
} from "@/lib/api/processes.functions";
import {
  getCandidates,
  getCandidateDetail,
  overrideCandidate,
} from "@/lib/api/candidates.functions";
import { triggerMatch, getMatchStatus } from "@/lib/api/match.functions";
import { triggerProfiling, getProcessProfilingRuns } from "@/lib/api/profiling.functions";
import { submitFeedback } from "@/lib/api/ai-feedback.functions";
import { getQuestionSets } from "@/lib/api/question-sets.functions";
import { candidateStatusesRefetchInterval, profilingRunsRefetchInterval } from "@/lib/polling";
import {
  PROCESS_STATUS_LABEL,
  CANDIDATE_STATUS_LABEL,
  MATCH_CATEGORY_LABEL,
  ADVANCEMENT_PROBABILITY_LABEL,
  type ProcessStatus,
  type MatchCategory,
  type CandidateStatus,
  type AdvancementProbability,
} from "@/lib/types/enums";
import type { CandidateListItem, ProfilingRunOut } from "@/lib/types/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/procesos/$id")({
  head: () => ({ meta: [{ title: "Detalle de proceso · RIWI MATCH" }] }),
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pollStart] = useState(() => Date.now());

  const { data: process, isLoading: processLoading } = useQuery({
    queryKey: ["process", id],
    queryFn: () => getProcess({ data: { processId: id } }),
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", id],
    queryFn: () => getCandidates({ data: { processId: id } }),
    refetchInterval: (q) =>
      candidateStatusesRefetchInterval(
        q.state.data?.candidates.map((c) => c.status),
        pollStart,
      ),
  });

  const { data: profilingRunsData } = useQuery({
    queryKey: ["profiling-runs", id],
    queryFn: () => getProcessProfilingRuns({ data: { processId: id } }),
    refetchInterval: (q) =>
      profilingRunsRefetchInterval(
        q.state.data?.profiling_runs.map((r) => r.status),
        pollStart,
      ),
  });

  const { data: matchStatus } = useQuery({
    queryKey: ["match-status", id],
    queryFn: () => getMatchStatus({ data: { processId: id } }),
    enabled: process?.status === "MATCH_PROCESSING",
    refetchInterval: (q) => (q.state.data?.is_complete ? false : 3000),
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

  const matchMutation = useMutation({
    mutationFn: () => triggerMatch({ data: { processId: id } }),
    onSuccess: (res) => {
      if ("tasks" in res) toast.success(`Match iniciado — ${res.queued} candidato(s) en cola`);
      else toast.info(res.message);
      qc.invalidateQueries({ queryKey: ["process", id] });
      qc.invalidateQueries({ queryKey: ["candidates", id] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el match"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateProcessStatus({ data: { processId: id, status } }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["process", id] });
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
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo activar profiling"),
  });

  if (processLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Cargando proceso…</div>;
  }
  if (!process) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">Proceso no encontrado.</div>
    );
  }

  const isActive = process.status !== "CLOSED" && process.status !== "ARCHIVED";
  const canRunMatch = !!process.job_description && isActive;

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
                {PROCESS_STATUS_LABEL[process.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {process.job_title} · {process.area} · {process.seniority} · Reclutador:{" "}
              {process.recruiter_name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => matchMutation.mutate()}
              disabled={!canRunMatch || matchMutation.isPending}
              title={
                !process.job_description ? "El proceso necesita una Job Description" : undefined
              }
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
                onClick={() => statusMutation.mutate("CLOSED")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/60 text-sm"
              >
                <XCircle className="h-3.5 w-3.5" /> Cerrar proceso
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

        {matchStatus && !matchStatus.is_complete && (
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

        {process.budget_max_usd > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Presupuesto máximo</span>
                <span className="font-medium">${process.budget_max_usd.toFixed(2)}</span>
              </div>
            </div>
            <a
              href={`/dl/export/ranking/${id}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <FileDown className="h-3.5 w-3.5" /> Exportar ranking
            </a>
            <a
              href={`/dl/export/costs/${id}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <FileDown className="h-3.5 w-3.5" /> Exportar costos
            </a>
          </div>
        )}
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
        />
      )}

      {tab === "Ranking de candidatos" && (
        <RankingTab
          processId={id}
          candidates={candidates}
          latestRunByPc={latestRunByPc}
          hasQuestionSet={!!process.question_set_id}
          selected={selected}
          setSelected={setSelected}
          onOpenDrawer={setDrawerCandidate}
          onOpenProfilingModal={setProfilingModalRun}
          onActivateProfiling={(ids) => profilingMutation.mutate(ids)}
          activating={profilingMutation.isPending}
        />
      )}

      {tab === "Kanban" && (
        <KanbanTab
          candidates={candidates}
          latestRunByPc={latestRunByPc}
          onOpenDrawer={setDrawerCandidate}
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
        />
      )}

      <ProfilingResultModal
        run={profilingModalRun}
        open={!!profilingModalRun}
        onClose={() => setProfilingModalRun(null)}
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
}: {
  processId: string;
  budgetMax: number;
  profilingRuns: ProfilingRunOut[];
}) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["process-metrics", processId],
    queryFn: () => getProcessMetrics({ data: { processId } }),
  });

  if (isLoading || !metrics) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Cargando métricas…</div>
    );
  }

  const sd = metrics.status_distribution;
  const procesados =
    (sd.MATCHED ?? 0) +
    (sd.SELECTED_FOR_PROFILING ?? 0) +
    (sd.PROFILING_QUEUED ?? 0) +
    (sd.PROFILING_CALLING ?? 0) +
    (sd.PROFILING_COMPLETED ?? 0) +
    (sd.PROFILING_FAILED ?? 0) +
    (sd.DISCARDED ?? 0);
  const conError = sd.CV_ERROR ?? 0;
  const pendientes =
    (sd.LOADED ?? 0) +
    (sd.CV_PROCESSING ?? 0) +
    (sd.MATCH_PENDING ?? 0) +
    (sd.MATCH_PROCESSING ?? 0);

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
          { label: "Total CVs", value: metrics.total_cvs },
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
    </div>
  );
}

// ─── Ranking Tab ────────────────────────────────────────────────────────────

function RankingTab({
  processId,
  candidates,
  latestRunByPc,
  hasQuestionSet,
  selected,
  setSelected,
  onOpenDrawer,
  onOpenProfilingModal,
  onActivateProfiling,
  activating,
}: {
  processId: string;
  candidates: CandidateListItem[];
  latestRunByPc: Map<string, ProfilingRunOut>;
  hasQuestionSet: boolean;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  onOpenDrawer: (c: CandidateListItem) => void;
  onOpenProfilingModal: (r: ProfilingRunOut) => void;
  onActivateProfiling: (ids: string[]) => void;
  activating: boolean;
}) {
  const [subView, setSubView] = useState<"match" | "profiling">("match");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const toggleSelect = (pcId: string) => {
    const next = new Set(selected);
    if (next.has(pcId)) next.delete(pcId);
    else next.add(pcId);
    setSelected(next);
  };

  const matchFiltered = candidates.filter((c) => {
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.email.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (quickFilter === "high" && c.match_category !== "HIGH") return false;
    if (quickFilter === "medium" && c.match_category !== "MEDIUM") return false;
    if (quickFilter === "calling" && !["PROFILING_CALLING", "PROFILING_QUEUED"].includes(c.status))
      return false;
    if (quickFilter === "completed" && c.status !== "PROFILING_COMPLETED") return false;
    return true;
  });

  const profilingCandidates = candidates.filter((c) =>
    [
      "SELECTED_FOR_PROFILING",
      "PROFILING_QUEUED",
      "PROFILING_CALLING",
      "PROFILING_COMPLETED",
      "PROFILING_FAILED",
    ].includes(c.status),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["match", "profiling"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
              subView === v
                ? "bg-primary text-primary-foreground"
                : "bg-background/60 border border-border text-muted-foreground",
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
                onChange={(e) => setSearch(e.target.value)}
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
                onClick={() => setQuickFilter(quickFilter === f.k ? null : f.k)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition",
                  quickFilter === f.k
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background/60 border-border text-muted-foreground",
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                      <th className="px-4 py-3"></th>
                      <th className="text-left font-medium px-3 py-3">Candidato</th>
                      <th className="text-left font-medium px-3 py-3">Match</th>
                      <th className="text-left font-medium px-3 py-3">Categoría</th>
                      <th className="text-left font-medium px-3 py-3">Ciudad</th>
                      <th className="text-left font-medium px-3 py-3">Profiling</th>
                      <th className="text-left font-medium px-3 py-3">Avance</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchFiltered.map((c) => {
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
                          <td className="px-3 py-3 text-xs">{CANDIDATE_STATUS_LABEL[c.status]}</td>
                          <td className="px-3 py-3 text-xs">
                            {run?.advancement_probability
                              ? ADVANCEMENT_PROBABILITY_LABEL[run.advancement_probability]
                              : "—"}
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenDrawer(c)}
                              className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                    <th className="text-left font-medium px-4 py-3">Candidato</th>
                    <th className="text-left font-medium px-3 py-3">Estado de llamada</th>
                    <th className="text-left font-medium px-3 py-3">Insights</th>
                    <th className="text-left font-medium px-3 py-3">Avance</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {profilingCandidates.map((c) => {
                    const run = latestRunByPc.get(c.process_candidate_id);
                    return (
                      <tr
                        key={c.process_candidate_id}
                        onClick={() => onOpenDrawer(c)}
                        className="cursor-pointer border-t border-border/30 hover:bg-accent/30 transition"
                      >
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-3 py-3 text-xs">{CANDIDATE_STATUS_LABEL[c.status]}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs truncate">
                          {run?.transcript_summary ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {run?.advancement_probability
                            ? ADVANCEMENT_PROBABILITY_LABEL[run.advancement_probability]
                            : "—"}
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {run && run.status === "COMPLETED" && (
                            <button
                              onClick={() => onOpenProfilingModal(run)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
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
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ─── Kanban Tab ─────────────────────────────────────────────────────────────

const PIPELINE_COLUMNS: { key: string; label: string; statuses: CandidateStatus[] }[] = [
  { key: "cv", label: "CV Procesado", statuses: ["MATCHED"] },
  {
    key: "selected",
    label: "Seleccionado",
    statuses: ["SELECTED_FOR_PROFILING", "PROFILING_QUEUED"],
  },
  { key: "calling", label: "En Profiling", statuses: ["PROFILING_CALLING"] },
  { key: "done", label: "Completado", statuses: ["PROFILING_COMPLETED"] },
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
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  const assignSetMutation = useMutation({
    mutationFn: () => assignQuestionSet({ data: { processId, questionSetId: selectedSetId } }),
    onSuccess: () => {
      toast.success("Set de preguntas asignado");
      qc.invalidateQueries({ queryKey: ["process", processId] });
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
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  const enhanceMutation = useMutation({
    mutationFn: () => enhanceJobDescription({ data: { processId } }),
    onSuccess: (res) => {
      toast.success("JD mejorada", { description: res.recommendations.slice(0, 2).join(" · ") });
      qc.invalidateQueries({ queryKey: ["job-descriptions", processId] });
      qc.invalidateQueries({ queryKey: ["process", processId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo mejorar la JD"),
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
        <button
          onClick={() => enhanceMutation.mutate()}
          disabled={!isActive || !process.job_description || enhanceMutation.isPending}
          className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary bg-primary/5 text-xs font-medium disabled:opacity-40"
        >
          {enhanceMutation.isPending ? "Mejorando…" : "Mejorar con IA"}
        </button>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="text-sm font-semibold">Set de preguntas de profiling</div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
            disabled={!isActive}
            className="flex-1 px-3 py-2 rounded-xl bg-background/70 border border-border text-sm disabled:opacity-50"
          >
            <option value="">— Sin asignar —</option>
            {(questionSets?.question_sets ?? [])
              .filter((qs) => qs.status === "ACTIVE")
              .map((qs) => (
                <option key={qs.id} value={qs.id}>
                  {qs.name}
                </option>
              ))}
          </select>
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
            Cambiar
          </button>
        </div>
        <Link to="/app/sets/nuevo" className="text-xs text-primary hover:underline">
          Crear nuevo set
        </Link>
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
}: {
  processId: string;
  candidate: CandidateListItem;
  latestRun: ProfilingRunOut | null;
  onClose: () => void;
  onOpenProfilingModal: (r: ProfilingRunOut) => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [overrideScore, setOverrideScore] = useState("");
  const [notesInit, setNotesInit] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["candidate-detail", processId, candidate.process_candidate_id],
    queryFn: () =>
      getCandidateDetail({ data: { processId, pcId: candidate.process_candidate_id } }),
  });

  if (detail && !notesInit) {
    setNotes(detail.human_notes ?? "");
    setOverrideScore(
      detail.human_override_match != null ? String(detail.human_override_match) : "",
    );
    setNotesInit(true);
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

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-background shadow-2xl z-50 overflow-y-auto border-l border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted grid place-items-center text-xs font-bold">
              {initials(candidate.name)}
            </div>
            <div>
              <div className="font-semibold text-sm">{candidate.name}</div>
              <div className="text-xs text-muted-foreground">{candidate.email}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : (
          <div className="p-5 space-y-5">
            {detail?.match && (
              <GlassCard className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <MatchRing
                    pct={detail.match.percentage}
                    category={detail.match.category}
                    size={64}
                  />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Análisis de Match IA
                    </div>
                    {detail.match.category && (
                      <div
                        className={cn(
                          "text-xs mt-1 font-medium",
                          CATEGORY_COLOR[detail.match.category].text,
                        )}
                      >
                        {MATCH_CATEGORY_LABEL[detail.match.category]}
                      </div>
                    )}
                  </div>
                </div>
                {detail.match.summary && (
                  <p className="text-xs text-foreground/80">{detail.match.summary}</p>
                )}
                {detail.match.strengths.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-success font-semibold mb-1">
                      Fortalezas
                    </div>
                    <ul className="text-xs space-y-0.5">
                      {detail.match.strengths.map((s, i) => (
                        <li key={i}>+ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.match.gaps.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-destructive font-semibold mb-1">
                      Brechas
                    </div>
                    <ul className="text-xs space-y-0.5">
                      {detail.match.gaps.map((g, i) => (
                        <li key={i}>− {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.total_cost > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Costo IA: ${detail.total_cost.toFixed(4)}
                  </div>
                )}
              </GlassCard>
            )}

            {latestRun && (
              <GlassCard className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5" /> Profiling
                  </div>
                  {latestRun.status === "COMPLETED" && (
                    <button
                      onClick={() => onOpenProfilingModal(latestRun)}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver detalle completo
                    </button>
                  )}
                </div>
                <div className="text-xs">
                  Estado: {CANDIDATE_STATUS_LABEL[candidate.status] ?? candidate.status}
                </div>
                {latestRun.advancement_probability && (
                  <div className="text-xs">
                    Avance:{" "}
                    <span className="font-semibold">
                      {ADVANCEMENT_PROBABILITY_LABEL[latestRun.advancement_probability]}
                    </span>
                  </div>
                )}
              </GlassCard>
            )}

            {(detail?.candidate.cv_url || detail?.candidate.normalized_cv_url) && (
              <div className="flex gap-2">
                {detail.candidate.cv_url && (
                  <a
                    href={`/dl/cv/${processId}/${candidate.process_candidate_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background/60 text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" /> CV original
                  </a>
                )}
                {detail.candidate.normalized_cv_url && (
                  <a
                    href={`/dl/cv-normalized/${processId}/${candidate.process_candidate_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-primary/40 text-primary bg-primary/5 text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" /> CV normalizado
                  </a>
                )}
              </div>
            )}

            <GlassCard className="p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Override del recruiter
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Score manual (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  placeholder="Usar score de IA"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg bg-background/70 border border-border text-xs"
                />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones…"
                className="w-full min-h-[70px] px-3 py-2 rounded-lg bg-background/70 border border-border text-xs"
              />
              <button
                onClick={() => overrideMutation.mutate()}
                disabled={overrideMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {overrideMutation.isPending ? "Guardando…" : "Guardar"}
              </button>

              <div className="flex gap-2 pt-2 border-t border-border">
                {(["CORRECT", "PARTIAL", "INCORRECT"] as const).map((ev) => (
                  <button
                    key={ev}
                    onClick={() => feedbackMutation.mutate(ev)}
                    disabled={feedbackMutation.isPending}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition disabled:opacity-50"
                  >
                    {ev === "CORRECT" ? "Correcto" : ev === "PARTIAL" ? "Parcial" : "Incorrecto"}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}
