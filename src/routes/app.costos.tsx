import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/app/GlassCard";
import { getDashboardMetrics } from "@/lib/api/metrics.functions";
import { getGlobalSettings, updateGlobalSetting } from "@/lib/api/ai-config.functions";
import { getProcesses } from "@/lib/api/processes.functions";
import { useAuth } from "@/lib/auth-context";
import { OPERATION_TYPE_LABEL } from "@/lib/types/enums";

export const Route = createFileRoute("/app/costos")({
  head: () => ({ meta: [{ title: "Costos · RIWI MATCH" }] }),
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
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, costo]) => ({ label, costo }));
}

const LIMIT_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "budget_max_per_process", label: "Presupuesto máximo por proceso (USD)", placeholder: "Sin límite" },
  { key: "monthly_budget", label: "Presupuesto mensual (USD)", placeholder: "Sin límite" },
  { key: "daily_call_limit", label: "Límite de llamadas/día", placeholder: "Sin límite" },
];

function Costos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("daily");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => getDashboardMetrics(),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => getGlobalSettings(),
  });

  const { data: processesData } = useQuery({ queryKey: ["processes"], queryFn: () => getProcesses() });

  const settingsMap = useMemo(() => {
    const m = new Map<string, unknown>();
    for (const s of settingsData?.settings ?? []) m.set(s.setting_key, s.setting_value);
    return m;
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      updateGlobalSetting({ data: { key, value: { amount: value } } }),
    onSuccess: () => { toast.success("Límite actualizado"); qc.invalidateQueries({ queryKey: ["global-settings"] }); },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  if (isLoading || !metrics) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Cargando costos…</div>;
  }

  const now = new Date();
  const costoDelMes = metrics.daily_costs
    .filter((d) => d.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`))
    .reduce((s, d) => s + d.cost, 0);

  const cvExtraction = metrics.cost_by_operation.find((o) => o.operation_type === "CV_EXTRACTION");
  const voiceCall = metrics.cost_by_operation.find((o) => o.operation_type === "VOICE_CALL");

  const chartData = groupByPeriod(metrics.daily_costs, period);

  const processesWithBudget = (processesData?.processes ?? []).filter((p) => p.budget_max_usd > 0);
  // No tenemos costo por proceso individual aquí sin N+1 — usamos cost_by_process del dashboard,
  // cruzado con el presupuesto de cada proceso, para mostrar alertas reales de consumo.
  const budgetAlerts = metrics.cost_by_process
    .map((cp) => {
      const proc = processesWithBudget.find((p) => p.process_id === cp.process_id);
      if (!proc) return null;
      const pct = Math.round((cp.total_cost / proc.budget_max_usd) * 100);
      return { name: cp.process_name, pct };
    })
    .filter((a): a is { name: string; pct: number } => a !== null && a.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Finanzas</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Costos y consumo</h1>
        <p className="text-sm text-muted-foreground mt-1">Seguimiento por operación, proceso y recruiter.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Costo total histórico", `$${metrics.total_cost_usd.toFixed(2)}`],
          ["Costo del mes", `$${costoDelMes.toFixed(2)}`],
          ["Costo prom. / CV", cvExtraction && cvExtraction.count > 0 ? `$${(cvExtraction.total_cost / cvExtraction.count).toFixed(4)}` : "—"],
          ["Costo prom. / profiling", voiceCall && voiceCall.count > 0 ? `$${(voiceCall.total_cost / voiceCall.count).toFixed(4)}` : "—"],
        ].map(([l, v]) => (
          <GlassCard key={l} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                <div className="mt-2 text-2xl font-bold">{v}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-warning to-destructive grid place-items-center text-white">
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
            {([["daily", "Diario"], ["weekly", "Semanal"], ["monthly", "Mensual"]] as const).map(([p, label]) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sin datos de consumo aún.</div>
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
                <Area type="monotone" dataKey="costo" stroke="hsl(248 100% 68%)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border/40 text-sm font-semibold">Por operación</div>
          {metrics.cost_by_operation.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Sin datos aún.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {metrics.cost_by_operation.map((r) => (
                  <tr key={r.operation_type} className="border-t border-border/30">
                    <td className="px-5 py-3 font-medium">{OPERATION_TYPE_LABEL[r.operation_type as keyof typeof OPERATION_TYPE_LABEL] ?? r.operation_type}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.count} operación(es)</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">${r.total_cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>

        <GlassCard>
          <div className="text-sm font-semibold mb-3">Límites y alertas</div>
          {isAdmin ? (
            <div className="space-y-3 text-sm">
              {LIMIT_FIELDS.map(({ key, label, placeholder }) => {
                const stored = settingsMap.get(key) as { amount?: number } | undefined;
                const value = edits[key] ?? (stored?.amount != null ? String(stored.amount) : "");
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1 text-xs text-muted-foreground">{label}</div>
                    <input
                      value={value}
                      onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                      onBlur={() => {
                        const num = Number(edits[key]);
                        if (edits[key] !== undefined && !Number.isNaN(num)) saveMutation.mutate({ key, value: num });
                      }}
                      placeholder={placeholder}
                      className="w-28 px-2.5 py-1.5 text-sm text-right rounded-lg bg-background/70 border border-border"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Solo un administrador puede editar los límites globales.</p>
          )}
          <div className="mt-4 space-y-2">
            {budgetAlerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ningún proceso ha alcanzado el 80% de su presupuesto.</p>
            ) : (
              budgetAlerts.map((a) => <Alert key={a.name} pct={a.pct} label={a.name} />)
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Alert({ pct, label }: { pct: number; label: string }) {
  const destructive = pct >= 100;
  const cls = destructive ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-warning/15 text-warning-foreground border-warning/30";
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cls} text-xs`}>
      <AlertTriangle className="h-3.5 w-3.5" />
      <span className="flex-1">{label}</span>
      <span className="font-bold">{pct}%</span>
    </div>
  );
}
