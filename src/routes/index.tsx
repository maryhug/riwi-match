import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RIWI MATCH — Iniciar sesión" },
      { name: "description", content: "Plataforma interna de reclutamiento con IA de Riwi." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-info/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-success/20 blur-3xl" />
      </div>

      {/* Form */}
      <div className="relative z-10 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold leading-none">RIWI <span className="text-primary">MATCH</span><span className="text-primary">.</span></div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Talent Acquisition AI</div>
            </div>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">Bienvenido de vuelta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión con tu cuenta corporativa de Riwi para continuar.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setTimeout(() => navigate({ to: "/app" }), 700);
            }}
            className="mt-8 glass rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                defaultValue="camila@riwi.io"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contraseña</label>
                <a href="#" className="text-xs text-primary hover:underline">Recuperar contraseña</a>
              </div>
              <input
                type="password"
                defaultValue="••••••••"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-info text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
            <p className="text-[11px] text-center text-muted-foreground">
              Mock demo · cualquier credencial te permite ingresar.
            </p>
          </form>
        </div>
      </div>

      {/* Right hero panel */}
      <div className="relative z-10 hidden lg:flex items-center justify-center p-12">
        <div className="glass-strong rounded-3xl p-10 max-w-lg">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Riwi · 2026</div>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            Reclutar con <span className="text-gradient-primary">inteligencia</span>,<br />
            decidir con criterio humano.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            RIWI MATCH automatiza la lectura de hojas de vida, el match contra el JD y el profiling por voz —
            tú mantienes el control de la decisión final.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { k: "12.4k", v: "CVs analizados" },
              { k: "1.8k", v: "Profilings activos" },
              { k: "73%", v: "Match promedio" },
            ].map((s) => (
              <div key={s.v} className="glass-subtle rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-primary">{s.k}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
