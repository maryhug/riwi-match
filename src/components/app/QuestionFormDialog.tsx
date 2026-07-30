import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { QuestionOut } from "@/lib/types/api";
import type { QuestionType } from "@/lib/types/enums";

export interface QuestionDraft {
  text: string;
  type: QuestionType;
  is_critical: boolean;
  weight: number;
  positive_keywords: string[];
  risk_keywords: string[];
}

const EMPTY: QuestionDraft = {
  text: "",
  type: "OPEN",
  is_critical: false,
  weight: 10,
  positive_keywords: [],
  risk_keywords: [],
};

function toDraft(q: QuestionOut): QuestionDraft {
  return {
    text: q.text,
    type: q.type,
    is_critical: q.is_critical,
    weight: q.weight,
    positive_keywords: q.positive_keywords,
    risk_keywords: q.risk_keywords,
  };
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: QuestionOut | null;
  onSubmit: (question: QuestionDraft) => void;
  saving?: boolean;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(initial ? toDraft(initial) : EMPTY);

  useEffect(() => {
    if (open) setDraft(initial ? toDraft(initial) : EMPTY);
  }, [open, initial]);

  const isEditing = initial !== null;
  const canSave = draft.text.trim().length > 0;

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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pregunta
            </label>
            <textarea
              autoFocus
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              placeholder="Ej. ¿Cuántos años de experiencia tienes con Node.js?"
              className="mt-1.5 w-full min-h-[72px] rounded-xl bg-background/70 border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tipo de respuesta
              </label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as QuestionType })}
                className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              >
                <option value="YES_NO">Sí/No</option>
                <option value="OPEN">Abierta</option>
                <option value="NUMERIC">Numérica</option>
                <option value="CLOSED">Cerrada</option>
                <option value="MULTIPLE_CHOICE">Opción múltiple</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Peso (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.weight}
                onChange={(e) => setDraft({ ...draft, weight: parseInt(e.target.value) || 0 })}
                className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3.5 py-3">
            <div>
              <div className="text-sm font-medium">Pregunta crítica</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Si el candidato no cumple, se marca como criterio excluyente.
              </div>
            </div>
            <Switch
              checked={draft.is_critical}
              onCheckedChange={(v) => setDraft({ ...draft, is_critical: v })}
            />
          </div>

          <TagInput
            label="Keywords positivas"
            tone="success"
            value={draft.positive_keywords}
            onChange={(v) => setDraft({ ...draft, positive_keywords: v })}
          />
          <TagInput
            label="Keywords que activan revisión"
            tone="destructive"
            value={draft.risk_keywords}
            onChange={(v) => setDraft({ ...draft, risk_keywords: v })}
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
            disabled={!canSave || saving}
            onClick={() => onSubmit(draft)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Guardar pregunta"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagInput({
  label,
  tone,
  value,
  onChange,
}: {
  label: string;
  tone: "success" | "destructive";
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background/70 p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-primary/40">
        {value.map((k) => (
          <span
            key={k}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
              tone === "success"
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {k}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== k))}
              className="hover:opacity-70"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
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
