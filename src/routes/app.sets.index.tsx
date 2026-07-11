import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { GlassCard } from "@/components/app/GlassCard";
import { getQuestionSets } from "@/lib/api/question-sets.functions";
import { QUESTION_SET_STATUS_LABEL } from "@/lib/types/enums";

export const Route = createFileRoute("/app/sets/")({
  head: () => ({ meta: [{ title: "Sets de Preguntas · RIWI MATCH" }] }),
  component: Sets,
});

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success",
  DRAFT: "bg-warning/20 text-warning-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

function Sets() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["question-sets"],
    queryFn: () => getQuestionSets(),
  });
  const sets = data?.question_sets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Configuración
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sets de preguntas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plantillas de profiling automatizado.
          </p>
        </div>
        <Link
          to="/app/sets/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30"
        >
          <Plus className="h-4 w-4" /> Nuevo set
        </Link>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Cargando sets…</div>
      ) : sets.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No hay sets de preguntas. Crea uno para configurar profiling.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((s) => (
            <GlassCard
              key={s.id}
              className="cursor-pointer"
              onClick={() => navigate({ to: "/app/sets/$id", params: { id: s.id } })}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-info">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-accent-foreground">
                    v{s.version}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[s.status]}`}
                  >
                    {QUESTION_SET_STATUS_LABEL[s.status]}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold leading-tight">{s.name}</h3>
              {s.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                {s.questions?.length ?? 0} pregunta{(s.questions?.length ?? 0) === 1 ? "" : "s"}
              </div>
              {s.status === "ACTIVE" && (
                <div className="mt-3 text-[11px] text-warning bg-warning/10 rounded-lg px-2 py-1.5">
                  Editar este set creará una nueva versión.
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
