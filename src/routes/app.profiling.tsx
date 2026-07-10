import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall, Clock, CheckCircle2, XCircle, X, RefreshCw } from "lucide-react";
import { llamadas } from "@/lib/mock-data";
import { GlassCard } from "@/components/app/GlassCard";

export const Route = createFileRoute("/app/profiling")({
  head: () => ({ meta: [{ title: "Ejecución de Profiling · RIWI MATCH" }] }),
  component: Profiling,
});

function Profiling() {
  const activas = llamadas.filter(l => l.estado === "activa");
  const cola = llamadas.filter(l => l.estado === "cola");
  const completadas = llamadas.filter(l => l.estado === "completada");
  const fallidas = llamadas.filter(l => l.estado === "fallida");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Voice AI</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Ejecución de Profiling</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor en vivo de las llamadas de profiling automatizado.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Llamadas activas", v: "4 / 4", c: "from-primary to-info" },
          { l: "En cola", v: cola.length.toString(), c: "from-info to-success" },
          { l: "Completadas hoy", v: "12", c: "from-success to-warning" },
          { l: "Tasa de contacto", v: "78%", c: "from-warning to-destructive" },
        ].map((k) => (
          <GlassCard key={k.l} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
                <div className="mt-2 text-2xl font-bold">{k.v}</div>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${k.c} grid place-items-center text-white`}>
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
        <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground font-semibold">Máx 3 intentos</span>
        <span>·</span>
        <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground font-semibold">Cada 2h</span>
        <span>·</span>
        <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground font-semibold">Horario 8:00–18:00</span>
        <span className="flex-1" />
        <span>n8n + modelo de voz · cada llamada informa que es un asistente automatizado y solicita consentimiento.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* En llamada */}
        <Column title="En llamada" sub="máx. 4" count={activas.length} accent="primary">
          {activas.map((c) => (
            <GlassCard key={c.id} className="p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-info/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-info grid place-items-center text-white text-xs font-bold pulse-ring">
                      {c.candidato.split(" ").map(n=>n[0]).slice(0,2).join("")}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{c.candidato}</div>
                    <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                  </div>
                </div>
                <div className="flex items-end gap-0.5 h-8 mb-3">
                  {[0.5,0.9,0.7,1,0.6,0.85,0.5,0.95,0.7,0.6,0.9,0.55,0.8].map((h,i)=>(
                    <div key={i} className="flex-1 bg-gradient-to-t from-primary to-info rounded-sm wave-bar" style={{height:`${h*100}%`, animationDelay:`${i*0.08}s`}} />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duracion}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-semibold">En vivo</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </Column>

        {/* En cola */}
        <Column title="En cola" count={cola.length} accent="info">
          {cola.map((c) => (
            <GlassCard key={c.id} className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-info/30 text-info-foreground grid place-items-center text-xs font-bold">
                  #{c.posicion}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.candidato}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                </div>
                <button className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
            </GlassCard>
          ))}
        </Column>

        {/* Completadas */}
        <Column title="Completadas" count={completadas.length} accent="success">
          {completadas.map((c) => (
            <GlassCard key={c.id} className="p-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.candidato}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                </div>
                <button className="text-[10px] text-primary hover:underline">Respuestas</button>
              </div>
            </GlassCard>
          ))}
        </Column>

        {/* Fallidas */}
        <Column title="No contestadas" count={fallidas.length} accent="destructive">
          {fallidas.map((c) => (
            <GlassCard key={c.id} className="p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.candidato}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive font-semibold inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Reintento {c.intento}/3
                </span>
                <span className="text-muted-foreground">{c.proximoIntento}</span>
              </div>
            </GlassCard>
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, sub, count, accent, children }: any) {
  const accentMap: Record<string,string> = {
    primary: "bg-primary",
    info: "bg-info",
    success: "bg-success",
    destructive: "bg-destructive",
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className={`h-2 w-2 rounded-full ${accentMap[accent]}`} />
        <div className="text-sm font-semibold">{title}</div>
        {sub && <div className="text-[10px] text-muted-foreground">({sub})</div>}
        <div className="flex-1" />
        <span className="text-xs font-bold text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
