import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DollarSign, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { LoadingIndicator } from "@/components/app/LoadingIndicator";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { getDashboardMetrics, getProcessDashboardMetrics } from "@/lib/api/metrics.functions";
import { getGlobalSettings, updateGlobalSetting } from "@/lib/api/ai-config.functions";
import { getProcesses } from "@/lib/api/processes.functions";
import { useAuth } from "@/lib/auth-context";
import { OPERATION_TYPE_LABEL } from "@/lib/types/enums";

export const Route = createFileRoute("/app/costos")({
  head: () => ({ meta: [{ title: "Match" }] }),
  component: Costos,
});

type Period = "daily" | "weekly" | "monthly";

function groupByPeriod(daily: { date: string; cost: number }[], period: Period) {
  if (period === "daily") return daily.map((d) => ({ label: d.date.slice(5), costo: d.cost }));
  const buckets = new Map<string, number>();
  for (const d of daily) {
    const dt = new Date(d.date);
    let key: string;
    if (period === "weekly") {
      const weekStart = new Date(dt);
      weekStart.setDate(dt.getDate() - dt.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = d.date.slice(0, 7);
    }
    buckets.set(key, (buckets.get(key) ?? 0) + d.cost);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, costo]) => ({ label, costo }));
}

function formatRelativeTime(timestampMs: number): string {
  if (!timestampMs) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - timestampMs) / 1000));
  if (seconds < 5) return "hace un momento";
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours} h`;
}

const TOTAL_BUDGET_KEY = "platform_total_budget";

function Costos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("daily");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [processFilter, setProcessFilter] = useState<string | null>(null);

  const {
    data: globalMetrics,
    isLoading: isLoadingGlobalMetrics,
    dataUpdatedAt: globalUpdatedAt,
    isFetching: isFetchingGlobal,
    refetch: refetchGlobal,
  } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => getDashboardMetrics(),
  });

  const {
    data: filteredMetrics,
    isLoading: isLoadingFilteredMetrics,
    dataUpdatedAt: filteredUpdatedAt,
    isFetching: isFetchingFiltered,
    refetch: refetchFiltered,
  } = useQuery({
    queryKey: ["dashboard-metrics", processFilter],
    queryFn: () => getProcessDashboardMetrics({ data: { processId: processFilter! } }),
    enabled: Boolean(processFilter),
  });

  const { data: processesData } = useQuery({
    queryKey: ["processes"],
    queryFn: () => getProcesses(),
  });

  const metrics = processFilter ? filteredMetrics : globalMetrics;
  const metricsUpdatedAt = processFilter ? filteredUpdatedAt : globalUpdatedAt;
  const isFetchingMetrics = processFilter ? isFetchingFiltered : isFetchingGlobal;
  const refetchMetrics = processFilter ? refetchFiltered : refetchGlobal;

  const { data: settingsData } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => getGlobalSettings(),
  });

  const settingsMap = useMemo(() => {
    const m = new Map<string, unknown>();
    for (const s of settingsData?.settings ?? []) m.set(s.setting_key, s.setting_value);
    return m;
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      updateGlobalSetting({ data: { key, value: { amount: value } } }),
    onSuccess: () => {
      toast.success("Límite actualizado");
      qc.invalidateQueries({ queryKey: ["global-settings"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  if (
    isLoadingGlobalMetrics ||
    (processFilter && isLoadingFilteredMetrics) ||
    !metrics ||
    !globalMetrics
  ) {
    return <LoadingIndicator className="py-16" label="Cargando costos…" />;
  }

  const now = new Date();
  const costoDelMes = metrics.daily_costs
    .filter((d) =>
      d.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`),
    )
    .reduce((s, d) => s + d.cost, 0);

  const cvExtraction = metrics.cost_by_operation.find((o) => o.operation_type === "CV_EXTRACTION");
  const profilingEvaluation = metrics.cost_by_operation.find(
    (o) => o.operation_type === "ANSWER_EVALUATION",
  );
  const cvPipelineTypes = new Set(["CV_STORAGE", "CV_EXTRACTION", "CV_EMBEDDING", "CV_MATCH"]);
  const profilingTypes = new Set(["VOICE_CALL", "TWILIO_CALL", "ANSWER_EVALUATION"]);
  const cvPipelineCost = metrics.cost_by_operation
    .filter((o) => cvPipelineTypes.has(o.operation_type))
    .reduce((sum, operation) => sum + operation.total_cost, 0);
  const profilingCost = metrics.cost_by_operation
    .filter((o) => profilingTypes.has(o.operation_type))
    .reduce((sum, operation) => sum + operation.total_cost, 0);

  const chartData = groupByPeriod(metrics.daily_costs, period);

  const isAdmin = user?.role === "ADMIN";
  const configuredBudget = settingsMap.get(TOTAL_BUDGET_KEY) as { amount?: number } | undefined;
  const totalBudget = configuredBudget?.amount ?? 0;
  const budgetUsage = totalBudget > 0 ? (globalMetrics.total_cost_usd / totalBudget) * 100 : 0;
  const totalBudgetEdit = edits[TOTAL_BUDGET_KEY] ?? (totalBudget > 0 ? String(totalBudget) : "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Finanzas
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Costos y consumo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seguimiento por operación, proceso y recruiter.
          </p>
          <button
            onClick={() => refetchMetrics()}
            disabled={isFetchingMetrics}
            title="Estos datos son una foto al momento de cargar la página, no un stream en vivo — usa este botón para refrescarlos"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 ${isFetchingMetrics ? "animate-spin" : ""}`} />
            Actualizado {formatRelativeTime(metricsUpdatedAt)} · no es en tiempo real
          </button>
        </div>
        <AppSelect
          value={processFilter ?? "all"}
          onValueChange={(value) => setProcessFilter(value === "all" ? null : value)}
          className="w-full sm:w-72"
          placeholder="Filtrar por proceso"
        >
          <AppSelectItem value="all">Todos los procesos</AppSelectItem>
          {(processesData?.processes ?? []).map((process) => (
            <AppSelectItem key={process.process_id} value={process.process_id}>
              {process.name}
            </AppSelectItem>
          ))}
        </AppSelect>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Costo total histórico", `$${metrics.total_cost_usd.toFixed(2)}`],
          ["Costo del mes", `$${costoDelMes.toFixed(2)}`],
          [
            "Costo prom. / CV",
            cvExtraction && cvExtraction.count > 0
              ? `$${(cvPipelineCost / cvExtraction.count).toFixed(4)}`
              : "—",
          ],
          [
            "Costo prom. / profiling",
            profilingEvaluation && profilingEvaluation.count > 0
              ? `$${(profilingCost / profilingEvaluation.count).toFixed(4)}`
              : "—",
          ],
        ].map(([l, v]) => (
          <GlassCard key={l} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {l}
                </div>
                <div className="mt-2 text-2xl font-bold">{v}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning grid place-items-center text-warning-foreground">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Consumo del periodo</div>
          <div className="flex gap-1 text-xs">
            {(
              [
                ["daily", "Diario"],
                ["weekly", "Semanal"],
                ["monthly", "Mensual"],
              ] as const
            ).map(([p, label]) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Sin datos de consumo aún.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(248 100% 68%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(248 100% 68%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
                <XAxis dataKey="label" stroke="hsl(233 20% 46%)" fontSize={11} />
                <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="costo"
                  stroke="hsl(248 100% 68%)"
                  strokeWidth={2.5}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-0">
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Control financiero
                  </div>
                  <h2 className="mt-0.5 text-lg font-bold tracking-tight">Presupuesto global</h2>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Define el máximo acumulado de todos los procesos. Al alcanzarlo, no será posible
                crear nuevos procesos.
              </p>
            </div>

            <div className="sm:w-40">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Límite total (USD)
              </div>
              {isAdmin ? (
                <>
                  <input
                    value={totalBudgetEdit}
                    inputMode="decimal"
                    onChange={(e) => setEdits({ ...edits, [TOTAL_BUDGET_KEY]: e.target.value })}
                    onBlur={() => {
                      if (edits[TOTAL_BUDGET_KEY] === undefined) return;
                      const value = edits[TOTAL_BUDGET_KEY].trim();
                      const num = value === "" ? 0 : Number(value);
                      if (!Number.isNaN(num) && num >= 0)
                        saveMutation.mutate({ key: TOTAL_BUDGET_KEY, value: num });
                    }}
                    placeholder="Sin límite"
                    className="h-10 w-full rounded-lg border border-primary/25 bg-background/80 px-3 text-right text-base font-semibold tabular-nums shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {totalBudget > 0 && (
                    <div className="mt-2 text-right text-[11px] text-muted-foreground">
                      Llevas ${globalMetrics.total_cost_usd.toFixed(2)} de ${totalBudget.toFixed(2)}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-10 items-center rounded-lg border border-border bg-background/60 px-3 text-base font-semibold tabular-nums">
                  {totalBudget > 0 ? `$${totalBudget.toFixed(2)}` : "Sin límite"}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-primary/15 bg-background/30 px-5 py-4">
            {totalBudget <= 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay un presupuesto global configurado. Déjalo vacío si no deseas limitar la
                creación de procesos.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <div className="text-xl font-bold tabular-nums">
                      ${globalMetrics.total_cost_usd.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      consumidos de ${totalBudget.toFixed(2)} USD
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {budgetUsage.toFixed(1)}% utilizado
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className={
                      budgetUsage >= 100
                        ? "h-full bg-destructive"
                        : budgetUsage >= 80
                          ? "h-full bg-warning"
                          : "h-full bg-primary"
                    }
                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                  />
                </div>
                {budgetUsage >= 100 ? (
                  <Alert pct={budgetUsage} label="Presupuesto total alcanzado" />
                ) : budgetUsage >= 80 ? (
                  <Alert pct={budgetUsage} label="Presupuesto total próximo al límite" />
                ) : null}
              </div>
            )}
            {!isAdmin && (
              <p className="mt-3 text-xs text-muted-foreground">
                Solo un administrador puede editar el presupuesto global.
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border/40 text-sm font-semibold">Por operación</div>
          {metrics.cost_by_operation.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Sin datos aún.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {metrics.cost_by_operation.map((r) => (
                  <tr key={r.operation_type} className="border-t border-border/30">
                    <td className="px-5 py-3 font-medium">
                      {OPERATION_TYPE_LABEL[
                        r.operation_type as keyof typeof OPERATION_TYPE_LABEL
                      ] ?? r.operation_type}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {r.count} operación(es)
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      ${r.total_cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Alert({ pct, label }: { pct: number; label: string }) {
  const destructive = pct >= 100;
  const cls = destructive
    ? "bg-destructive/15 text-destructive border-destructive/40 border-2"
    : "bg-warning/15 text-warning-foreground border-warning/30";
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${cls} text-xs`}>
      <AlertTriangle className={destructive ? "h-4 w-4 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      <span className="flex-1 font-medium">{label}</span>
      <span className="font-bold tabular-nums">{pct.toFixed(1)}%</span>
    </div>
  );
}
