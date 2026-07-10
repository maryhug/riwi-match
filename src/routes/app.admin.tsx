import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard } from "@/components/app/GlassCard";
import { usuariosAdmin } from "@/lib/mock-data";
import { CheckCircle2, Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Administración · RIWI MATCH" }] }),
  component: Admin,
});

function Admin() {
  const [tab, setTab] = useState("Usuarios");
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Administración</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Configuración global</h1>
      </div>

      <div className="glass rounded-2xl p-1.5 inline-flex gap-1">
        {["Usuarios","Parámetros de IA","Integraciones"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab===t?"bg-primary text-primary-foreground shadow-md":"text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "Usuarios" && (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-3 py-3 font-medium">Email</th>
                <th className="text-left px-3 py-3 font-medium">Rol</th>
                <th className="text-left px-3 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuariosAdmin.map((u) => (
                <tr key={u.id} className="border-t border-border/30">
                  <td className="px-5 py-3 font-medium">{u.nombre}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3">
                    <select defaultValue={u.rol} className="px-2 py-1 rounded-md bg-background/70 border border-border text-xs">
                      <option>Administrador</option><option>Recruiter</option><option>Líder TA</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.estado==="Activo"?"bg-success/15 text-success":"bg-muted text-muted-foreground"}`}>{u.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "Parámetros de IA" && (
        <GlassCard className="space-y-4">
          <Row label="Modelo activo"><select className="px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"><option>gpt-X · medium</option><option>gpt-X · large</option></select></Row>
          <Row label="Prompt de match"><select className="px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"><option>Prompt match v3 — activo</option><option>Prompt match v2</option></select></Row>
          <Row label="Umbral Match alto"><input defaultValue="80" className="w-20 px-2.5 py-1.5 rounded-lg bg-background/70 border border-border text-sm text-right" /></Row>
          <Row label="Umbral Match medio"><input defaultValue="60" className="w-20 px-2.5 py-1.5 rounded-lg bg-background/70 border border-border text-sm text-right" /></Row>
          <Row label="Umbral Match bajo"><input defaultValue="40" className="w-20 px-2.5 py-1.5 rounded-lg bg-background/70 border border-border text-sm text-right" /></Row>
        </GlassCard>
      )}

      {tab === "Integraciones" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { n: "n8n · Webhook", desc: "https://n8n.riwi.io/webhook/riwi-match", key: "••••••••••••a3f2" },
            { n: "Modelo de voz · Vapi", desc: "Voice assistant provider", key: "••••••••••••b81c" },
          ].map((i) => (
            <GlassCard key={i.n}>
              <div className="flex items-start justify-between mb-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-info"><Settings className="h-5 w-5 text-white" /></div>
                <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-semibold inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Conectado</span>
              </div>
              <div className="font-semibold">{i.n}</div>
              <div className="text-xs text-muted-foreground mt-1">{i.desc}</div>
              <div className="mt-3 text-xs">
                <div className="text-muted-foreground">API key</div>
                <div className="font-mono mt-0.5">{i.key}</div>
              </div>
              <button onClick={() => toast.success("Conexión exitosa")} className="mt-4 w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Probar conexión</button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: any) {
  return <div className="flex items-center justify-between gap-3"><div className="text-sm">{label}</div>{children}</div>;
}
