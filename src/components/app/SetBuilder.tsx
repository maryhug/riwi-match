import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { GripVertical, Star, Pencil, Trash2, Plus } from "lucide-react";
import { GlassCard } from "@/components/app/GlassCard";
import { QuestionFormDialog } from "@/components/app/QuestionFormDialog";
import type { QuestionSet, SetQuestion } from "@/lib/mock-data";

const SEED_QUESTIONS: SetQuestion[] = [
  { texto: "¿Tienes disponibilidad para modalidad híbrida en Medellín?", tipo: "Sí/No", critica: true, peso: 30, keywordsPositivas: ["disponible", "sí", "acepto"], keywordsNegativas: ["no puedo", "solo remoto"] },
  { texto: "Cuéntanos por qué saliste de tu último empleo", tipo: "Abierta", critica: false, peso: 20, keywordsPositivas: ["crecimiento", "nuevo reto"], keywordsNegativas: ["conflicto", "despido", "demanda"] },
  { texto: "¿Cuál es tu expectativa salarial?", tipo: "Numérica", critica: false, peso: 15, keywordsPositivas: [], keywordsNegativas: ["muy por encima del rango"] },
  { texto: "¿Cuántos años de experiencia tienes con Node.js?", tipo: "Numérica", critica: true, peso: 20, keywordsPositivas: ["5+", "senior"], keywordsNegativas: ["sin experiencia"] },
  { texto: "¿Has liderado equipos? ¿De qué tamaño?", tipo: "Abierta", critica: false, peso: 10, keywordsPositivas: ["liderazgo", "squad"], keywordsNegativas: [] },
  { texto: "¿Tu inglés es B2 o superior?", tipo: "Sí/No", critica: true, peso: 5, keywordsPositivas: ["b2", "c1", "sí"], keywordsNegativas: ["a1", "a2", "no"] },
];

export function SetBuilder({ isNew, setInfo }: { isNew: boolean; setInfo: QuestionSet | null }) {
  const [questions, setQuestions] = useState<SetQuestion[]>(isNew ? [] : SEED_QUESTIONS);
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; index: number } | null>(null);

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = (question: SetQuestion) => {
    if (dialogState?.mode === "edit") {
      setQuestions(questions.map((q, i) => (i === dialogState.index ? question : q)));
    } else {
      setQuestions([...questions, question]);
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/app/sets" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
        ← Volver a sets
      </Link>
      <div>
        {isNew ? (
          <input type="text" placeholder="Nombre del nuevo set..." className="text-2xl font-bold bg-transparent border-b border-border focus:border-primary outline-none w-full max-w-md pb-1" autoFocus />
        ) : (
          <h1 className="text-2xl font-bold">{setInfo?.nombre || "Cargando..."}</h1>
        )}
        <p className="text-sm text-muted-foreground mt-2">Editor de preguntas · arrastra para reordenar.</p>
      </div>

      <div className="space-y-3">
        {questions.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            Aún no hay preguntas en este set.
          </div>
        )}

        {questions.map((q, i) => (
          <GlassCard key={i} className="p-4">
            <div className="flex items-start gap-3">
              <button className="text-muted-foreground hover:text-foreground mt-1.5"><GripVertical className="h-4 w-4" /></button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pregunta {i + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold">{q.tipo}</span>
                  {q.critica && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/15 text-destructive text-[10px] font-semibold">
                      <Star className="h-3 w-3 fill-current" /> Crítica
                    </span>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground">Peso: <span className="font-semibold text-foreground">{q.peso}%</span></div>
                </div>
                <p className="font-medium text-sm">{q.texto}</p>

                {(q.keywordsPositivas.length > 0 || q.keywordsNegativas.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    {q.keywordsPositivas.length > 0 && (
                      <>
                        <span className="text-[10px] text-muted-foreground mr-1">Keywords positivas:</span>
                        {q.keywordsPositivas.map((k) => <span key={k} className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px]">{k}</span>)}
                      </>
                    )}
                    {q.keywordsNegativas.length > 0 && (
                      <>
                        <span className="text-[10px] text-muted-foreground ml-2 mr-1">No avance:</span>
                        {q.keywordsNegativas.map((k) => <span key={k} className="px-2 py-0.5 rounded bg-destructive/15 text-destructive text-[10px]">{k}</span>)}
                      </>
                    )}
                  </div>
                )}
                <div className="mt-2 text-[10px] text-muted-foreground italic">Las palabras clave no descartan automáticamente; activan revisión humana.</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDialogState({ mode: "edit", index: i })}
                  className="text-muted-foreground hover:text-primary p-1"
                  aria-label="Editar pregunta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Eliminar pregunta">
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
        onOpenChange={(open) => { if (!open) setDialogState(null); }}
        initial={dialogState?.mode === "edit" ? questions[dialogState.index] : null}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
