import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, FileText } from "lucide-react";
import { sets } from "@/lib/mock-data";
import { GlassCard } from "@/components/app/GlassCard";

export const Route = createFileRoute("/app/sets/")({
  head: () => ({ meta: [{ title: "Sets de Preguntas · RIWI MATCH" }] }),
  component: Sets,
});

function Sets() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Configuración</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sets de preguntas</h1>
          <p className="text-sm text-muted-foreground mt-1">Plantillas de profiling automatizado por cargo.</p>
        </div>
        <Link to="/app/sets/nuevo" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> Nuevo set
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((s) => (
          <GlassCard key={s.id} className="cursor-pointer" onClick={() => navigate({ to: "/app/sets/$id", params: { id: s.id } })}>
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
