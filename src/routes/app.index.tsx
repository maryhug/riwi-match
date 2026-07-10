import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, FileText, PhoneCall, CheckCircle2, DollarSign, Filter, MoreHorizontal, TrendingUp } from "lucide-react";
import { procesos, type ProcesoEstado } from "@/lib/mock-data";
import { GlassCard } from "@/components/app/GlassCard";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Procesos · RIWI MATCH" }] }),
  component: Inicio,
});

const estadoColors: Record<ProcesoEstado, string> = {
  "Borrador": "bg-muted text-muted-foreground",
  "CVs cargados": "bg-info/30 text-info-foreground",
  "Match procesado": "bg-primary/15 text-primary",
  "Profiling configurado": "bg-accent text-accent-foreground",
  "Profiling en ejecución": "bg-primary text-primary-foreground",
  "Profiling completado": "bg-success/20 text-success",
  "Cerrado": "bg-foreground/10 text-foreground",
  "Archivado": "bg-muted text-muted-foreground/60",
};

const spark = [{v:10},{v:14},{v:12},{v:18},{v:22},{v:20},{v:28},{v:26},{v:34}];

function KPI({ icon: Icon, label, value, sub, accent, sparkline }: any) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />{sub}</div>}
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {sparkline && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-70">
          <ResponsiveContainer>
            <LineChart data={spark}>
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
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Talent Acquisition</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Procesos de contratación</h1>
          <p className="text-sm text-muted-foreground mt-1">Operación viva del equipo · {procesos.length} procesos registrados</p>
        </div>
        <Link
          to="/app/procesos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> Crear proceso
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={FileText} label="Procesos activos" value="6" sub="+2 vs mes pasado" accent="bg-primary" />
        <KPI icon={CheckCircle2} label="CVs procesados (mes)" value="221" sub="+18%" accent="bg-success" />
        <KPI icon={PhoneCall} label="Profilings completados" value="47" sub="+12%" accent="bg-info text-info-foreground" />
        <KPI icon={DollarSign} label="Costo del mes" value="$777.20" sub="dentro de presupuesto" accent="bg-warning text-warning-foreground" sparkline />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border/40">
          <div className="text-sm font-semibold">Listado de procesos</div>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-background/60 border border-border hover:bg-background transition">
            <Filter className="h-3.5 w-3.5" /> Estado
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-background/60 border border-border hover:bg-background transition">
            <Filter className="h-3.5 w-3.5" /> Reclutador
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-background/60 border border-border hover:bg-background transition">
            <Filter className="h-3.5 w-3.5" /> Área
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                <th className="text-left font-medium px-5 py-3">Proceso</th>
                <th className="text-left font-medium px-3 py-3">Área</th>
                <th className="text-left font-medium px-3 py-3">Reclutador</th>
                <th className="text-left font-medium px-3 py-3">Estado</th>
                <th className="text-right font-medium px-3 py-3">Cand.</th>
                <th className="text-right font-medium px-3 py-3">Match prom.</th>
                <th className="text-right font-medium px-3 py-3">Costo</th>
                <th className="text-left font-medium px-3 py-3">Fecha</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {procesos.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate({ to: "/app/procesos/$id", params: { id: p.id } })}
                  className="cursor-pointer border-t border-border/30 hover:bg-accent/30 transition"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium hover:text-primary transition">{p.nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.cargo} · {p.seniority}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{p.area}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted grid place-items-center text-[10px] font-bold text-foreground">
                        {p.reclutador.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>
                      <span className="text-xs">{p.reclutador}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold ${estadoColors[p.estado]}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.candidatos}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {p.promedioMatch > 0 ? <span className="font-semibold">{p.promedioMatch}%</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <div>${p.costo.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">de ${p.presupuesto}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{p.fecha}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition"
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
