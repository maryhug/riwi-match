import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/app/GlassCard";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
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

const PAGE_SIZE = 9;

function Sets() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["question-sets"],
    queryFn: () => getQuestionSets(),
  });

  const sets = data?.question_sets ?? [];
  const totalPages = Math.ceil(sets.length / PAGE_SIZE) || 1;

  const paginatedSets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sets.slice(start, start + PAGE_SIZE);
  }, [sets, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Configuración
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sets de preguntas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plantillas de profiling automatizado · {sets.length} plantilla
            {sets.length === 1 ? "" : "s"} registrada{sets.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          to="/app/sets/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> Nuevo set
        </Link>
      </div>

      {isLoading ? (
        <LoadingIndicator className="py-16" label="Cargando sets…" />
      ) : sets.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No hay sets de preguntas. Crea uno para configurar profiling.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Uniform 3x3 Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSets.map((s) => (
              <GlassCard
                key={s.id}
                className="cursor-pointer h-[210px] flex flex-col justify-between p-5 hover:border-primary/40 transition"
                onClick={() => navigate({ to: "/app/sets/$id", params: { id: s.id } })}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                  <h3 className="font-semibold leading-tight line-clamp-1 text-foreground" title={s.name}>
                    {s.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                    {s.description || "Sin descripción corta registrada."}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between mt-auto text-xs text-muted-foreground">
                  <span className="font-medium">
                    {s.questions?.length ?? 0} pregunta{(s.questions?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-medium">Plantilla de Profiling</span>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs text-muted-foreground">
              <div>
                Mostrando {(page - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(page * PAGE_SIZE, sets.length)} de {sets.length} sets de preguntas
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-foreground cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
                <span className="px-2 font-semibold text-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-foreground cursor-pointer"
                >
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
