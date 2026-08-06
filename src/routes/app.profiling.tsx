import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Calendar, CheckCircle2, Clock3, PhoneCall, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { GlassCard } from "@/components/app/GlassCard";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { PipelineBoard, ProfilingHistoryDialog } from "@/components/app/PipelineBoard";
import { ProfilingResultModal } from "@/components/app/ProfilingResultModal";
import { CandidatoDrawer } from "./app.procesos.$id";
import {
  cancelProfilingRun,
  getProfilingBoard,
  getProfilingRunDetail,
  triggerProfiling,
} from "@/lib/api/profiling.functions";
import { getProcesses } from "@/lib/api/processes.functions";
import type { PipelineCandidate, ProfilingRunOut } from "@/lib/types/api";
import { LIVE_REFRESH_INTERVAL_MS } from "@/lib/polling";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/profiling")({
  head: () => ({ meta: [{ title: "Profiling | Riwi Match" }] }),
  component: Profiling,
});

type Timeframe = "today" | "7days" | "month" | "all";

const timeframeLabels: Record<Timeframe, string> = {
  today: "Hoy",
  "7days": "7 días",
  month: "Este mes",
  all: "Histórico",
};

function Profiling() {
  const qc = useQueryClient();
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [processFilter, setProcessFilter] = useState<string | null>(null);
  const [modalRun, setModalRun] = useState<ProfilingRunOut | null>(null);
  const [historyCandidate, setHistoryCandidate] = useState<PipelineCandidate | null>(null);
  const [drawerCandidate, setDrawerCandidate] = useState<{
    processId: string;
    candidate: PipelineCandidate;
  } | null>(null);

  // getProcesses ya filtra por rol en el backend (recruiter -> solo los suyos,
  // admin/TA_LEADER -> todos), así que el selector nunca ofrece procesos ajenos.
  const { data: processesData } = useQuery({
    queryKey: ["processes"],
    queryFn: () => getProcesses(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["profiling-board", timeframe, processFilter],
    queryFn: () =>
      getProfilingBoard({ data: { timeframe, processId: processFilter ?? undefined } }),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["profiling-board"] });
    qc.invalidateQueries({ queryKey: ["profiling-runs"] });
    qc.invalidateQueries({ queryKey: ["process-pipeline"] });
    qc.invalidateQueries({ queryKey: ["process-progress"] });
  };

  const cancelMutation = useMutation({
    mutationFn: (item: PipelineCandidate) =>
      cancelProfilingRun({ data: { runId: item.latest_run!.id } }),
    onSuccess: () => {
      toast.success("Corrida cancelada");
      invalidate();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar"),
  });

  const retryMutation = useMutation({
    mutationFn: (item: PipelineCandidate) =>
      triggerProfiling({
        data: {
          processId: item.process!.id,
          processCandidateIds: [item.process_candidate_id],
        },
      }),
    onSuccess: (result) => {
      if (result.queued) toast.success("Reintento creado y encolado");
      else toast.info(result.skipped[0]?.reason ?? "No se creó otra corrida");
      invalidate();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "No se pudo reintentar"),
  });

  const openLatest = (item: PipelineCandidate | ProfilingRunOut | { id: string } | null) => {
    if (!item) return;
    const run = "latest_run" in item ? item.latest_run : item;
    if (!run) return;
    setModalRun(run as any);
  };

  const cards = useMemo(() => data?.candidates ?? [], [data]);
  const totals = useMemo(
    () => ({
      queued: cards.filter((item) => item.board_column === "QUEUED").length,
      calling: cards.filter((item) => item.board_column === "CALLING").length,
      completed: cards.filter((item) => item.board_column === "COMPLETED").length,
      attention: cards.filter((item) => item.consistency === "ATTENTION").length,
    }),
    [cards],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Voice operations
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Tablero de profiling</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Una tarjeta por candidato. Cada intento anterior permanece en su historial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AppSelect
            value={processFilter ?? "all"}
            onValueChange={(value) => setProcessFilter(value === "all" ? null : value)}
            className="w-full sm:w-64"
            placeholder="Filtrar por proceso"
          >
            <AppSelectItem value="all">Todos los procesos</AppSelectItem>
            {(processesData?.processes ?? []).map((process) => (
              <AppSelectItem key={process.process_id} value={process.process_id}>
                {process.name}
              </AppSelectItem>
            ))}
          </AppSelect>
          <div className="flex items-center gap-1 rounded-2xl border border-border/70 bg-card/80 p-1.5 shadow-sm backdrop-blur-md">
            <Calendar className="mx-1 h-4 w-4 text-muted-foreground" />
            {(Object.keys(timeframeLabels) as Timeframe[]).map((value) => (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition",
                  timeframe === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {timeframeLabels[value]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "En cola", value: totals.queued, icon: Clock3, tone: "text-indigo-500" },
          { label: "En llamada", value: totals.calling, icon: PhoneCall, tone: "text-sky-500" },
          {
            label: "Completadas",
            value: totals.completed,
            icon: CheckCircle2,
            tone: "text-emerald-500",
          },
          {
            label: "Requieren atención",
            value: totals.attention,
            icon: AlertTriangle,
            tone: "text-amber-500",
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <GlassCard key={label} className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/70">
              <Icon className={cn("h-4 w-4", tone)} />
            </div>
            <div>
              <div className="text-2xl font-black tabular-nums">{value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {isLoading ? (
        <LoadingIndicator className="py-20" label="Construyendo tablero…" />
      ) : cards.length ? (
        <PipelineBoard
          items={cards}
          showContext
          onOpenCandidate={(item) => {
            if (item.process?.id) {
              setDrawerCandidate({ processId: item.process.id, candidate: item });
            } else {
              toast.info("Este candidato no tiene un proceso asociado.");
            }
          }}
          onOpenLatest={openLatest}
          onOpenHistory={setHistoryCandidate}
          onRetry={(item) => retryMutation.mutate(item)}
          onCancel={(item) => cancelMutation.mutate(item)}
          actionPending={cancelMutation.isPending || retryMutation.isPending}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
          No hay candidatos de profiling para el período seleccionado.
        </div>
      )}

      <ProfilingHistoryDialog
        candidate={historyCandidate}
        onClose={() => setHistoryCandidate(null)}
        onSelect={(run) => {
          setHistoryCandidate(null);
          setModalRun(run);
        }}
      />
      <ProfilingResultModal run={modalRun} open={!!modalRun} onClose={() => setModalRun(null)} />

      {drawerCandidate && (
        <CandidatoDrawer
          processId={drawerCandidate.processId}
          candidate={
            {
              process_candidate_id: drawerCandidate.candidate.process_candidate_id,
              candidate_id: drawerCandidate.candidate.candidate_id,
              name: drawerCandidate.candidate.candidate_name,
              email: drawerCandidate.candidate.candidate_email ?? null,
              phone: null,
              city: null,
              status: "LOADED",
              stage: "IN_PROCESS",
              stage_label: drawerCandidate.candidate.state_label,
              source: "DIRECT",
              source_label: "Directo",
              has_cv: true,
              match_score: null,
              overall_score: null,
              technical_score: null,
              soft_skills_score: null,
              experience_score: null,
              education_score: null,
              missing_must_haves: [],
              missing_nice_to_haves: [],
              human_override_match: null,
              human_notes: null,
              created_at: new Date().toISOString(),
              whatsapp_consent: "PENDING",
              availability_preference: null,
            } as any
          }
          latestRun={drawerCandidate.candidate.latest_run as any}
          onClose={() => setDrawerCandidate(null)}
          onOpenProfilingModal={(run) => {
            openLatest(run);
          }}
          onPreviewNormalized={(c) => {
            window.open(
              `/dl/cv-normalized/${drawerCandidate.processId}/${c.process_candidate_id}`,
              "_blank",
            );
          }}
          onPreviewOriginal={(c) => {
            window.open(
              `/dl/cv/${drawerCandidate.processId}/${c.process_candidate_id}`,
              "_blank",
            );
          }}
        />
      )}
    </div>
  );
}
