import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, Headphones, PhoneCall, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProfilingAnswers } from "@/lib/api/profiling.functions";
import { ADVANCEMENT_PROBABILITY_LABEL, OPERATION_TYPE_LABEL } from "@/lib/types/enums";
import type { CandidateDetailResponse, ProfilingRunOut } from "@/lib/types/api";
import { cn } from "@/lib/utils";

const ADVANCE_COLOR: Record<string, string> = {
  HIGH: "bg-success/15 text-success",
  MEDIUM: "bg-warning/15 text-warning-foreground",
  LOW: "bg-destructive/15 text-destructive",
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

const CALL_OPERATION_TYPES = new Set(["VOICE_CALL", "VOICE_TRANSCRIPTION", "ANSWER_EVALUATION"]);

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
  const { data: answersData, isLoading } = useQuery({
    queryKey: ["profiling-answers", run?.id],
    queryFn: () => getProfilingAnswers({ data: { runId: run!.id } }),
    enabled: open && !!run,
  });

  if (!run) return null;

  const callCosts = (costs ?? []).filter((c) => CALL_OPERATION_TYPES.has(c.operation_type));
  const callTotal = callCosts.reduce((s, c) => s + c.estimated_cost, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-primary" />
            {run.candidate_name}
            {run.advancement_probability && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-xs font-semibold",
                  ADVANCE_COLOR[run.advancement_probability],
                )}
              >
                Avance: {ADVANCEMENT_PROBABILITY_LABEL[run.advancement_probability]}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Resumen */}
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-2">
            {run.advancement_explanation && (
              <p className="text-foreground/90">{run.advancement_explanation}</p>
            )}
            {run.transcript_summary && (
              <p className="text-muted-foreground text-xs">{run.transcript_summary}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(run.started_at, run.completed_at)}
              </span>
              <span>Intento {run.call_attempts}</span>
            </div>
          </div>

          {/* Respuestas por pregunta */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Respuestas
            </div>
            {isLoading ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                Cargando respuestas…
              </div>
            ) : !answersData?.answers.length ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                Sin respuestas registradas.
              </div>
            ) : (
              <div className="space-y-2">
                {answersData.answers.map((a) => (
                  <details
                    key={a.id}
                    className="rounded-lg border border-border bg-background/30 p-3 group"
                  >
                    <summary className="cursor-pointer text-sm font-medium flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {a.question.is_critical && (
                          <ShieldAlert className="h-3.5 w-3.5 text-warning shrink-0" />
                        )}
                        {a.question.text}
                      </span>
                      {a.requires_review && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning/15 text-warning-foreground">
                          Requiere revisión
                        </span>
                      )}
                    </summary>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground">Respuesta: </span>
                        {a.transcription ?? a.normalized_answer ?? "—"}
                      </div>
                      {a.evaluation_result && (
                        <div>
                          <span className="text-muted-foreground">Evaluación IA: </span>
                          {a.evaluation_result}
                        </div>
                      )}
                      {a.confidence_score !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Confianza:</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted max-w-[120px]">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${a.confidence_score * 100}%` }}
                            />
                          </div>
                          <span className="font-medium">
                            {Math.round(a.confidence_score * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* Transcripción y audio */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Transcripción y audio
            </div>
            {run.transcription_url ? (
              <div className="space-y-2">
                <a
                  href={run.transcription_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Ver transcripción completa
                </a>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Headphones className="h-3.5 w-3.5" />
                  <audio controls src={run.transcription_url} className="h-8 max-w-full" />
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Audio no disponible para esta llamada.
              </div>
            )}
          </div>

          {/* Costos */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Costos de la llamada
            </div>
            {callCosts.length === 0 ? (
              <div className="text-xs text-muted-foreground">Sin datos de costo disponibles.</div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-background/40">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium">Operación</th>
                      <th className="text-left px-3 py-1.5 font-medium">Modelo</th>
                      <th className="text-right px-3 py-1.5 font-medium">Tokens</th>
                      <th className="text-right px-3 py-1.5 font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callCosts.map((c, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="px-3 py-1.5">
                          {OPERATION_TYPE_LABEL[
                            c.operation_type as keyof typeof OPERATION_TYPE_LABEL
                          ] ?? c.operation_type}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.model_used ?? "—"}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {c.tokens_input || c.tokens_output
                            ? `${(c.tokens_input ?? 0) + (c.tokens_output ?? 0)}`
                            : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                          ${c.estimated_cost.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-border font-semibold bg-background/30">
                      <td className="px-3 py-1.5" colSpan={3}>
                        Total
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        ${callTotal.toFixed(4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
