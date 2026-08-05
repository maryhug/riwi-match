import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Search,
  Users,
} from "lucide-react";
import { GlassCard } from "@/components/app/GlassCard";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { globalSearch } from "@/lib/api/search.functions";

export const Route = createFileRoute("/app/buscar")({
  validateSearch: z.object({ q: z.string().catch("") }),
  head: () => ({ meta: [{ title: "Match" }] }),
  component: SearchResults,
});

function ResultGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Search;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/40 px-5 py-4">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </GlassCard>
  );
}

function SearchResults() {
  const { q } = Route.useSearch();
  const query = q.trim();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => setPage(1), [query]);
  const { data, isLoading } = useQuery({
    queryKey: ["global-search", query, page],
    queryFn: () =>
      globalSearch({ data: { query, limit: pageSize, offset: (page - 1) * pageSize } }),
    enabled: query.length >= 2,
  });
  const visibleResultCount =
    (data?.processes.length ?? 0) +
    (data?.candidates.length ?? 0) +
    (data?.question_sets.length ?? 0);
  const resultCount = data?.total ?? visibleResultCount;
  const totalPages = Math.max(1, Math.ceil(resultCount / pageSize));

  if (query.length < 2) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Escribe al menos dos caracteres para buscar.
      </div>
    );
  }
  if (isLoading) return <LoadingIndicator className="py-20" label="Buscando…" />;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Búsqueda global
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Resultados para “{query}”</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {resultCount} resultado(s) en procesos, candidatos y sets.
        </p>
      </div>

      <div className="space-y-4">
        {data?.processes.length ? (
          <ResultGroup icon={BriefcaseBusiness} title="Procesos">
            {data.processes.map((process) => (
              <Link
                key={process.id}
                to="/app/procesos/$id"
                params={{ id: process.id }}
                className="block border-b border-border/30 px-5 py-3 last:border-0 hover:bg-primary/5 transition"
              >
                <div className="text-sm font-semibold">{process.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {process.job_title} · {process.area}
                </div>
              </Link>
            ))}
          </ResultGroup>
        ) : null}
        {data?.candidates.length ? (
          <ResultGroup icon={Users} title="Candidatos">
            {data.candidates.map((candidate) => (
              <Link
                key={candidate.process_candidate_id}
                to="/app/procesos/$id"
                params={{ id: candidate.process_id }}
                className="block border-b border-border/30 px-5 py-3 last:border-0 hover:bg-primary/5 transition"
              >
                <div className="text-sm font-semibold">{candidate.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {candidate.email} · Proceso: {candidate.process_name}
                </div>
              </Link>
            ))}
          </ResultGroup>
        ) : null}
        {data?.question_sets.length ? (
          <ResultGroup icon={ListChecks} title="Sets de preguntas">
            {data.question_sets.map((set) => (
              <Link
                key={set.id}
                to="/app/sets/$id"
                params={{ id: set.id }}
                className="block border-b border-border/30 px-5 py-3 last:border-0 hover:bg-primary/5 transition"
              >
                <div className="text-sm font-semibold">{set.name}</div>
                {set.description && (
                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {set.description}
                  </div>
                )}
              </Link>
            ))}
          </ResultGroup>
        ) : null}
        {data && resultCount === 0 && visibleResultCount === 0 && (
          <GlassCard className="py-12 text-center text-sm text-muted-foreground">
            No encontramos resultados para esta búsqueda.
          </GlassCard>
        )}
        {resultCount > pageSize && (
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              Página {page} de {totalPages} · {resultCount} resultados
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
