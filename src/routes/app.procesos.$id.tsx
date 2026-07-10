import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, PlayCircle, Upload, Archive, AlertTriangle, ChevronDown, CheckCircle2, Loader2, AlertCircle, Eye } from "lucide-react";
import { procesos, candidatos, type Candidato } from "@/lib/mock-data";
import { GlassCard } from "@/components/app/GlassCard";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { matchDistribution, avanceData, funnelData } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/procesos/$id")({
  head: () => ({ meta: [{ title: "Detalle de proceso · RIWI MATCH" }] }),
  component: Detalle,
});

const tabs = ["Dashboard", "CVs", "Ranking de candidatos", "Configuración"];

function Detalle() {
  const { id } = useParams({ from: "/app/procesos/$id" });
  const proc = procesos.find((p) => p.id === id) ?? procesos[0];
  const [tab, setTab] = useState("Dashboard");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<Candidato | null>(null);
  const presupuestoPct = Math.min(100, (proc.costo / proc.presupuesto) * 100);

  return (
    <div className="space-y-6">
      <Link to="/app" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a procesos
      </Link>

      <GlassCard className="p-6">
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{proc.nombre}</h1>
              <span className="px-2 py-1 rounded-md bg-primary/15 text-primary text-[10px] font-semibold">{proc.estado}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {proc.cargo} · {proc.area} · {proc.seniority} · Reclutador: <span className="text-foreground">{proc.reclutador}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toast.success("Análisis de match iniciado", { description: "Procesando 18 CVs contra el JD…" })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30"
            >
              <PlayCircle className="h-4 w-4" /> Ejecutar análisis de match
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/60 text-sm hover:bg-background transition">
              <Upload className="h-4 w-4" /> Cargar más CVs
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/60 text-sm hover:bg-background transition">
              <Archive className="h-4 w-4" /> Archivar
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="glass rounded-2xl p-1.5 inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && (
        <div className="space-y-6">
          {presupuestoPct >= 80 && (
            <div className="glass rounded-2xl p-4 border-l-4 border-destructive flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Presupuesto al {presupuestoPct.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Nuevas ejecuciones podrían bloquearse al superar el 100%. Solicita aprobación si necesitas continuar.</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Total CVs", proc.candidatos.toString()],
              ["Procesados", "18"],
              ["Con error", "2"],
              ["Pendientes", "4"],
              ["Match promedio", proc.promedioMatch + "%"],
              ["Costo acumulado", "$" + proc.costo.toFixed(2)],
              ["Costo prom. / CV", "$0.18"],
              ["Costo prom. / profiling", "$0.47"],
            ].map(([l, v]) => (
              <GlassCard key={l} className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                <div className="mt-2 text-2xl font-bold">{v}</div>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard>
              <div className="text-sm font-semibold mb-2">Distribución de match</div>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={matchDistribution} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {matchDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-sm font-semibold mb-2">Posibilidad de avance</div>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={avanceData}>
                    <XAxis dataKey="name" stroke="hsl(233 20% 46%)" fontSize={11} />
                    <YAxis stroke="hsl(233 20% 46%)" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(248 100% 68%)" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-sm font-semibold mb-3">Embudo del proceso</div>
              <div className="space-y-2.5">
                {funnelData.map((f, i) => {
                  const pct = (f.value / funnelData[0].value) * 100;
                  return (
                    <div key={f.etapa}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{f.etapa}</span>
                        <span className="font-semibold">{f.value}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-info" style={{ width: `${pct}%`, opacity: 1 - i*0.15 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Consumo de presupuesto</div>
              <div className="text-xs text-muted-foreground">${proc.costo.toFixed(2)} de ${proc.presupuesto}</div>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${presupuestoPct >= 100 ? "bg-destructive" : presupuestoPct >= 90 ? "bg-warning" : "bg-gradient-to-r from-primary to-info"}`}
                style={{ width: `${presupuestoPct}%` }}
              />
              {[80, 90, 100].map((m) => (
                <div key={m} className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: `${m}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>0%</span><span>80%</span><span>90%</span><span>100%</span>
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "CVs" && <CVsTab />}
      {tab === "Ranking de candidatos" && (
        <RankingTab
          procSet={proc.setPreguntas}
          selected={selected}
          setSelected={setSelected}
          onOpen={(c: Candidato) => setDrawer(c)}
        />
      )}
      {tab === "Configuración" && (
        <GlassCard>
          <div className="text-sm font-semibold mb-3">Configuración del proceso</div>
          <p className="text-sm text-muted-foreground">Ajusta JD, criterios, pesos y set de profiling. (Mock)</p>
        </GlassCard>
      )}

      {drawer && <CandidatoDrawer candidato={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function CVsTab() {
  const files = [
    { name: "mariana_ospina_cv.pdf", cand: "Mariana Ospina", estado: "Procesado" },
    { name: "daniel_cardenas_cv.pdf", cand: "Daniel Cárdenas", estado: "Procesado" },
    { name: "valentina_rojas_cv.pdf", cand: "Valentina Rojas", estado: "Procesado" },
    { name: "esteban_q_cv.docx", cand: "Esteban Quintero", estado: "Procesado" },
    { name: "laura_mendoza.pdf", cand: "Laura Mendoza", estado: "Procesando" },
    { name: "cv_escaneado_023.jpg", cand: "—", estado: "Requiere revisión" },
    { name: "perfil_corrupto.pdf", cand: "—", estado: "Error de lectura" },
  ];

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="p-4 border-b border-border/40 text-sm font-semibold">Procesamiento de CVs</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
            <th className="text-left px-5 py-3 font-medium">Archivo</th>
            <th className="text-left px-3 py-3 font-medium">Candidato detectado</th>
            <th className="text-left px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {files.map((f, i) => (
            <tr key={i} className="border-t border-border/30">
              <td className="px-5 py-3 font-medium">{f.name}</td>
              <td className="px-3 py-3 text-muted-foreground">{f.cand}</td>
              <td className="px-3 py-3">
                {f.estado === "Procesado" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/15 text-success text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Procesado
                  </span>
                )}
                {f.estado === "Procesando" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-medium">
                    <Loader2 className="h-3 w-3 animate-spin" /> Procesando…
                  </span>
                )}
                {f.estado === "Requiere revisión" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/20 text-warning-foreground text-xs font-medium">
                    <AlertCircle className="h-3 w-3" /> Requiere revisión
                  </span>
                )}
                {f.estado === "Error de lectura" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-medium">
                    <AlertCircle className="h-3 w-3" /> Error de lectura
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-right">
                {f.estado === "Error de lectura" && (
                  <button className="text-xs text-primary hover:underline">Reintentar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "hsl(155 55% 58%)" : value >= 60 ? "hsl(45 75% 61%)" : value >= 40 ? "hsl(9 99% 65%)" : "hsl(233 20% 60%)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(220 20% 90%)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-bold">{value}%</div>
    </div>
  );
}

function RankingTab({ procSet, selected, setSelected, onOpen }: any) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...candidatos].sort((a, b) => b.match - a.match);
  const noSet = !procSet;
  const overFour = selected.length > 4;

  const toggle = (id: string) =>
    setSelected((s: string[]) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input placeholder="Buscar candidato…" className="px-3 py-2 text-sm rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 w-56" />
          {["Match alto", "Match medio", "En llamada", "Completado", "Avance Alta"].map((f) => (
            <button key={f} className="px-3 py-1.5 text-xs rounded-lg bg-background/60 border border-border hover:bg-accent transition">
              {f}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative group">
            <button
              disabled={noSet || selected.length === 0}
              onClick={() => toast.success(`Profiling activado para ${selected.length} candidatos`, { description: overFour ? "Máximo 4 llamadas simultáneas; el resto entra en cola." : "Las llamadas iniciarán en breve." })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <PlayCircle className="h-4 w-4" /> Activar profiling ({selected.length})
            </button>
            {noSet && (
              <div className="absolute right-0 top-full mt-2 px-3 py-2 text-xs rounded-lg bg-foreground text-background shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                Asigna un set de preguntas al proceso para habilitar profiling
              </div>
            )}
          </div>
        </div>
        {overFour && (
          <div className="mt-3 text-xs text-warning-foreground bg-warning/15 border border-warning/30 rounded-lg px-3 py-2">
            ⓘ Se ejecutarán máximo 4 llamadas simultáneas; el resto entra en cola.
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
              <th className="px-4 py-3 w-10"></th>
              <th className="text-left px-3 py-3 font-medium">Candidato</th>
              <th className="text-center px-3 py-3 font-medium">Match</th>
              <th className="text-left px-3 py-3 font-medium">Categoría</th>
              <th className="text-left px-3 py-3 font-medium">Top skills</th>
              <th className="text-left px-3 py-3 font-medium">Ciudad</th>
              <th className="text-left px-3 py-3 font-medium">Profiling</th>
              <th className="text-left px-3 py-3 font-medium">Avance</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <FragmentRow key={c.id}>
                <tr className={`border-t border-border/30 hover:bg-accent/30 transition ${selected.includes(c.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="accent-primary"/></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-info grid place-items-center text-xs font-bold text-white">
                        {c.nombre.split(" ").map(n=>n[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{c.nombre}</div>
                        <div className="text-xs text-muted-foreground">{c.seniority} · {c.email}</div>
                      </div>
                    </div>
                    {c.flagExcluyente && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                        ⚠ Criterio excluyente no cumplido: {c.flagExcluyente}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3"><div className="flex justify-center"><MatchRing value={c.match} /></div></td>
                  <td className="px-3 py-3">
                    <CategoriaBadge cat={c.categoria} />
                    {c.requiereRevision && (
                      <div className="mt-1 text-[10px] text-warning">Requiere revisión</div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.topSkills.slice(0,3).map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-accent text-accent-foreground">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">{c.ciudad}</td>
                  <td className="px-3 py-3 text-xs">{c.profiling}</td>
                  <td className="px-3 py-3"><AvanceBadge a={c.avance} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onOpen(c)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent" title="Ver detalle">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent">
                        <ChevronDown className={`h-3.5 w-3.5 transition ${expanded===c.id?"rotate-180":""}`} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr className="bg-accent/20 border-t border-border/30">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="grid lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-1">
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Breakdown</div>
                          <div className="space-y-1.5">
                            {c.breakdown.map(b => (
                              <div key={b.categoria}>
                                <div className="flex justify-between text-[11px] mb-0.5">
                                  <span className="text-muted-foreground">{b.categoria} <span className="text-[9px]">({b.peso}%)</span></span>
                                  <span className="font-semibold">{b.puntaje}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-info" style={{width:`${b.puntaje}%`}}/></div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-success mb-2">Fortalezas</div>
                          <ul className="space-y-1 text-sm">{c.fortalezas.map(f=><li key={f}>• {f}</li>)}</ul>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-destructive mb-2">Brechas</div>
                          <ul className="space-y-1 text-sm">{c.brechas.map(f=><li key={f}>• {f}</li>)}</ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </FragmentRow>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

function FragmentRow({ children }: any) { return <>{children}</>; }

function CategoriaBadge({ cat }: { cat: string }) {
  const map: Record<string, string> = {
    "Alto": "bg-success/15 text-success",
    "Medio": "bg-warning/20 text-warning-foreground",
    "Bajo": "bg-destructive/15 text-destructive",
    "No recomendado": "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${map[cat]}`}>{cat}</span>;
}

function AvanceBadge({ a }: { a: string }) {
  if (a === "—") return <span className="text-muted-foreground text-xs">—</span>;
  const map: Record<string, string> = {
    "Alta": "bg-success/15 text-success",
    "Media": "bg-warning/20 text-warning-foreground",
    "Baja": "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${map[a]}`}>{a}</span>;
}

function CandidatoDrawer({ candidato, onClose }: { candidato: Candidato; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-strong h-full overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-info grid place-items-center text-white font-bold text-lg">
              {candidato.nombre.split(" ").map(n=>n[0]).slice(0,2).join("")}
            </div>
            <div>
              <h2 className="text-xl font-bold">{candidato.nombre}</h2>
              <div className="text-xs text-muted-foreground">{candidato.email} · {candidato.telefono} · {candidato.ciudad}</div>
              <div className="mt-1 flex gap-2"><CategoriaBadge cat={candidato.categoria} /><AvanceBadge a={candidato.avance} /></div>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl text-muted-foreground hover:text-foreground">×</button>
        </div>

        <GlassCard>
          <div className="flex items-start justify-between mb-3">
            <div className="text-sm font-semibold">Análisis de match (IA)</div>
            <MatchRing value={candidato.match} size={64} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Perfil con alta afinidad técnica frente al JD; cumple la mayoría de requisitos obligatorios y presenta
            fortalezas sólidas en el stack solicitado. Se identifican brechas menores que pueden validarse en
            entrevista humana.
          </p>
          <div className="mt-3 text-[10px] text-muted-foreground italic">
            Generado por IA — modelo gpt-X · prompt v3 · 2,431 tokens · $0.04
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-sm font-semibold mb-3">Profiling</div>
          <div className="space-y-2">
            {[
              { q: "¿Tienes disponibilidad para modalidad híbrida en Medellín?", a: "Sí, sin problema.", ev: "✓", conf: 96 },
              { q: "Cuéntanos por qué saliste de tu último empleo.", a: "Buscaba un reto técnico mayor y mejores condiciones.", ev: "parcial", conf: 64 },
              { q: "¿Cuál es tu expectativa salarial?", a: "Entre 9 y 11 M COP.", ev: "✓", conf: 92 },
            ].map((p, i) => (
              <details key={i} className="rounded-xl bg-background/40 border border-border/40 p-3">
                <summary className="cursor-pointer text-sm font-medium flex items-center justify-between">
                  <span>{p.q}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.ev === "✓" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground"}`}>{p.ev}</span>
                </summary>
                <div className="mt-3 text-sm text-muted-foreground">{p.a}</div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${p.conf < 70 ? "bg-warning" : "bg-success"}`} style={{ width: `${p.conf}%` }} />
                  </div>
                  <span className="text-muted-foreground">Confianza {p.conf}%</span>
                </div>
                {p.conf < 70 && <div className="mt-1 text-[10px] text-warning">Requiere revisión humana</div>}
              </details>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-sm font-semibold mb-2">Override del recruiter</div>
          <textarea
            placeholder="Observaciones del recruiter…"
            className="w-full text-sm rounded-xl bg-background/70 border border-border p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-3 flex gap-2 text-xs">
            <div className="text-muted-foreground">¿El análisis de IA fue…?</div>
            {["Correcto", "Parcial", "Incorrecto"].map((o) => (
              <button key={o} className="px-2.5 py-1 rounded-md border border-border hover:bg-accent transition">{o}</button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
