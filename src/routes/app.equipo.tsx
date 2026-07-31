import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { getTADashboard } from "@/lib/api/reports.functions";
import { getDashboardMetrics } from "@/lib/api/metrics.functions";
import { getProcesses } from "@/lib/api/processes.functions";
import { PROCESS_STATUS_LABEL, USER_ROLE_LABEL } from "@/lib/types/enums";

export const Route = createFileRoute("/app/equipo")({
  head: () => ({ meta: [{ title: "Dashboard de Equipo · RIWI MATCH" }] }),
  component: Equipo,
});

const PAGE_SIZE = 10;

function Equipo() {
  const [teamMemberFilter, setTeamMemberFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: ta, isLoading: taLoading } = useQuery({
    queryKey: ["ta-dashboard"],
    queryFn: () => getTADashboard(),
  });
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => getDashboardMetrics(),
  });
  const { data: processesData } = useQuery({
    queryKey: ["processes"],
    queryFn: () => getProcesses(),
  });

  const profilingsCount =
    metrics?.cost_by_operation.find((o) => o.operation_type === "ANSWER_EVALUATION")?.count ?? 0;

  const processCostMap = useMemo(() => {
    const m = new Map<string, { total_cost: number; candidate_count: number }>();
    for (const cp of metrics?.cost_by_process ?? []) m.set(cp.process_id, cp);
    return m;
  }, [metrics]);

  const rows = useMemo(() => {
    return (processesData?.processes ?? [])
      .filter((p) => !teamMemberFilter || p.recruiter_id === teamMemberFilter)
      .map((p) => ({
        ...p,
        cost: processCostMap.get(p.process_id)?.total_cost ?? 0,
        candidates: processCostMap.get(p.process_id)?.candidate_count ?? 0,
      }));
  }, [processesData, teamMemberFilter, processCostMap]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const isLoading = taLoading || metricsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Liderazgo TA
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard de equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista consolidada del equipo de Talent Acquisition.
          </p>
        </div>
        <AppSelect
          value={teamMemberFilter ?? "all"}
          onValueChange={(value) => {
            setTeamMemberFilter(value === "all" ? null : value);
            setPage(1);
          }}
          className="w-full sm:w-64"
        >
          <AppSelectItem value="all">Todo el equipo</AppSelectItem>
          {(ta?.team_members ?? []).map((member) => (
            <AppSelectItem key={member.id} value={member.id}>
              {member.name} · {USER_ROLE_LABEL[member.role]}
            </AppSelectItem>
          ))}
        </AppSelect>
      </div>

      {isLoading ? (
        <LoadingIndicator className="py-16" label="Cargando métricas del equipo…" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ["Procesos activos", String(ta?.active_processes ?? 0)],
              ["Total procesos", String(ta?.total_processes ?? 0)],
              ["Candidatos totales", String(ta?.total_candidates ?? 0)],
              ["Profilings evaluados", String(profilingsCount)],
              ["Costo total", `$${(ta?.total_cost_usd ?? 0).toFixed(2)}`],
            ].map(([l, v]) => (
              <div
                key={l}
                className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {l}
                </div>
                <div className="mt-2 text-2xl font-bold">{v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5">
              <div className="text-sm font-semibold mb-3">Costo por reclutador</div>
              {(metrics?.cost_by_user ?? []).length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                  Sin datos aún.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={metrics!.cost_by_user}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
                      <XAxis dataKey="user_name" stroke="hsl(233 20% 46%)" fontSize={11} />
                      <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
                      <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                      <Bar dataKey="total_cost" fill="hsl(248 100% 68%)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5">
              <div className="text-sm font-semibold mb-3">Tendencia de consumo diario</div>
              {(metrics?.daily_costs ?? []).length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                  Sin datos aún.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={metrics!.daily_costs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(233 20% 46%)"
                        fontSize={10}
                        tickFormatter={(d: string) => d.slice(5)}
                      />
                      <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
                      <Tooltip formatter={(v: number) => `$${v.toFixed(4)}`} />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="hsl(285 92% 65%)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-border/40 text-sm font-semibold">
              Procesos por reclutador
            </div>
            {rows.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Sin procesos.</div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                      <th className="text-left px-5 py-3 font-medium">Proceso</th>
                      <th className="text-left px-3 py-3 font-medium">Reclutador</th>
                      <th className="text-left px-3 py-3 font-medium">Estado</th>
                      <th className="text-right px-3 py-3 font-medium">Candidatos</th>
                      <th className="text-right px-3 py-3 font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((p) => (
                      <tr key={p.process_id} className="border-t border-border/30">
                        <td className="px-5 py-3 font-medium">{p.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{p.recruiter_name}</td>
                        <td className="px-3 py-3 text-xs">{PROCESS_STATUS_LABEL[p.status]}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{p.candidates}</td>
                        <td className="px-3 py-3 text-right tabular-nums">${p.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 text-xs text-muted-foreground">
                    <div>
                      Mostrando{" "}
                      <span className="font-semibold text-foreground">
                        {(page - 1) * PAGE_SIZE + 1}
                      </span>{" "}
                      -{" "}
                      <span className="font-semibold text-foreground">
                        {Math.min(page * PAGE_SIZE, rows.length)}
                      </span>{" "}
                      de <span className="font-semibold text-foreground">{rows.length}</span>{" "}
                      procesos
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 text-xs font-medium">
                        Página {page} de {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Página siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
