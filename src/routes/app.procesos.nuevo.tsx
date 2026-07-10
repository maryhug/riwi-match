import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Upload, Check } from "lucide-react";
import { GlassCard } from "@/components/app/GlassCard";
import { toast } from "sonner";

export const Route = createFileRoute("/app/procesos/nuevo")({
  head: () => ({ meta: [{ title: "Crear proceso · RIWI MATCH" }] }),
  component: Wizard,
});

const steps = ["Datos básicos", "Job Description", "CVs y profiling"];

function Wizard() {
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [status, setStatus] = useState("Extrayendo criterios…");
  const nav = useNavigate();

  const analizar = () => {
    setAnalyzing(true);
    setStatus("Leyendo JD…");
    setTimeout(() => setStatus("Identificando skills obligatorios…"), 700);
    setTimeout(() => setStatus("Calculando pesos sugeridos…"), 1400);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); toast.success("JD analizado por IA"); }, 2100);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/app" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear proceso</h1>
        <p className="text-sm text-muted-foreground mt-1">Asistente en 3 pasos para configurar tu proceso de selección.</p>
      </div>

      <div className="flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 grid place-items-center rounded-full text-xs font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <GlassCard className="p-6">
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre del proceso" placeholder="Ej. Backend Node Sr" />
            <Field label="Cargo" placeholder="Ej. Desarrollador Backend" />
            <Select label="Área" options={["Tecnología", "Datos", "Diseño", "Comercial", "Personas"]} />
            <Select label="Seniority" options={["Jr", "Ssr", "Sr", "Lead"]} />
            <Select label="Reclutador responsable" options={["Camila Restrepo", "Julián Marín", "Andrés López", "Laura Vélez"]} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex gap-2 border-b border-border/40">
              <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary">Escribir JD</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Cargar archivo</button>
            </div>
            <textarea
              placeholder="Pega aquí la descripción del cargo…"
              className="w-full min-h-[140px] rounded-xl bg-background/70 border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              defaultValue="Buscamos Desarrollador Backend Sr con experiencia en Node.js, PostgreSQL y arquitectura de microservicios. Liderazgo técnico, inglés B2, disponibilidad híbrida Medellín."
            />

            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-info/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Estructuración por IA
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Extrae automáticamente criterios, skills y pesos sugeridos.</div>
                </div>
                <button
                  onClick={analizar}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30 disabled:opacity-60"
                >
                  {analyzing ? "Analizando…" : analyzed ? "Re-analizar" : "Analizar JD con IA"}
                </button>
              </div>

              {analyzing && (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden shimmer" />
                  <div className="mt-2 text-xs text-muted-foreground">{status}</div>
                </div>
              )}

              {analyzed && (
                <div className="mt-5 space-y-4">
                  {[
                    { l: "Requisitos obligatorios", c: ["Node.js 5+ años", "PostgreSQL", "Microservicios", "Liderazgo técnico"], color: "bg-primary/15 text-primary" },
                    { l: "Deseables", c: ["Kafka", "AWS", "GraphQL"], color: "bg-info/30 text-info-foreground" },
                    { l: "Criterios excluyentes", c: ["Inglés B2", "Disponibilidad Medellín"], color: "bg-destructive/15 text-destructive" },
                    { l: "Skills técnicos", c: ["Node.js", "TS", "PostgreSQL", "Docker", "Redis"], color: "bg-accent text-accent-foreground" },
                  ].map((g) => (
                    <div key={g.l}>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{g.l}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {g.c.map((x) => (
                          <span key={x} className={`px-2.5 py-1 rounded-md text-xs font-medium ${g.color}`}>{x}</span>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Pesos sugeridos</div>
                    <div className="space-y-2">
                      {[
                        { n: "Skills técnicos obligatorios", v: 45 },
                        { n: "Experiencia relevante", v: 25 },
                        { n: "Seniority", v: 15 },
                        { n: "Industria/dominio", v: 7 },
                        { n: "Idiomas", v: 5 },
                        { n: "Educación/certificaciones", v: 3 },
                      ].map((w) => (
                        <div key={w.n} className="flex items-center gap-3 text-xs">
                          <span className="w-56 text-muted-foreground">{w.n}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-info" style={{ width: `${w.v}%` }} /></div>
                          <span className="w-10 text-right font-semibold">{w.v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-border bg-background/40 p-10 text-center">
              <div className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-primary/15 text-primary mb-3">
                <Upload className="h-5 w-5" />
              </div>
              <div className="font-semibold">Arrastra los CVs aquí</div>
              <div className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG · máx. 50 por lote · 10 MB c/u</div>
              <button className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Seleccionar archivos</button>
            </div>
            <Select label="Set de preguntas (opcional)" options={["—", "Profiling Backend Sr v2", "Profiling Diseño v1"]} />
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between">
        <button
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="px-4 py-2 rounded-xl border border-border bg-background/60 text-sm disabled:opacity-40"
        >
          Atrás
        </button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30">
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => { toast.success("Proceso creado"); nav({ to: "/app" }); }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-info text-white text-sm font-semibold shadow-lg shadow-primary/30"
          >
            Crear proceso
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input placeholder={placeholder} className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
    </div>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <select className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
