import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import {
  Bot,
  Clock,
  Headphones,
  MessageSquare,
  PhoneCall,
  Play,
  ShieldAlert,
  User,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProfilingAnswers } from "@/lib/api/profiling.functions";
import { ADVANCEMENT_PROBABILITY_LABEL, OPERATION_TYPE_LABEL } from "@/lib/types/enums";
import type { CandidateDetailResponse, ProfilingRunOut } from "@/lib/types/api";
import { cn, cleanAnswerText } from "@/lib/utils";

const ADVANCE_COLOR: Record<string, string> = {
  HIGH: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200",
  LOW: "bg-rose-50 text-rose-700 border border-rose-200",
};

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

const CALL_OPERATION_TYPES = new Set([
  "VOICE_CALL",
  "VOICE_TRANSCRIPTION",
  "ANSWER_EVALUATION",
  "TWILIO_CALL",
]);

export function ProfilingResultModal({
  run,
  costs,
  open,
  onClose,
}: {
  run: ProfilingRunOut | null;
  costs?: CandidateDetailResponse["costs"];
  open: boolean;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: answersData, isLoading } = useQuery({
    queryKey: ["profiling-answers", run?.id],
    queryFn: () => getProfilingAnswers({ data: { runId: run!.id } }),
    enabled: open && !!run,
  });

  if (!run) return null;

  const callCosts = (costs ?? []).filter((c) => CALL_OPERATION_TYPES.has(c.operation_type));
  const callTotal = callCosts.reduce((s, c) => s + c.estimated_cost, 0);
  const turns = run.transcript_turns ?? [];

  const handleSeek = (secs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = secs;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] max-h-[850px] overflow-hidden flex flex-col bg-card border-border text-foreground shadow-2xl">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="flex items-center justify-between gap-3 text-lg font-semibold">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base text-foreground font-semibold">{run.candidate_name}</span>
                <p className="text-xs font-normal text-muted-foreground">Transcripción y Análisis de Entrevista de Voz</p>
              </div>
            </div>
            {run.advancement_probability && (
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold tracking-wide",
                  ADVANCE_COLOR[run.advancement_probability],
                )}
              >
                Avance: {ADVANCEMENT_PROBABILITY_LABEL[run.advancement_probability]}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 text-sm flex-1 min-h-0 pt-2 overflow-hidden">
          {/* ── Columna izquierda: evaluación, respuestas, costos ── */}
          <div className="space-y-4 min-w-0 flex flex-col min-h-0 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-border">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5 shadow-xs shrink-0">
              {run.advancement_explanation && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dictamen de Evaluación
                  </span>
                  <p className="text-foreground text-xs leading-relaxed">{run.advancement_explanation}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/60">
                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {formatDuration(run.started_at, run.completed_at)}
                </span>
                <span>Intento {run.call_attempts}</span>
              </div>
              {run.has_audio && (
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2 mb-1 text-xs text-foreground font-medium">
                    <Headphones className="h-3.5 w-3.5 text-primary" />
                    <span>Grabación de Audio</span>
                  </div>
                  <audio
                    ref={audioRef}
                    controls
                    src={`/dl/profiling-audio/${run.id}`}
                    className="h-8 w-full rounded-lg accent-primary"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between shrink-0">
                <span>Respuestas Evaluadas</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {answersData?.answers.length ?? 0} preguntas
                </span>
              </div>
              {isLoading ? (
                <div className="text-xs text-muted-foreground py-4 text-center rounded-xl border border-border">
                  Cargando respuestas…
                </div>
              ) : !answersData?.answers.length ? (
                <div className="text-xs text-muted-foreground py-4 text-center rounded-xl border border-border">
                  Sin respuestas registradas.
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin scrollbar-thumb-border">
                  {answersData.answers.map((a) => {
                    const matchingTurn =
                      turns.find(
                        (t) =>
                          t.role !== "agent" &&
                          t.time_in_call_secs != null &&
                          a.transcription &&
                          (t.message
                            ?.toLowerCase()
                            .includes(a.transcription.slice(0, 15).toLowerCase()) ||
                            a.transcription
                              .toLowerCase()
                              .includes((t.message || "").slice(0, 15).toLowerCase())),
                      ) ?? turns.find((t) => t.role !== "agent" && t.time_in_call_secs != null);

                    return (
                      <details
                        key={a.id}
                        className="rounded-xl border border-border bg-card p-3 group hover:border-primary/40 transition shadow-xs"
                      >
                        <summary className="cursor-pointer text-xs font-semibold flex items-center justify-between gap-2 text-foreground">
                          <span className="flex items-center gap-2">
                            {a.question.is_critical && (
                              <span title="Pregunta Crítica">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                            {a.question.text}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {matchingTurn?.time_in_call_secs != null && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSeek(matchingTurn.time_in_call_secs!);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-mono font-medium transition cursor-pointer border border-primary/20"
                                title="Saltar a este momento en el audio"
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                {Math.floor(matchingTurn.time_in_call_secs / 60)}:
                                {String(Math.floor(matchingTurn.time_in_call_secs % 60)).padStart(
                                  2,
                                  "0",
                                )}
                              </button>
                            )}
                            {a.requires_review && (
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Revisión
                              </span>
                            )}
                          </div>
                        </summary>
                        <div className="mt-2.5 pt-2 border-t border-border/60 space-y-1.5 text-xs">
                          <div className="bg-muted/40 p-2 rounded-lg border border-border/70 text-foreground leading-relaxed font-medium">
                            <span className="text-muted-foreground font-semibold block mb-0.5">Respuesta:</span>
                            {cleanAnswerText(a.normalized_answer, a.transcription)}
                          </div>
                          {a.evaluation_result && (
                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="text-muted-foreground">Evaluación:</span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
                                  a.evaluation_result === "pass"
                                    ? "text-slate-600 bg-transparent border-slate-200"
                                    : a.evaluation_result === "fail"
                                      ? "text-rose-700 bg-transparent border-rose-200"
                                      : "text-slate-600 bg-transparent border-slate-200",
                                )}
                              >
                                {a.evaluation_result}
                              </span>
                            </div>
                          )}
                          {a.confidence_score !== null && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-muted-foreground text-[11px]">Confianza:</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted max-w-[120px] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${a.confidence_score * 100}%` }}
                                />
                              </div>
                              <span className="font-semibold text-foreground text-[11px]">
                                {Math.round(a.confidence_score * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Costos de la llamada
              </div>
              {callCosts.length === 0 ? (
                <div className="text-xs text-muted-foreground">Sin datos de costo disponibles.</div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-left px-3 py-1.5 font-medium">Operación</th>
                        <th className="text-left px-3 py-1.5 font-medium">Modelo</th>
                        <th className="text-right px-3 py-1.5 font-medium">Tokens</th>
                        <th className="text-right px-3 py-1.5 font-medium">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {callCosts.map((c, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition">
                          <td className="px-3 py-1 text-foreground">
                            {OPERATION_TYPE_LABEL[
                              c.operation_type as keyof typeof OPERATION_TYPE_LABEL
                            ] ?? c.operation_type}
                          </td>
                          <td className="px-3 py-1 text-muted-foreground">
                            {c.model_used ?? "—"}
                          </td>
                          <td className="px-3 py-1 text-right tabular-nums text-foreground">
                            {c.tokens_input || c.tokens_output
                              ? `${(c.tokens_input ?? 0) + (c.tokens_output ?? 0)}`
                              : "—"}
                          </td>
                          <td className="px-3 py-1 text-right tabular-nums font-semibold text-foreground">
                            ${c.estimated_cost.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-border font-semibold bg-muted/40 text-foreground">
                        <td className="px-3 py-1.5" colSpan={3}>
                          Total
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-primary font-bold">
                          ${callTotal.toFixed(4)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: conversación completa tipo chat ── */}
          <div className="flex flex-col min-w-0 h-full overflow-hidden">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5 shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" /> Conversación completa ({turns.length} mensajes)
            </div>
            {turns.length === 0 ? (
              <div className="text-xs text-muted-foreground py-12 text-center rounded-2xl border border-dashed border-border bg-muted/20">
                Sin transcripción disponible para esta llamada.
              </div>
            ) : (
              <div className="relative flex-1 min-h-0 rounded-2xl border border-border bg-slate-50/60 p-3 shadow-inner overflow-hidden flex flex-col">
                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {turns.map((t, i) => {
                    const isAgent = t.role === "agent";
                    if (!t.message) return null;
                    return (
                      <div key={i} className={cn("flex", isAgent ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs transition",
                            isAgent
                              ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                              : "bg-primary/10 border border-primary/20 text-slate-900 rounded-tr-xs",
                          )}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                            <span className="flex items-center gap-1 font-semibold">
                              {isAgent ? (
                                <Bot className="h-3 w-3 text-primary shrink-0" />
                              ) : (
                                <User className="h-3 w-3 text-slate-500 shrink-0" />
                              )}
                              {isAgent ? "Agente" : run.candidate_name}
                            </span>
                            {t.time_in_call_secs != null && (
                              <button
                                type="button"
                                onClick={() => handleSeek(t.time_in_call_secs!)}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer transition inline-flex items-center gap-1 font-semibold border border-primary/20"
                                title="Reproducir desde este instante"
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                {Math.floor(t.time_in_call_secs / 60)}:
                                {String(Math.floor(t.time_in_call_secs % 60)).padStart(2, "0")}
                              </button>
                            )}
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap pt-0.5">{t.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


