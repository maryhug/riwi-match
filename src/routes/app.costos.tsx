import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/app/GlassCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { costoSerie } from "@/lib/mock-data";
import { DollarSign, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/costos")({
  head: () => ({ meta: [{ title: "Costos · RIWI MATCH" }] }),
  component: Costos,
});

function Costos() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Finanzas</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Costos y consumo</h1>
        <p className="text-sm text-muted-foreground mt-1">Seguimiento por modelo, proceso y recruiter.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Costo total histórico", "$8,421"],
          ["Costo del mes", "$777.20"],
          ["Costo prom. / CV", "$0.18"],
          ["Costo prom. / profiling", "$0.47"],
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
            {["Diario","Semanal","Mensual"].map((p,i) => (
              <button key={p} className={`px-3 py-1 rounded-md ${i===0?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-accent"}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={costoSerie}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(248 100% 68%)" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="hsl(248 100% 68%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
              <XAxis dataKey="dia" stroke="hsl(233 20% 46%)" fontSize={11} />
              <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="costo" stroke="hsl(248 100% 68%)" strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border/40 text-sm font-semibold">Por modelo</div>
          <table className="w-full text-sm">
            <tbody>
              {[
                ["gpt-X · análisis CV", "1.2M in / 340K out", "$18.40"],
                ["gpt-X · profiling eval", "820K in / 210K out", "$11.30"],
                ["Voz · llamadas", "47 llamadas · 3.2h", "$22.10"],
                ["Embeddings", "2.4M tokens", "$3.80"],
              ].map((r, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="px-5 py-3 font-medium">{r[0]}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{r[1]}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        <GlassCard>
          <div className="text-sm font-semibold mb-3">Límites y alertas</div>
          <div className="space-y-3 text-sm">
            {[
              ["Presupuesto máximo por proceso", "$250"],
              ["Presupuesto mensual", "$1,500"],
              ["Límite de CVs por proceso", "100"],
              ["Límite de llamadas/día", "60"],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center gap-3">
                <div className="flex-1 text-xs text-muted-foreground">{l}</div>
                <input defaultValue={v} className="w-28 px-2.5 py-1.5 text-sm text-right rounded-lg bg-background/70 border border-border" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Alert pct={80} label="Backend Sr · 80%" color="warning" />
            <Alert pct={92} label="Data Engineer · 92%" color="warning" />
            <Alert pct={100} label="Account Manager · 100%" color="destructive" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Alert({ pct, label, color }: { pct: number; label: string; color: string }) {
  const cls = color === "destructive" ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-warning/15 text-warning-foreground border-warning/30";
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cls} text-xs`}>
      <AlertTriangle className="h-3.5 w-3.5" />
      <span className="flex-1">{label}</span>
      <span className="font-bold">{pct}%</span>
    </div>
  );
}
