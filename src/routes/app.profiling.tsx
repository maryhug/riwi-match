import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall, Clock, CheckCircle2, XCircle, X, RefreshCw } from "lucide-react";
import { llamadas } from "@/lib/mock-data";
import { GlassCard } from "@/components/app/GlassCard";
import { cn } from "@/lib/utils";

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
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold font-mono">Voice AI</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Ejecución de Profiling</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor en vivo de las llamadas de profiling automatizado.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Llamadas activas", v: "4 / 4", cn: "bg-primary text-primary-foreground" },
          { l: "En cola", v: cola.length.toString(), cn: "bg-indigo-500 text-white" },
          { l: "Completadas hoy", v: "12", cn: "bg-success text-success-foreground" },
          { l: "Tasa de contacto", v: "78%", cn: "bg-warning text-warning-foreground" },
        ].map((k) => (
          <GlassCard key={k.l} className="p-4 border-l-4 border-primary">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k.l}</div>
                <div className="mt-2 text-2xl font-bold">{k.v}</div>
              </div>
              <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0 shadow-sm", k.cn)}>
                <PhoneCall className="h-4 w-4 animate-pulse" />
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
        {/* En cola */}
        <Column title="En cola" count={cola.length} accent="info">
          {cola.map((c) => (
            <GlassCard key={c.id} className="p-3 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors duration-250">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 grid place-items-center text-xs font-bold shrink-0">
                  #{c.posicion}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{c.candidato}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.respondioWhatsapp ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                        WhatsApp OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold border border-amber-500/30">
                        Sin responder WA
                      </span>
                    )}
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
              </div>
            </GlassCard>
          ))}
        </Column>

        {/* En llamada */}
        <Column title="En llamada" sub="máx. 4" count={activas.length} accent="primary">
          {activas.map((c, i) => (
            <GlassCard key={c.id} className="p-4 relative overflow-hidden border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors duration-250">
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center text-xs font-bold pulse-ring">
                      {c.candidato.split(" ").map(n=>n[0]).slice(0,2).join("")}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{c.candidato}</div>
                    <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                  </div>
                </div>
                
                {/* Dynamic Voice Visualizer */}
                <VoiceVisualizer id={c.id} index={i} />

                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" /> {c.duracion}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </Column>

        {/* Completadas */}
        <Column title="Completadas" count={completadas.length} accent="success">
          {completadas.map((c) => (
            <GlassCard key={c.id} className="p-3 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors duration-250">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{c.candidato}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                </div>
                <button className="text-[10px] font-semibold text-primary hover:underline shrink-0">Respuestas</button>
              </div>
            </GlassCard>
          ))}
        </Column>

        {/* No contestadas */}
        <Column title="No contestadas" count={fallidas.length} accent="destructive">
          {fallidas.map((c) => (
            <GlassCard key={c.id} className="p-3 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors duration-250">
              <div className="flex items-center gap-2.5 mb-2">
                <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{c.candidato}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cargo}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1 shrink-0">
                  <RefreshCw className="h-3 w-3" /> Reintento {c.intento}/3
                </span>
                <span className="text-muted-foreground truncate">{c.proximoIntento}</span>
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
    info: "bg-indigo-500",
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

function VoiceVisualizer({ id, index }: { id: string; index: number }) {
  const bars = Array.from({ length: 32 });
  
  return (
    <div className="relative h-16 w-full my-3 flex items-center justify-center gap-1 rounded-xl bg-background/40 shadow-inner overflow-hidden px-2 border border-primary/10">
      <style>{`
        @keyframes eq-pulse-${id} {
          0% { height: 15%; opacity: 0.3; }
          50% { height: var(--max-h); opacity: 0.8; filter: drop-shadow(0 0 2px hsl(248 100% 68% / 0.2)); }
          100% { height: 15%; opacity: 0.3; }
        }
        .bar-animated-${id} {
          animation: eq-pulse-${id} var(--dur) ease-in-out infinite alternate;
          animation-delay: var(--del);
          background: linear-gradient(to top, hsl(248 100% 68% / 0.8), hsl(280 100% 75% / 0.8));
          border-radius: 99px;
          width: 4px;
        }
      `}</style>
      
      {/* Background ambient glow based on "voice activity" */}
      <div className="absolute inset-0 bg-primary/5 animate-pulse duration-1000" />

      {bars.map((_, i) => {
        // Deterministic pseudo-random values
        const h = 30 + (Math.sin(i * 1.3 + index) * Math.cos(i * 0.7 - index) * 0.5 + 0.5) * 70;
        const dur = 0.4 + (Math.sin(i * 3 + index) * 0.5 + 0.5) * 0.6;
        const del = (Math.cos(i * 2 - index) * 0.5 + 0.5) * -1.5;
        
        return (
          <div
            key={i}
            className={`bar-animated-${id} z-10`}
            style={{
              '--max-h': `${h}%`,
              '--dur': `${dur}s`,
              '--del': `${del}s`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
