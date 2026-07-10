import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/app/GlassCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { equipoCargas, calidadCVs } from "@/lib/mock-data";
import { AlertTriangle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/equipo")({
  head: () => ({ meta: [{ title: "Dashboard de Equipo · RIWI MATCH" }] }),
  component: Equipo,
});

function Equipo() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Liderazgo TA</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard de equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">Vista consolidada del equipo de Talent Acquisition.</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 text-sm rounded-xl bg-background/70 border border-border">
            <option>Últimos 30 días</option><option>Este trimestre</option><option>Este año</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-xl bg-background/70 border border-border">
            <option>Todo el equipo</option><option>Camila Restrepo</option><option>Julián Marín</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ["Procesos activos", "12"],
          ["CVs cargados", "221"],
          ["Match promedio", "73%"],
          ["Profilings completados", "67%"],
          ["Costo del periodo", "$1,284"],
        ].map(([l, v]) => (
          <GlassCard key={l} className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="mt-2 text-2xl font-bold">{v}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="text-sm font-semibold mb-3">CVs cargados por recruiter</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={equipoCargas}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
                <XAxis dataKey="recruiter" stroke="hsl(233 20% 46%)" fontSize={11} />
                <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="cvs" fill="hsl(248 100% 68%)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-sm font-semibold mb-3">Tendencia de calidad de CVs recibidos</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={calidadCVs}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" />
                <XAxis dataKey="semana" stroke="hsl(233 20% 46%)" fontSize={11} />
                <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="calidad" stroke="hsl(285 92% 65%)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border/40 text-sm font-semibold">Efectividad de avance por proceso</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
              <th className="text-left px-5 py-3 font-medium">Proceso</th>
              <th className="text-left px-3 py-3 font-medium">Recruiter</th>
              <th className="text-right px-3 py-3 font-medium">Candidatos</th>
              <th className="text-right px-3 py-3 font-medium">% Avance Alta</th>
              <th className="text-right px-3 py-3 font-medium">Costo</th>
              <th className="text-center px-3 py-3 font-medium">Flag</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Backend Node Sr", "Camila R.", 24, 38, "$184.50", false],
              ["Data Engineer", "Julián M.", 18, 28, "$92.30", false],
              ["Product Designer Sr", "Andrés L.", 14, 58, "$145.00", false],
              ["QA Automation Jr", "Camila R.", 31, 11, "$12.40", true],
            ].map((r, i) => (
              <tr key={i} className="border-t border-border/30">
                <td className="px-5 py-3 font-medium">{r[0]}</td>
                <td className="px-3 py-3 text-muted-foreground">{r[1]}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r[2]}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">{r[3]}%</td>
                <td className="px-3 py-3 text-right tabular-nums">{r[4]}</td>
                <td className="px-3 py-3 text-center">{r[5] && "🔻"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard className="border-l-4 border-info">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Insight detectado</div>
            <div className="text-sm text-muted-foreground mt-1">
              El proceso "QA Automation Jr" tiene <span className="text-destructive font-semibold">62% de CVs con error de lectura</span> — revisar la fuente de hunting o el formato exigido.
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
