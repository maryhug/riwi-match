import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, FileText, PhoneCall, CheckCircle2, DollarSign, Filter, MoreHorizontal, Archive, XCircle } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { getProcesses, updateProcessStatus } from "@/lib/api/processes.functions";
import { getDashboardMetrics } from "@/lib/api/metrics.functions";
import { PROCESS_STATUS_LABEL, type ProcessStatus } from "@/lib/types/enums";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Procesos · RIWI MATCH" }] }),
  component: Inicio,
});

const estadoColors: Record<ProcessStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  CVS_UPLOADED: "bg-info/30 text-info-foreground",
  MATCH_PROCESSING: "bg-accent text-accent-foreground",
  MATCH_DONE: "bg-primary/15 text-primary",
  PROFILING_CONFIGURED: "bg-accent text-accent-foreground",
  PROFILING_ACTIVE: "bg-primary text-primary-foreground",
  PROFILING_COMPLETED: "bg-success/20 text-success",
  CLOSED: "bg-foreground/10 text-foreground",
  ARCHIVED: "bg-muted text-muted-foreground/60",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function KPI({ icon: Icon, label, value, accent, sparkline }: {
  icon: React.ElementType; label: string; value: string; accent: string;
  sparkline?: { v: number }[];
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-70">
          <ResponsiveContainer>
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke="hsl(248 100% 68%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}

function Inicio() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [estadoFilter, setEstadoFilter] = useState<ProcessStatus | null>(null);
  const [reclutadorFilter, setReclutadorFilter] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const { data: processesData, isLoading } = useQuery({
    queryKey: ["processes"],
    queryFn: () => getProcesses(),
  });

  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => getDashboardMetrics(),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { processId: string; status: string }) => updateProcessStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Estado del proceso actualizado");
      qc.invalidateQueries({ queryKey: ["processes"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el proceso");
    },
  });

  const procesos = processesData?.processes ?? [];

  const { reclutadores, areas } = useMemo(() => {
    const r = new Set<string>();
    const a = new Set<string>();
    for (const p of procesos) {
      r.add(p.recruiter_name);
      a.add(p.area);
    }
    return { reclutadores: [...r], areas: [...a] };
  }, [procesos]);

  const filtered = procesos.filter((p) =>
    (!estadoFilter || p.status === estadoFilter) &&
    (!reclutadorFilter || p.recruiter_name === reclutadorFilter) &&
    (!areaFilter || p.area === areaFilter),
  );

  const procesosActivos = procesos.filter((p) => p.status !== "CLOSED" && p.status !== "ARCHIVED").length;

  const cvExtraction = metrics?.cost_by_operation.find((o) => o.operation_type === "CV_EXTRACTION");
  const profilingsCompletados = metrics?.cost_by_operation.find((o) => o.operation_type === "ANSWER_EVALUATION");

  const now = new Date();
  const costoDelMes = (metrics?.daily_costs ?? [])
    .filter((d) => d.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`))
    .reduce((sum, d) => sum + d.cost, 0);

  const sparkline = (metrics?.daily_costs ?? []).slice(-14).map((d) => ({ v: d.cost }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Talent Acquisition</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Procesos de contratación</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operación viva del equipo · {procesos.length} proceso{procesos.length === 1 ? "" : "s"} registrado{procesos.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          to="/app/procesos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> Crear proceso
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={FileText} label="Procesos activos" value={String(procesosActivos)} accent="bg-primary" />
        <KPI icon={CheckCircle2} label="CVs procesados" value={String(cvExtraction?.count ?? 0)} accent="bg-success" />
        <KPI icon={PhoneCall} label="Profilings evaluados" value={String(profilingsCompletados?.count ?? 0)} accent="bg-info text-info-foreground" />
        <KPI icon={DollarSign} label="Costo del mes" value={`$${costoDelMes.toFixed(2)}`} accent="bg-warning text-warning-foreground" sparkline={sparkline} />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border/40">
          <div className="text-sm font-semibold">Listado de procesos</div>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition",
              estadoFilter ? "bg-primary/10 border-primary text-primary" : "bg-background/60 border-border hover:bg-background",
            )}>
              <Filter className="h-3.5 w-3.5" /> {estadoFilter ? PROCESS_STATUS_LABEL[estadoFilter] : "Estado"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEstadoFilter(null)}>Todos</DropdownMenuItem>
              {(Object.keys(PROCESS_STATUS_LABEL) as ProcessStatus[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setEstadoFilter(s)}>
                  {PROCESS_STATUS_LABEL[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition",
              reclutadorFilter ? "bg-primary/10 border-primary text-primary" : "bg-background/60 border-border hover:bg-background",
            )}>
              <Filter className="h-3.5 w-3.5" /> {reclutadorFilter ?? "Reclutador"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setReclutadorFilter(null)}>Todos</DropdownMenuItem>
              {reclutadores.map((r) => (
                <DropdownMenuItem key={r} onClick={() => setReclutadorFilter(r)}>{r}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition",
              areaFilter ? "bg-primary/10 border-primary text-primary" : "bg-background/60 border-border hover:bg-background",
            )}>
              <Filter className="h-3.5 w-3.5" /> {areaFilter ?? "Área"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAreaFilter(null)}>Todas</DropdownMenuItem>
              {areas.map((a) => (
                <DropdownMenuItem key={a} onClick={() => setAreaFilter(a)}>{a}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Cargando procesos…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {procesos.length === 0
              ? "No tienes procesos aún. Crea uno para comenzar."
              : "Ningún proceso coincide con los filtros aplicados."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                  <th className="text-left font-medium px-5 py-3">Proceso</th>
                  <th className="text-left font-medium px-3 py-3">Área</th>
                  <th className="text-left font-medium px-3 py-3">Reclutador</th>
                  <th className="text-left font-medium px-3 py-3">Estado</th>
                  <th className="text-right font-medium px-3 py-3">Presupuesto</th>
                  <th className="text-left font-medium px-3 py-3">Fecha</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.process_id}
                    onClick={() => navigate({ to: "/app/procesos/$id", params: { id: p.process_id } })}
                    className="cursor-pointer border-t border-border/30 hover:bg-accent/30 transition"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium hover:text-primary transition">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.job_title} · {p.seniority}</div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{p.area}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted grid place-items-center text-[10px] font-bold text-foreground">
                          {initials(p.recruiter_name)}
                        </div>
                        <span className="text-xs">{p.recruiter_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold ${estadoColors[p.status]}`}>
                        {PROCESS_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {p.budget_max_usd > 0 ? `$${p.budget_max_usd.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {p.status !== "CLOSED" && p.status !== "ARCHIVED" && (
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate({ processId: p.process_id, status: "CLOSED" })}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-2" /> Cerrar proceso
                            </DropdownMenuItem>
                          )}
                          {p.status === "CLOSED" && (
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate({ processId: p.process_id, status: "ARCHIVED" })}
                            >
                              <Archive className="h-3.5 w-3.5 mr-2" /> Archivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
