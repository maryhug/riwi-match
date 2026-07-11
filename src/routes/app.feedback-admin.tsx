import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, MessageSquareText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAllNotes, deleteAllNotes, deleteNote } from "@/lib/api/feedback.functions";

export const Route = createFileRoute("/app/feedback-admin")({
  head: () => ({ meta: [{ title: "Gestión de feedback · RIWI MATCH" }] }),
  component: FeedbackAdmin,
});

function FeedbackAdmin() {
  const queryClient = useQueryClient();
  const { data: notes = [] } = useQuery({
    queryKey: ["feedback-notes", "all"],
    queryFn: () => getAllNotes(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["feedback-notes"] });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => deleteNote({ data: { id } }),
    retry: 2,
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo eliminar la anotación — inténtalo de nuevo."),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllNotes(),
    retry: 2,
    onSuccess: invalidate,
    onError: () => toast.error("No se pudieron eliminar las anotaciones — inténtalo de nuevo."),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Feedback</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Gestión de anotaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Todos los apuntes dejados sobre la interfaz, de cualquier vista.</p>
        </div>
        <button
          onClick={() => {
            if (confirm("¿Eliminar absolutamente todas las anotaciones?")) deleteAllMutation.mutate();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition"
        >
          <Trash2 className="h-4 w-4" /> Eliminar todo
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-2xl">
          <MessageSquareText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-semibold">No hay anotaciones</h3>
          <p className="text-xs text-muted-foreground mt-1">Nadie ha dejado feedback todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning-foreground text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Hay {notes.length} anotaciones en total, a través de todas las vistas.</span>
          </div>

          {notes.map((note) => (
            <div key={note.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono p-2 border border-border rounded-lg bg-[#FFFBEA] text-slate-800 inline-block max-w-full break-words">
                  {note.text || <span className="italic text-muted-foreground">Nota vacía</span>}
                </p>
                <div className="mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent text-accent-foreground">
                    Contexto: {note.magnetId}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {note.url ? (
                  <a
                    href={note.url}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent/50 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ir a la vista
                  </a>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">Sin URL</span>
                )}
                <button
                  onClick={() => deleteOneMutation.mutate(note.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  aria-label="Eliminar anotación"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
