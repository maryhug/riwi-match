import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileSearch,
  History,
  PhoneCall,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";
import { getCandidateProfilingHistory } from "@/lib/api/profiling.functions";
import type { PipelineBoardColumn, PipelineCandidate, ProfilingRunOut } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

const COLUMN_META: Record<
  PipelineBoardColumn,
  { label: string; icon: ElementType; rail: string; wash: string }
> = {
  CV_MATCH: {
    label: "CV / Match",
    icon: FileSearch,
    rail: "bg-slate-500",
    wash: "from-slate-500/8",
  },
  QUEUED: {
    label: "En cola",
    icon: Clock3,
    rail: "bg-indigo-500",
    wash: "from-indigo-500/10",
  },
  CALLING: {
    label: "En llamada",
    icon: PhoneCall,
    rail: "bg-sky-500",
    wash: "from-sky-500/10",
  },
  COMPLETED: {
    label: "Completadas",
    icon: CheckCircle2,
    rail: "bg-emerald-500",
    wash: "from-emerald-500/10",
  },
  FAILED: {
    label: "Fallidas / No contestadas",
    icon: XCircle,
    rail: "bg-rose-500",
    wash: "from-rose-500/10",
  },
};

const BADGE_STYLE: Record<PipelineBoardColumn, string> = {
  CV_MATCH: "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  QUEUED: "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  CALLING: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  COMPLETED: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  FAILED: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function PipelineStateBadge({ item }: { item: PipelineCandidate }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide",
        BADGE_STYLE[item.board_column],
      )}
    >
      {item.state_label}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PipelineCard({
  item,
  showContext,
  onOpenLatest,
  onOpenHistory,
  onRetry,
  onCancel,
  actionPending,
}: {
  item: PipelineCandidate;
  showContext: boolean;
  onOpenLatest?: (item: PipelineCandidate) => void;
  onOpenHistory?: (item: PipelineCandidate) => void;
  onRetry?: (item: PipelineCandidate) => void;
  onCancel?: (item: PipelineCandidate) => void;
  actionPending?: boolean;
}) {
  const canCancel = ["PENDING", "QUEUED", "RETRY_PENDING"].includes(item.latest_run?.status ?? "");
  const canRetry = item.consistency === "ATTENTION" || item.board_column === "FAILED";

  return (
    <GlassCard className="group relative overflow-hidden border-border/70 p-0 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
      <div className={cn("absolute inset-x-0 top-0 h-px", COLUMN_META[item.board_column].rail)} />
      <button
        type="button"
        onClick={() => onOpenLatest?.(item)}
        disabled={!item.latest_run || !onOpenLatest}
        className="w-full px-3.5 pb-2.5 pt-3.5 text-left disabled:cursor-default"
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[11px] font-black",
              BADGE_STYLE[item.board_column],
            )}
          >
            {initials(item.candidate_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold tracking-tight">{item.candidate_name}</div>
            {item.candidate_email && (
              <div className="truncate text-[10px] text-muted-foreground">
                {item.candidate_email}
              </div>
            )}
          </div>
          {item.consistency === "ATTENTION" && (
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label="Atención" />
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <PipelineStateBadge item={item} />
          {item.latest_run && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              Intento {Math.max(1, item.latest_run.call_attempts)}
            </span>
          )}
        </div>

        {showContext && item.process && (
          <div className="mt-2 border-t border-border/50 pt-2 text-[10px] leading-4 text-muted-foreground">
            <div className="truncate font-semibold text-foreground/75">{item.process.name}</div>
            <div className="truncate">
              {item.process.job_title}
              {item.recruiter ? ` · ${item.recruiter.name}` : ""}
            </div>
          </div>
        )}

        {item.consistency === "ATTENTION" && item.consistency_explanation && (
          <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-2 py-1.5 text-[10px] leading-4 text-amber-800 dark:text-amber-200">
            {item.consistency_explanation}
          </div>
        )}
      </button>

      <div className="flex items-center gap-1 border-t border-border/50 px-2 py-1.5">
        {item.run_count > 0 && onOpenHistory && (
          <button
            type="button"
            onClick={() => onOpenHistory(item)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <History className="h-3 w-3" /> {item.run_count} intento
            {item.run_count === 1 ? "" : "s"}
          </button>
        )}
        <div className="flex-1" />
        {canRetry && onRetry && (
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onRetry(item)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-primary transition hover:bg-primary/10 disabled:opacity-40"
          >
            <RefreshCw className="h-3 w-3" /> Reintentar
          </button>
        )}
        {canCancel && onCancel && (
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onCancel(item)}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            title="Cancelar corrida"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </GlassCard>
  );
}

export function PipelineBoard({
  items,
  includeCvMatch = false,
  showContext = false,
  onOpenLatest,
  onOpenHistory,
  onRetry,
  onCancel,
  actionPending = false,
}: {
  items: PipelineCandidate[];
  includeCvMatch?: boolean;
  showContext?: boolean;
  onOpenLatest?: (item: PipelineCandidate) => void;
  onOpenHistory?: (item: PipelineCandidate) => void;
  onRetry?: (item: PipelineCandidate) => void;
  onCancel?: (item: PipelineCandidate) => void;
  actionPending?: boolean;
}) {
  const columns: PipelineBoardColumn[] = includeCvMatch
    ? ["CV_MATCH", "QUEUED", "CALLING", "COMPLETED", "FAILED"]
    : ["QUEUED", "CALLING", "COMPLETED", "FAILED"];

  return (
    <div
      className={cn("grid grid-cols-1 gap-3", includeCvMatch ? "xl:grid-cols-5" : "lg:grid-cols-4")}
    >
      {columns.map((column) => {
        const meta = COLUMN_META[column];
        const columnItems = items.filter((item) => item.board_column === column);
        const Icon = meta.icon;
        return (
          <section
            key={column}
            className={cn(
              "min-w-0 rounded-2xl border border-border/60 bg-gradient-to-b to-transparent p-2.5",
              meta.wash,
            )}
          >
            <header className="mb-2.5 flex items-center gap-2 px-1">
              <span className={cn("h-5 w-1 rounded-full", meta.rail)} />
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="min-w-0 flex-1 truncate text-[11px] font-black uppercase tracking-[0.12em]">
                {meta.label}
              </h2>
              <span className="rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-black tabular-nums">
                {columnItems.length}
              </span>
            </header>
            <div className="space-y-2">
              {columnItems.length === 0 ? (
                <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-border/70 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Sin tarjetas
                </div>
              ) : (
                columnItems.map((item) => (
                  <PipelineCard
                    key={item.process_candidate_id}
                    item={item}
                    showContext={showContext}
                    onOpenLatest={onOpenLatest}
                    onOpenHistory={onOpenHistory}
                    onRetry={onRetry}
                    onCancel={onCancel}
                    actionPending={actionPending}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ProfilingHistoryDialog({
  candidate,
  onClose,
  onSelect,
}: {
  candidate: PipelineCandidate | null;
  onClose: () => void;
  onSelect: (run: ProfilingRunOut) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["profiling-history", candidate?.process_candidate_id],
    queryFn: () =>
      getCandidateProfilingHistory({
        data: { processCandidateId: candidate!.process_candidate_id },
      }),
    enabled: !!candidate,
  });

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <History className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">
              Historial de {candidate.candidate_name}
            </div>
            <div className="text-xs text-muted-foreground">Todos los intentos de profiling</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[62vh] space-y-2 overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Cargando historial…
            </div>
          ) : data?.profiling_runs.length ? (
            data.profiling_runs.map((run) => (
              <button
                key={run.id}
                onClick={() => onSelect(run)}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-black">
                  {run.call_attempts}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{run.status}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(run.created_at).toLocaleString("es-CO")}
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary">Ver detalle</span>
              </button>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Sin intentos registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
