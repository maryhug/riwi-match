import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { SetQuestion } from "@/lib/mock-data";

const EMPTY: SetQuestion = {
  texto: "",
  tipo: "Abierta",
  critica: false,
  peso: 10,
  keywordsPositivas: [],
  keywordsNegativas: [],
};

export function QuestionFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: SetQuestion | null;
  onSubmit: (question: SetQuestion) => void;
}) {
  const [draft, setDraft] = useState<SetQuestion>(initial ?? EMPTY);

  useEffect(() => {
    if (open) setDraft(initial ?? EMPTY);
  }, [open, initial]);

  const isEditing = initial !== null;
  const canSave = draft.texto.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar pregunta" : "Nueva pregunta"}</DialogTitle>
          <DialogDescription>
            Define el enunciado, cómo se evalúa y qué respuestas activan revisión humana.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pregunta</label>
            <textarea
              autoFocus
              value={draft.texto}
              onChange={(e) => setDraft({ ...draft, texto: e.target.value })}
              placeholder="Ej. ¿Cuántos años de experiencia tienes con Node.js?"
              className="mt-1.5 w-full min-h-[72px] rounded-xl bg-background/70 border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo de respuesta</label>
              <select
                value={draft.tipo}
                onChange={(e) => setDraft({ ...draft, tipo: e.target.value as SetQuestion["tipo"] })}
                className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              >
                <option value="Sí/No">Sí/No</option>
                <option value="Abierta">Abierta</option>
                <option value="Numérica">Numérica</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Peso (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.peso}
                onChange={(e) => setDraft({ ...draft, peso: parseInt(e.target.value) || 0 })}
                className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3.5 py-3">
            <div>
              <div className="text-sm font-medium">Pregunta crítica</div>
              <div className="text-xs text-muted-foreground mt-0.5">Si el candidato no cumple, se marca como criterio excluyente.</div>
            </div>
            <Switch checked={draft.critica} onCheckedChange={(v) => setDraft({ ...draft, critica: v })} />
          </div>

          <TagInput
            label="Keywords positivas"
            tone="success"
            value={draft.keywordsPositivas}
            onChange={(v) => setDraft({ ...draft, keywordsPositivas: v })}
          />
          <TagInput
            label="Keywords que activan revisión"
            tone="destructive"
            value={draft.keywordsNegativas}
            onChange={(v) => setDraft({ ...draft, keywordsNegativas: v })}
          />
          <p className="text-[11px] text-muted-foreground italic">
            Las palabras clave no descartan automáticamente; activan revisión humana.
          </p>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl border border-border bg-background/60 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => { onSubmit(draft); onOpenChange(false); }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30 disabled:opacity-40"
          >
            Guardar pregunta
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagInput({
  label, tone, value, onChange,
}: { label: string; tone: "success" | "destructive"; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background/70 p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-primary/40">
        {value.map((k) => (
          <span
            key={k}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
              tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}
          >
            {k}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} className="hover:opacity-70">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
            if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={commit}
          placeholder="Escribe y presiona Enter…"
          className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
