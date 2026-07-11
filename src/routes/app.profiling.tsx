import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PhoneCall, Clock, CheckCircle2, XCircle, X, RefreshCw, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { ProfilingResultModal } from "@/components/app/ProfilingResultModal";
import { getAllProfilingRuns, cancelProfilingRun } from "@/lib/api/profiling.functions";
import type { ProfilingRunOut } from "@/lib/types/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/profiling")({
  head: () => ({ meta: [{ title: "Ejecución de Profiling · RIWI MATCH" }] }),
  component: Profiling,
});

const MAX_CONCURRENT_CALLS = 4; // RB-005: límite configurado en el backend (settings.max_concurrent_calls)

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function duration(startedAt: string | null): string {
  if (!startedAt) return "—";
  const ms = Date.now() - new Date(startedAt).getTime();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function Profiling() {
  const qc = useQueryClient();
  const [modalRun, setModalRun] = useState<ProfilingRunOut | null>(null);
  const [pollStart] = useState(() => Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ["profiling-runs-global"],
    queryFn: () => getAllProfilingRuns(),
    refetchInterval: () => {
      // El monitor en vivo siempre pollea mientras la página esté abierta — no tiene
      // sentido detenerlo como en la vista de un proceso puntual (aquí siempre puede
      // llegar una llamada nueva de cualquier proceso).
      return Date.now() - pollStart > 30 * 60_000 ? false : 10000;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (runId: string) => cancelProfilingRun({ data: { runId } }),
    onSuccess: () => {
      toast.success("Llamada cancelada");
      qc.invalidateQueries({ queryKey: ["profiling-runs-global"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo cancelar"),
  });

  const runs = data?.profiling_runs ?? [];
  const cola = runs
    .filter((r) => r.status === "QUEUED" || r.status === "PENDING")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const activas = runs.filter((r) => r.status === "CALLING" || r.status === "ANSWERED");
  const completadas = runs.filter((r) => r.status === "COMPLETED");
  const fallidas = runs.filter((r) =>
    ["NO_ANSWER", "FAILED", "RETRY_PENDING", "VOICEMAIL_DETECTED", "CANCELLED"].includes(r.status),
  );

  const completadasHoy = completadas.filter((r) => isToday(r.completed_at)).length;
  const contactables =
    completadas.length +
    fallidas.filter((r) => ["NO_ANSWER", "FAILED", "VOICEMAIL_DETECTED"].includes(r.status)).length;
  const tasaContacto = contactables > 0 ? Math.round((completadas.length / contactables) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold font-mono">
          Voice AI
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Ejecución de Profiling</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor en vivo de las llamadas de profiling automatizado.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            l: "Llamadas activas",
            v: `${activas.length} / ${MAX_CONCURRENT_CALLS}`,
            cn: "bg-primary text-primary-foreground",
          },
          { l: "En cola", v: cola.length.toString(), cn: "bg-indigo-500 text-white" },
          {
            l: "Completadas hoy",
            v: completadasHoy.toString(),
            cn: "bg-success text-success-foreground",
          },
          {
            l: "Tasa de contacto",
            v: contactables > 0 ? `${tasaContacto}%` : "—",
            cn: "bg-warning text-warning-foreground",
          },
        ].map((k) => (
          <GlassCard key={k.l} className="p-4 border-l-4 border-primary">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {k.l}
                </div>
                <div className="mt-2 text-2xl font-bold">{k.v}</div>
              </div>
              <div
                className={cn(
                  "h-10 w-10 rounded-xl grid place-items-center shrink-0 shadow-sm",
                  k.cn,
                )}
              >
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
        <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground font-semibold">
          Máx {MAX_CONCURRENT_CALLS} simultáneas (RB-005)
        </span>
        <span className="flex-1" />
        <span>
          Cada llamada informa que es un asistente automatizado y solicita consentimiento.
        </span>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Cargando llamadas…</div>
      ) : runs.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No hay llamadas de profiling activas.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Column title="En cola" count={cola.length} accent="info" icon={ListTodo}>
            {cola.map((r, i) => (
              <GlassCard
                key={r.id}
                className="p-3 border border-indigo-500/20 bg-indigo-500/5 h-[80px] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 grid place-items-center text-xs font-bold shrink-0">
                      #{i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{r.candidate_name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Intento {r.call_attempts + 1}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelMutation.mutate(r.id)}
                    disabled={cancelMutation.isPending}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    title="Cancelar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </Column>

          <Column
            title="En llamada"
            sub={`máx. ${MAX_CONCURRENT_CALLS}`}
            count={activas.length}
            accent="primary"
            icon={PhoneCall}
          >
            {activas.map((r) => (
              <GlassCard
                key={r.id}
                className="p-3 border border-primary/30 bg-primary/5 h-[90px] flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary text-white grid place-items-center text-xs font-bold pulse-ring shrink-0">
                    {initials(r.candidate_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{r.candidate_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Intento {r.call_attempts}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-primary shrink-0 mr-1" /> {duration(r.started_at)}
                </div>
              </GlassCard>
            ))}
          </Column>

          <Column
            title="Completadas"
            count={completadas.length}
            accent="success"
            icon={CheckCircle2}
          >
            {completadas.map((r) => (
              <GlassCard
                key={r.id}
                className="p-3 border border-emerald-500/20 bg-emerald-500/5 h-[90px] flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{r.candidate_name}</div>
                    {r.advancement_probability && (
                      <div className="text-[10px] text-muted-foreground">
                        Avance: {r.advancement_probability}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setModalRun(r)}
                  className="text-[10px] font-semibold text-primary hover:underline text-left"
                >
                  Respuestas
                </button>
              </GlassCard>
            ))}
          </Column>

          <Column
            title="No contestadas / Fallidas"
            count={fallidas.length}
            accent="destructive"
            icon={XCircle}
          >
            {fallidas.map((r) => (
              <GlassCard
                key={r.id}
                className="p-3 border border-rose-500/20 bg-rose-500/5 h-[90px] flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{r.candidate_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {r.status === "VOICEMAIL_DETECTED"
                        ? "Buzón de voz"
                        : r.status === "CANCELLED"
                          ? "Cancelada"
                          : ""}
                    </div>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                  <RefreshCw className="h-3 w-3" /> Intento {r.call_attempts}
                </span>
              </GlassCard>
            ))}
          </Column>
        </div>
      )}

      <ProfilingResultModal run={modalRun} open={!!modalRun} onClose={() => setModalRun(null)} />
    </div>
  );
}

function Column({
  title,
  sub,
  count,
  accent,
  icon: Icon,
  children,
}: {
  title: string;
  sub?: string;
  count: number;
  accent: "primary" | "info" | "success" | "destructive";
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary",
    info: "bg-indigo-500",
    success: "bg-success",
    destructive: "bg-destructive",
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className={`h-2 w-2 rounded-full ${accentMap[accent]}`} />
        <div className="text-sm font-semibold">{title}</div>
        {sub && <div className="text-[10px] text-muted-foreground">({sub})</div>}
        <div className="flex-1" />
        <span className="text-xs font-bold text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2">
        {count === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6 rounded-xl border border-dashed border-border flex items-center justify-center gap-1.5">
            <Icon className="h-3.5 w-3.5" /> Vacío
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
