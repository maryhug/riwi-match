import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { createQuestionSet } from "@/lib/api/question-sets.functions";

export const Route = createFileRoute("/app/sets/nuevo")({
  head: () => ({ meta: [{ title: "Nuevo set de preguntas · RIWI MATCH" }] }),
  component: NuevoSet,
});

function NuevoSet() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createQuestionSet({ data: { name, description: description || undefined } }),
    onSuccess: (set) => {
      toast.success("Set creado");
      nav({ to: "/app/sets/$id", params: { id: set.id } });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo crear el set"),
  });

  return (
    <div className="space-y-5 max-w-lg">
      <Link
        to="/app/sets"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
      >
        ← Volver a sets
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Nuevo set de preguntas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dale un nombre — luego podrás agregar las preguntas.
        </p>
      </div>
      <GlassCard className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Nombre
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Profiling Backend Sr"
            className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Para qué tipo de cargo o proceso es este set?"
            className="mt-1.5 w-full min-h-[80px] px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
          />
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={name.trim().length === 0 || createMutation.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition disabled:opacity-40"
        >
          {createMutation.isPending ? "Creando…" : "Crear set"}
        </button>
      </GlassCard>
    </div>
  );
}
