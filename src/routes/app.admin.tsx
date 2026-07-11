import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { GlassCard } from "@/components/app/GlassCard";
import { Settings, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getUsers, createUser, updateUser, updateUserStatus } from "@/lib/api/users.functions";
import {
  getAIModels,
  activateAIModel,
  createAIModel,
  getAIPrompts,
  createAIPrompt,
} from "@/lib/api/ai-config.functions";
import { getAuditLogs } from "@/lib/api/audit.functions";
import {
  USER_ROLE_LABEL,
  USER_STATUS_LABEL,
  AI_TASK_TYPE_LABEL,
  type UserRole,
  type AITaskType,
} from "@/lib/types/enums";
import type { User } from "@/lib/types/api";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Administración · RIWI MATCH" }] }),
  component: Admin,
});

const TABS = ["Usuarios", "Parámetros de IA", "Integraciones", "Auditoría"] as const;

function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Usuarios");
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Administración
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Configuración global</h1>
      </div>

      <div className="glass rounded-2xl p-1.5 inline-flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Usuarios" && <UsuariosTab />}
      {tab === "Parámetros de IA" && <ParametrosIATab />}
      {tab === "Integraciones" && <IntegracionesTab />}
      {tab === "Auditoría" && <AuditoriaTab />}
    </div>
  );
}

// ─── Usuarios ───────────────────────────────────────────────────────────────

function UsuariosTab() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => getUsers() });

  const updateRoleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: UserRole }) => updateUser({ data: vars }),
    onSuccess: () => {
      toast.success("Rol actualizado");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (vars: { userId: string; status: "ACTIVE" | "SUSPENDED" }) =>
      updateUserStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Crear usuario
        </button>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando usuarios…</div>
        ) : (
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
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border/30">
                  <td className="px-5 py-3 font-medium">
                    {u.name} {u.last_name}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          userId: u.id,
                          role: e.target.value as UserRole,
                        })
                      }
                      className="px-2 py-1 rounded-md bg-background/70 border border-border text-xs"
                    >
                      {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((r) => (
                        <option key={r} value={r}>
                          {USER_ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          userId: u.id,
                          status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.status === "ACTIVE" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                    >
                      {USER_STATUS_LABEL[u.status]}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("RECRUITER");

  const createMutation = useMutation({
    mutationFn: () => createUser({ data: { name, last_name: lastName, email, password, role } }),
    onSuccess: () => {
      toast.success("Usuario creado");
      qc.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      setName("");
      setLastName("");
      setEmail("");
      setPassword("");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo crear el usuario"),
  });

  const canSave = name && lastName && email && password.length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Apellido"
              className="px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
            />
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
          >
            {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {USER_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl border border-border text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!canSave || createMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
          >
            {createMutation.isPending ? "Creando…" : "Crear"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Parámetros de IA ───────────────────────────────────────────────────────

const TASK_TYPES: AITaskType[] = [
  "CV_EXTRACTION",
  "CV_MATCH",
  "JD_ENHANCEMENT",
  "VOICE_PROFILING",
  "WHATSAPP_MESSAGE",
];

function ParametrosIATab() {
  const qc = useQueryClient();
  const [newPromptOpen, setNewPromptOpen] = useState<AITaskType | null>(null);
  const { data: modelsData } = useQuery({ queryKey: ["ai-models"], queryFn: () => getAIModels() });
  const { data: promptsData } = useQuery({
    queryKey: ["ai-prompts"],
    queryFn: () => getAIPrompts(),
  });

  const activateMutation = useMutation({
    mutationFn: (modelId: string) => activateAIModel({ data: { modelId } }),
    onSuccess: () => {
      toast.success("Modelo activado");
      qc.invalidateQueries({ queryKey: ["ai-models"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo activar"),
  });

  return (
    <div className="space-y-4">
      {TASK_TYPES.map((taskType) => {
        const models = (modelsData?.models ?? []).filter((m) => m.task_type === taskType);
        const activeModel = models.find((m) => m.is_active);
        const prompts = (promptsData?.prompts ?? []).filter((p) => p.task_type === taskType);
        const activePrompt = prompts.find((p) => p.is_active);

        return (
          <GlassCard key={taskType} className="space-y-3">
            <div className="text-sm font-semibold">{AI_TASK_TYPE_LABEL[taskType]}</div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">Modelo activo</div>
              <select
                value={activeModel?.id ?? ""}
                onChange={(e) => e.target.value && activateMutation.mutate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-background/70 border border-border text-xs"
              >
                <option value="" disabled>
                  {models.length === 0 ? "Sin modelos configurados" : "Seleccionar…"}
                </option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.provider} · {m.model_name}
                    {m.is_active ? " (activo)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">Prompt activo</div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {activePrompt?.version_name ?? "Sin prompt configurado"}
                </span>
                <button
                  onClick={() => setNewPromptOpen(taskType)}
                  className="text-xs text-primary hover:underline"
                >
                  Nueva versión
                </button>
              </div>
            </div>
          </GlassCard>
        );
      })}

      <GlassCard className="space-y-2">
        <div className="text-sm font-semibold">Umbrales de clasificación de match</div>
        <p className="text-xs text-muted-foreground">
          Alto ≥ 80% · Medio ≥ 60% · Bajo ≥ 40% · Por debajo, no recomendado. Estos umbrales están
          definidos en el backend (no son configurables desde esta pantalla todavía).
        </p>
      </GlassCard>

      <NewPromptDialog taskType={newPromptOpen} onClose={() => setNewPromptOpen(null)} />
    </div>
  );
}

function NewPromptDialog({
  taskType,
  onClose,
}: {
  taskType: AITaskType | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [versionName, setVersionName] = useState("");
  const [text, setText] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createAIPrompt({
        data: {
          task_type: taskType!,
          version_name: versionName,
          system_prompt_text: text,
          activate: true,
        },
      }),
    onSuccess: () => {
      toast.success("Prompt creado y activado");
      qc.invalidateQueries({ queryKey: ["ai-prompts"] });
      onClose();
      setVersionName("");
      setText("");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo crear el prompt"),
  });

  return (
    <Dialog open={taskType !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Nueva versión de prompt — {taskType && AI_TASK_TYPE_LABEL[taskType]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="Nombre de versión (ej. v4)"
            className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Texto del system prompt…"
            className="w-full min-h-[160px] px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Los prompts son append-only — esto crea una nueva versión y la activa, sin borrar las
            anteriores.
          </p>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm">
            Cancelar
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!versionName || !text || createMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
          >
            {createMutation.isPending ? "Guardando…" : "Crear y activar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Integraciones ──────────────────────────────────────────────────────────

function IntegracionesTab() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[
        {
          n: "Twilio",
          desc: "Originación de llamadas de profiling con detección de contestador (AMD).",
        },
        {
          n: "ElevenLabs",
          desc: "Agente de voz conversacional para las entrevistas de profiling.",
        },
        {
          n: "Meta WhatsApp Business",
          desc: "Consentimiento previo por WhatsApp antes de cada llamada.",
        },
        { n: "Cloudflare R2", desc: "Almacenamiento de CVs originales y normalizados." },
      ].map((i) => (
        <GlassCard key={i.n}>
          <div className="flex items-start justify-between mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-info">
              <Settings className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="font-semibold">{i.n}</div>
          <div className="text-xs text-muted-foreground mt-1">{i.desc}</div>
          <div className="mt-3 text-[11px] text-muted-foreground italic">
            Configurado por variables de entorno del backend — no hay un endpoint de health-check
            por servicio todavía, así que no mostramos un estado que no podemos verificar de verdad.
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ─── Auditoría ──────────────────────────────────────────────────────────────

function AuditoriaTab() {
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", offset, action],
    queryFn: () => getAuditLogs({ data: { limit, offset, action: action || undefined } }),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setOffset(0);
          }}
          className="px-3 py-1.5 rounded-lg bg-background/70 border border-border text-xs"
        >
          <option value="">Todas las acciones</option>
          <option value="USER_LOGIN">Login</option>
          <option value="USER_MANAGEMENT">Gestión de usuarios</option>
        </select>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando logs…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Sin registros de auditoría.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-left px-3 py-3 font-medium">Acción</th>
                <th className="text-left px-3 py-3 font-medium">Entidad</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const hasDiff = log.old_value || log.new_value;
                const isOpen = expanded === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr className="border-t border-border/30">
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("es-CO")}
                      </td>
                      <td className="px-3 py-3 text-xs font-medium">{log.action}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {log.entity_type}
                        {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                      </td>
                      <td className="px-3 py-3">
                        {hasDiff && (
                          <button
                            onClick={() => setExpanded(isOpen ? null : log.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {isOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && hasDiff && (
                      <tr className="bg-background/30">
                        <td colSpan={4} className="px-5 py-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground mb-1">
                                Antes
                              </div>
                              <pre className="whitespace-pre-wrap font-mono text-[11px] bg-background/60 rounded-lg p-2">
                                {JSON.stringify(log.old_value, null, 2) ?? "—"}
                              </pre>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground mb-1">
                                Después
                              </div>
                              <pre className="whitespace-pre-wrap font-mono text-[11px] bg-background/60 rounded-lg p-2">
                                {JSON.stringify(log.new_value, null, 2) ?? "—"}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-muted-foreground">Mostrando desde {offset + 1}</span>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={logs.length < limit}
          className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
