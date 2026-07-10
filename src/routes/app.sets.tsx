import { createFileRoute } from "@tanstack/react-router";
import { Plus, FileText, GripVertical, Star, Trash2 } from "lucide-react";
import { sets } from "@/lib/mock-data";
import { GlassCard } from "@/components/app/GlassCard";
import { useState } from "react";

export const Route = createFileRoute("/app/sets")({
  head: () => ({ meta: [{ title: "Sets de Preguntas · RIWI MATCH" }] }),
  component: Sets,
});

function Sets() {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  if (editing) {
    const isNew = editing === "new";
    const setInfo = isNew ? null : sets.find((s) => s.id === editing);
    return <Builder isNew={isNew} setInfo={setInfo} onBack={() => setEditing(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Configuración</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sets de preguntas</h1>
          <p className="text-sm text-muted-foreground mt-1">Plantillas de profiling automatizado por cargo.</p>
        </div>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> Nuevo set
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((s) => (
          <GlassCard key={s.id} className="cursor-pointer" onClick={() => setEditing(s.id)}>
            <div className="flex items-start justify-between mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-info">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-accent-foreground">{s.version}</span>
                {s.estado === "Activo" && <span className="px-2 py-0.5 rounded text-[10px] bg-success/15 text-success font-semibold">Activo</span>}
                {s.estado === "Borrador" && <span className="px-2 py-0.5 rounded text-[10px] bg-warning/20 text-warning-foreground font-semibold">Borrador</span>}
                {s.estado === "Archivado" && <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-semibold">Archivado</span>}
              </div>
            </div>
            <h3 className="font-semibold leading-tight">{s.nombre}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.descripcion}</p>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{s.preguntas} preguntas</span>
              <span>·</span>
              <span>{s.idioma}</span>
              <span>·</span>
              <span>{s.cargo}</span>
            </div>
            {s.enUso && (
              <div className="mt-3 text-[11px] text-warning bg-warning/10 rounded-lg px-2 py-1.5">
                Este set ya fue usado en procesos — editar creará una nueva versión.
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function Builder({ isNew, setInfo, onBack }: { isNew: boolean; setInfo: any; onBack: () => void }) {
  const defaultQuestions = isNew ? [] : [
    { texto: "¿Tienes disponibilidad para modalidad híbrida en Medellín?", tipo: "Sí/No", critica: true, peso: 30 },
    { texto: "Cuéntanos por qué saliste de tu último empleo", tipo: "Abierta", critica: false, peso: 20 },
    { texto: "¿Cuál es tu expectativa salarial?", tipo: "Numérica", critica: false, peso: 15 },
    { texto: "¿Cuántos años de experiencia tienes con Node.js?", tipo: "Numérica", critica: true, peso: 20 },
    { texto: "¿Has liderado equipos? ¿De qué tamaño?", tipo: "Abierta", critica: false, peso: 10 },
    { texto: "¿Tu inglés es B2 o superior?", tipo: "Sí/No", critica: true, peso: 5 },
  ];

  const [questions, setQuestions] = useState(defaultQuestions);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { texto: "Escribe tu nueva pregunta aquí...", tipo: "Abierta", critica: false, peso: 10 }
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">← Volver a sets</button>
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
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pregunta {i+1}</span>
                  <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold">{q.tipo}</span>
                  {q.critica && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/15 text-destructive text-[10px] font-semibold">
                      <Star className="h-3 w-3 fill-current" /> Crítica
                    </span>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground">Peso: <span className="font-semibold text-foreground">{q.peso}%</span></div>
                </div>
                {/* Simulated editable input */}
                <input type="text" defaultValue={q.texto} className="font-medium text-sm w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors" />
                
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-muted-foreground mr-1">Keywords positivas:</span>
                  {["disponible","sí","aceptado"].map(k=><span key={k} className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px]">{k}</span>)}
                  <span className="text-[10px] text-muted-foreground ml-2 mr-1">No avance:</span>
                  {["conflicto","despido","demanda"].map(k=><span key={k} className="px-2 py-0.5 rounded bg-destructive/15 text-destructive text-[10px]">{k}</span>)}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground italic">Las palabras clave no descartan automáticamente; activan revisión humana.</div>
              </div>
              <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </GlassCard>
        ))}
        <button onClick={addQuestion} className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition">
          + Agregar pregunta
        </button>
      </div>
    </div>
  );
}
