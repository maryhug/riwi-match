import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Star, Pencil, Trash2, Plus, Archive, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { QuestionFormDialog, type QuestionDraft } from "@/components/app/QuestionFormDialog";
import {
  getQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/lib/api/question-sets.functions";
import { QUESTION_TYPE_LABEL } from "@/lib/types/enums";
import type { QuestionOut } from "@/lib/types/api";

export function SetBuilder({ setId, processId }: { setId: string; processId?: string }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; question: QuestionOut } | null
  >(null);
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);

  const { data: set, isLoading } = useQuery({
    queryKey: ["question-set", setId],
    queryFn: () => getQuestionSet({ data: { id: setId } }),
  });

  const questions = set?.questions ?? [];

  /** Si el set está ACTIVE/en uso, cada escritura clona silenciosamente una nueva versión
   * con id distinto — navegar ahí para que el usuario siga editando la versión correcta. */
  const followClone = (newId: string) => {
    if (newId !== setId) {
      toast.info("Se creó una nueva versión del set (estaba activo)");
      nav({
        to: "/app/sets/$id",
        params: { id: newId },
        search: processId ? { processId } : undefined,
      });
    } else {
      qc.invalidateQueries({ queryKey: ["question-set", setId] });
    }
    qc.invalidateQueries({ queryKey: ["question-sets"] });
  };

  const addMutation = useMutation({
    mutationFn: (q: QuestionDraft) => addQuestion({ data: { setId, ...q } }),
    onSuccess: (res) => {
      toast.success("Pregunta agregada");
      followClone(res.question_set_id);
      setDialogState(null);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo agregar"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ questionId, q }: { questionId: string; q: QuestionDraft }) =>
      updateQuestion({ data: { setId, questionId, ...q } }),
    onSuccess: (res) => {
      toast.success("Pregunta actualizada");
      followClone(res.question_set_id);
      setDialogState(null);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => deleteQuestion({ data: { setId, questionId } }),
    onSuccess: () => {
      toast.success("Pregunta eliminada");
      qc.invalidateQueries({ queryKey: ["question-set", setId] });
      qc.invalidateQueries({ queryKey: ["question-sets"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar"),
  });

  const metaMutation = useMutation({
    mutationFn: (body: {
      name?: string;
      description?: string;
      status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
      default_system_prompt?: string;
    }) => updateQuestionSet({ data: { id: setId, ...body } }),
    onSuccess: (res) => {
      toast.success("Guardado");
      followClone(res.id);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  const deleteSetMutation = useMutation({
    mutationFn: () => deleteQuestionSet({ data: { id: setId } }),
    onSuccess: () => {
      toast.success("Set eliminado");
      qc.invalidateQueries({ queryKey: ["question-sets"] });
      nav({ to: "/app/sets" });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar (puede estar en uso)"),
  });

  const handleSubmit = (q: QuestionDraft) => {
    if (dialogState?.mode === "edit")
      updateMutation.mutate({ questionId: dialogState.question.id, q });
    else addMutation.mutate(q);
  };

  if (isLoading) return <LoadingIndicator className="py-16" label="Cargando set…" />;
  if (!set)
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Set no encontrado.</div>
    );

  return (
    <div className="space-y-5">
      {processId ? (
        <Link
          to="/app/procesos/$id"
          params={{ id: processId }}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          ← Volver al proceso
        </Link>
      ) : (
        <Link
          to="/app/sets"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          ← Volver a sets
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <input
            value={name ?? set.name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name !== null && name !== set.name) metaMutation.mutate({ name });
            }}
            className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full max-w-md pb-1"
          />
          <input
            value={description ?? set.description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== null && description !== (set.description ?? ""))
                metaMutation.mutate({ description });
            }}
            placeholder="Descripción del set…"
            className="mt-1 text-sm text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          {set.status === "DRAFT" && (
            <button
              onClick={() => metaMutation.mutate({ status: "ACTIVE" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Activar
            </button>
          )}
          {set.status === "ACTIVE" && (
            <button
              onClick={() => metaMutation.mutate({ status: "ARCHIVED" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold"
            >
              <Archive className="h-3.5 w-3.5" /> Archivar
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("¿Eliminar este set? Esta acción no se puede deshacer."))
                deleteSetMutation.mutate();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar set
          </button>
        </div>
      </div>
      {set.status === "ACTIVE" && (
        <div className="text-[11px] text-warning bg-warning/10 rounded-lg px-3 py-2">
          Este set está activo — cualquier cambio en las preguntas creará una nueva versión.
        </div>
      )}

      <GlassCard className="p-4 space-y-2">
        <div className="text-sm font-semibold">Prompt del agente de llamada</div>
        <p className="text-xs text-muted-foreground">
          Se suma al prompt universal (identidad, tono, estructura) que ya aplica a todas las
          llamadas — acá solo va lo específico de este cargo/proceso. Las preguntas del cuestionario
          y el aviso de consentimiento se agregan automáticamente, no hace falta escribirlos aquí.
        </p>
        <textarea
          value={systemPrompt ?? set.default_system_prompt ?? ""}
          onChange={(e) => setSystemPrompt(e.target.value)}
          onBlur={() => {
            if (systemPrompt !== null && systemPrompt !== (set.default_system_prompt ?? ""))
              metaMutation.mutate({ default_system_prompt: systemPrompt });
          }}
          placeholder="Ej: Eres un agente de voz de Riwi Corp llamando para el cargo de…"
          className="w-full min-h-[120px] px-3 py-2 rounded-lg bg-background/70 border border-border text-sm font-mono"
        />
      </GlassCard>

      <div className="space-y-3">
        {questions.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            Aún no hay preguntas en este set.
          </div>
        )}

        {questions.map((q, i) => (
          <GlassCard key={q.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-muted-foreground mt-1.5">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pregunta {i + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold">
                    {QUESTION_TYPE_LABEL[q.type]}
                  </span>
                  {q.is_critical && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/15 text-destructive text-[10px] font-semibold">
                      <Star className="h-3 w-3 fill-current" /> Crítica
                    </span>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground">
                    Peso: <span className="font-semibold text-foreground">{q.weight}%</span>
                  </div>
                </div>
                <p className="font-medium text-sm">{q.text}</p>

                {(q.positive_keywords.length > 0 || q.risk_keywords.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    {q.positive_keywords.length > 0 && (
                      <>
                        <span className="text-[10px] text-muted-foreground mr-1">
                          Keywords positivas:
                        </span>
                        {q.positive_keywords.map((k) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px]"
                          >
                            {k}
                          </span>
                        ))}
                      </>
                    )}
                    {q.risk_keywords.length > 0 && (
                      <>
                        <span className="text-[10px] text-muted-foreground ml-2 mr-1">
                          Revisión:
                        </span>
                        {q.risk_keywords.map((k) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 rounded bg-destructive/15 text-destructive text-[10px]"
                          >
                            {k}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDialogState({ mode: "edit", question: q })}
                  className="text-muted-foreground hover:text-primary p-1"
                  aria-label="Editar pregunta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(q.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                  aria-label="Eliminar pregunta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
        <button
          onClick={() => setDialogState({ mode: "create" })}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Agregar pregunta
        </button>
      </div>

      <QuestionFormDialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        initial={dialogState?.mode === "edit" ? dialogState.question : null}
        onSubmit={handleSubmit}
        saving={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
