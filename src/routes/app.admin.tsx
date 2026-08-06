import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { GlassCard } from "@/components/app/GlassCard";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  User2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "@/lib/api/users.functions";
import {
  getAIModels,
  activateAIModel,
  createAIModel,
  getAIPrompts,
  createAIPrompt,
  activateAIPrompt,
  getGlobalSettings,
  updateGlobalSetting,
} from "@/lib/api/ai-config.functions";
import { getAuditLogs } from "@/lib/api/audit.functions";
import { getIntegrationsHealth } from "@/lib/api/system.functions";
import {
  USER_ROLE_LABEL,
  USER_STATUS_LABEL,
  AI_TASK_TYPE_LABEL,
  type UserRole,
  type UserStatus,
  type AITaskType,
} from "@/lib/types/enums";
import type { User, AIModelOut, AIPromptOut } from "@/lib/types/api";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Match" }] }),
  component: Admin,
});

const TABS = ["Usuarios", "Parámetros de IA", "Integraciones", "Auditoría"] as const;
const USERS_PAGE_SIZE = 10;
const AUDIT_ACTION_LABEL: Record<string, string> = {
  USER_LOGIN: "Inicio de sesión",
  USER_MANAGEMENT: "Gestión de usuarios",
};

function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Usuarios");
  const availableTabs = user?.role === "TA_LEADER" ? (["Usuarios"] as const) : TABS;
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Administración
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Configuración global</h1>
      </div>

      <div className="glass rounded-2xl p-1.5 inline-flex gap-1">
        {availableTabs.map((t) => (
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
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => getUsers() });

  const totalPages = Math.max(1, Math.ceil((users?.length ?? 0) / USERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = (users ?? []).slice(
    (currentPage - 1) * USERS_PAGE_SIZE,
    currentPage * USERS_PAGE_SIZE,
  );

  const updateRoleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: UserRole }) => updateUser({ data: vars }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["users"] });
      const previousUsers = qc.getQueryData<User[]>(["users"]);
      if (previousUsers) {
        qc.setQueryData<User[]>(
          ["users"],
          previousUsers.map((u) => (u.id === vars.userId ? { ...u, role: vars.role } : u)),
        );
      }
      return { previousUsers };
    },
    onError: (err, vars, context) => {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
      if (context?.previousUsers) qc.setQueryData(["users"], context.previousUsers);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onSuccess: () => {
      toast.success("Rol actualizado");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (vars: { userId: string; status: "ACTIVE" | "SUSPENDED" }) =>
      updateUserStatus({ data: vars }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["users"] });
      const previousUsers = qc.getQueryData<User[]>(["users"]);
      if (previousUsers) {
        qc.setQueryData<User[]>(
          ["users"],
          previousUsers.map((u) => (u.id === vars.userId ? { ...u, status: vars.status } : u)),
        );
      }
      return { previousUsers };
    },
    onError: (err, vars, context) => {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
      if (context?.previousUsers) qc.setQueryData(["users"], context.previousUsers);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["users"] });
      setUserToDelete(null);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el usuario"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Crear recruiter
        </button>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando usuarios…</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                  <th className="text-left px-5 py-3 font-medium">Usuario</th>
                  <th className="text-left px-3 py-3 font-medium">Email</th>
                  <th className="text-left px-3 py-3 font-medium">Rol</th>
                  <th className="text-left px-3 py-3 font-medium">Estado</th>
                  <th className="text-left px-3 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((u) => {
                  const isUpdatingRole =
                    updateRoleMutation.isPending && updateRoleMutation.variables?.userId === u.id;
                  const isUpdatingStatus =
                    toggleStatusMutation.isPending &&
                    toggleStatusMutation.variables?.userId === u.id;
                  const canManageUser = isAdmin || u.role !== "ADMIN";

                  return (
                    <tr key={u.id} className="border-t border-border/30">
                      <td className="px-5 py-3 font-medium">
                        {u.name} {u.last_name}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-3 py-3">
                        <AppSelect
                          value={u.role}
                          disabled={isUpdatingRole || !canManageUser}
                          onValueChange={(value) =>
                            updateRoleMutation.mutate({
                              userId: u.id,
                              role: value as UserRole,
                            })
                          }
                          className="h-8 w-32 text-xs"
                        >
                          {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((r) => (
                            <AppSelectItem key={r} value={r}>
                              {USER_ROLE_LABEL[r]}
                            </AppSelectItem>
                          ))}
                        </AppSelect>
                      </td>
                      <td className="px-3 py-3">
                        <AppSelect
                          value={u.status}
                          disabled={isUpdatingStatus || !canManageUser}
                          onValueChange={(value) =>
                            toggleStatusMutation.mutate({
                              userId: u.id,
                              status: value as UserStatus,
                            })
                          }
                          className="h-8 w-32 text-xs"
                        >
                          <AppSelectItem value="ACTIVE">
                            {USER_STATUS_LABEL["ACTIVE"]}
                          </AppSelectItem>
                          <AppSelectItem value="SUSPENDED">
                            {USER_STATUS_LABEL["SUSPENDED"]}
                          </AppSelectItem>
                        </AppSelect>
                      </td>
                      <td className="px-3 py-3">
                        {canManageUser && (
                          <button
                            onClick={() => setUserToEdit(u)}
                            className="mr-1 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition"
                            title="Editar usuario"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users && users.length > USERS_PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 text-xs text-muted-foreground">
                <div>
                  Página <span className="font-semibold text-foreground">{currentPage}</span>
                  {" de "}
                  {totalPages} · mostrando {pageUsers.length} de {users.length} usuarios
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-medium">Página {currentPage}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog user={userToEdit} onClose={() => setUserToEdit(null)} />
      <DeleteUserDialog
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) deleteMutation.mutate(userToDelete.id);
        }}
      />
    </div>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const isMatch = user && emailInput === user.email;

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Eliminar usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm mt-2">
          <p>
            Estás a punto de eliminar permanentemente al usuario{" "}
            <strong>
              {user?.name} {user?.last_name}
            </strong>
            . Esta acción no se puede deshacer.
          </p>
          <p>
            Para confirmar, por favor escribe el correo de la cuenta:{" "}
            <strong className="select-all">{user?.email}</strong>
          </p>
          <input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={user?.email ?? ""}
            className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm focus:border-destructive focus:ring-1 focus:ring-destructive transition-all"
          />
        </div>
        <DialogFooter className="mt-6">
          <button
            onClick={() => {
              setEmailInput("");
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (isMatch) {
                onConfirm();
                setEmailInput("");
              }
            }}
            disabled={!isMatch}
            className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-40 hover:bg-destructive/90 transition-colors"
          >
            Eliminar permanentemente
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
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
          {isAdmin && (
            <AppSelect
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              className="w-full"
            >
              {(Object.keys(USER_ROLE_LABEL) as UserRole[]).map((r) => (
                <AppSelectItem key={r} value={r}>
                  {USER_ROLE_LABEL[r]}
                </AppSelectItem>
              ))}
            </AppSelect>
          )}
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

function EditUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setPasswordConfirmation("");
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUser({
        data: {
          userId: user!.id,
          name: name.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          ...(password ? { password } : {}),
        },
      }),
    onSuccess: () => {
      toast.success("Usuario actualizado");
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el usuario"),
  });

  const passwordIsValid = !password || (password.length >= 8 && password === passwordConfirmation);
  const canSave = Boolean(name.trim() && lastName.trim() && email.trim() && passwordIsValid);
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
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
            placeholder="Correo"
            className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
          />
          <div className="border-t border-border/50 pt-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Nueva contraseña <span className="normal-case">(opcional)</span>
            </div>
            <div className="space-y-2">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
              />
              <input
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="Confirmar nueva contraseña"
                className="w-full px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
              />
              {passwordConfirmation && passwordConfirmation !== password && (
                <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm">
            Cancelar
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!canSave || updateMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
          >
            Guardar
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
  "VOICE_CALL_AGENT",
];

function ParametrosIATab() {
  const qc = useQueryClient();
  const [newPromptOpen, setNewPromptOpen] = useState<AITaskType | null>(null);
  const [historyOpen, setHistoryOpen] = useState<AITaskType | null>(null);
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
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionLabel>Regla de negocio global</SectionLabel>
        <MatchThresholdsCard />
      </section>

      <section className="space-y-3">
        <SectionLabel>Llamadas de profiling</SectionLabel>
        <MaxCallAttemptsCard />
      </section>

      <section className="space-y-3">
        <SectionLabel>Modelos y prompts por tarea</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TASK_TYPES.map((taskType) => (
            <TaskTypeConfigCard
              key={taskType}
              taskType={taskType}
              models={(modelsData?.models ?? []).filter((m) => m.task_type === taskType)}
              activePrompt={(promptsData?.prompts ?? []).find(
                (p) => p.task_type === taskType && p.is_active,
              )}
              onActivateModel={(modelId) => activateMutation.mutate(modelId)}
              onNewPrompt={() => setNewPromptOpen(taskType)}
              onOpenHistory={() => setHistoryOpen(taskType)}
            />
          ))}
        </div>
      </section>

      <NewPromptDialog taskType={newPromptOpen} onClose={() => setNewPromptOpen(null)} />
      <PromptHistoryDialog
        taskType={historyOpen}
        prompts={(promptsData?.prompts ?? []).filter((p) => p.task_type === historyOpen)}
        onClose={() => setHistoryOpen(null)}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
      {children}
    </div>
  );
}

function TaskTypeConfigCard({
  taskType,
  models,
  activePrompt,
  onActivateModel,
  onNewPrompt,
  onOpenHistory,
}: {
  taskType: AITaskType;
  models: AIModelOut[];
  activePrompt: AIPromptOut | undefined;
  onActivateModel: (modelId: string) => void;
  onNewPrompt: () => void;
  onOpenHistory: () => void;
}) {
  const activeModel = models.find((m) => m.is_active);
  return (
    <GlassCard className="space-y-3">
      <div className="text-sm font-semibold">{AI_TASK_TYPE_LABEL[taskType]}</div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">Modelo activo</div>
        <AppSelect
          value={activeModel?.id ?? "none"}
          onValueChange={(value) => value !== "none" && onActivateModel(value)}
          className="h-8 min-w-44 text-xs"
        >
          <AppSelectItem value="none">
            {models.length === 0 ? "Sin modelos configurados" : "Seleccionar…"}
          </AppSelectItem>
          {models.map((m) => (
            <AppSelectItem key={m.id} value={m.id}>
              {m.provider} · {m.model_name}
              {m.is_active ? " (activo)" : ""}
            </AppSelectItem>
          ))}
        </AppSelect>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">Prompt activo</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {activePrompt?.version_name ?? "Sin prompt configurado"}
          </span>
          <button onClick={onOpenHistory} className="text-xs text-primary hover:underline">
            Ver / historial
          </button>
          <button onClick={onNewPrompt} className="text-xs text-primary hover:underline">
            Nueva versión
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

const DEFAULT_MATCH_THRESHOLDS = { high: 75, medium: 50, low: 30 };

const THRESHOLD_FIELDS = [
  {
    key: "low" as const,
    label: "Bajo",
    hint: "Por debajo, no recomendado",
    dot: "bg-destructive",
    ring: "focus-within:border-destructive/60 focus-within:ring-destructive/20",
  },
  {
    key: "medium" as const,
    label: "Medio",
    hint: "Requiere validación",
    dot: "bg-warning",
    ring: "focus-within:border-warning/60 focus-within:ring-warning/20",
  },
  {
    key: "high" as const,
    label: "Alto",
    hint: "Match fuerte",
    dot: "bg-success",
    ring: "focus-within:border-success/60 focus-within:ring-success/20",
  },
];

function MatchThresholdsCard() {
  const qc = useQueryClient();
  const { data: settingsData } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => getGlobalSettings(),
  });

  const saved = settingsData?.settings.find((s) => s.setting_key === "match_thresholds")
    ?.setting_value as { high: number; medium: number; low: number } | undefined;

  const [thresholds, setThresholds] = useState(saved ?? DEFAULT_MATCH_THRESHOLDS);

  // Sincroniza el formulario cuando llega el valor guardado (o cambia tras un save de otra sesión)
  const [hydrated, setHydrated] = useState(false);
  if (saved && !hydrated) {
    setThresholds(saved);
    setHydrated(true);
  }

  const isValid =
    Number.isInteger(thresholds.high) &&
    Number.isInteger(thresholds.medium) &&
    Number.isInteger(thresholds.low) &&
    thresholds.low >= 0 &&
    thresholds.low <= thresholds.medium &&
    thresholds.medium <= thresholds.high &&
    thresholds.high <= 100;

  const saveMutation = useMutation({
    mutationFn: () => updateGlobalSetting({ data: { key: "match_thresholds", value: thresholds } }),
    onSuccess: () => {
      toast.success("Umbrales de match actualizados");
      qc.invalidateQueries({ queryKey: ["global-settings"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar los umbrales"),
  });

  return (
    <GlassCard className="space-y-4">
      <div>
        <div className="text-sm font-semibold">Umbrales de clasificación de match</div>
        <p className="text-xs text-muted-foreground mt-1">
          Score global mínimo (0–100) para cada categoría. Un candidato por debajo del umbral Bajo
          se marca como no recomendado.
        </p>
      </div>

      {/* Barra de rango: rojo cubre todo lo que no llega a Medio (no recomendado + Bajo) */}
      <div className="h-2 rounded-full overflow-hidden flex bg-muted">
        <div className="h-full bg-destructive/70" style={{ width: `${thresholds.medium}%` }} />
        <div
          className="h-full bg-warning/70"
          style={{ width: `${Math.max(thresholds.high - thresholds.medium, 0)}%` }}
        />
        <div
          className="h-full bg-success/70"
          style={{ width: `${Math.max(100 - thresholds.high, 0)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THRESHOLD_FIELDS.map(({ key, label, hint, dot, ring }) => (
          <label
            key={key}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-background/70 border border-border transition ${ring}`}
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-medium">{label}</span>
              <span className="block text-[11px] text-muted-foreground truncate">{hint}</span>
            </span>
            <span className="flex flex-col items-end shrink-0">
              <span className="text-[10px] text-muted-foreground">A partir de:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={thresholds[key]}
                onChange={(e) => setThresholds({ ...thresholds, [key]: Number(e.target.value) })}
                className="w-14 bg-transparent text-right text-sm font-semibold outline-none"
              />
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        {!isValid ? (
          <p className="text-xs text-destructive">Deben cumplir 0 ≤ Bajo ≤ Medio ≤ Alto ≤ 100.</p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setThresholds(DEFAULT_MATCH_THRESHOLDS)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Por defecto
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || saveMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar umbrales"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

const DEFAULT_MAX_CALL_ATTEMPTS = 3;

function MaxCallAttemptsCard() {
  const qc = useQueryClient();
  const { data: settingsData } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => getGlobalSettings(),
  });

  const saved = settingsData?.settings.find((s) => s.setting_key === "max_call_attempts")
    ?.setting_value as number | undefined;

  const [attempts, setAttempts] = useState(saved ?? DEFAULT_MAX_CALL_ATTEMPTS);

  const [hydrated, setHydrated] = useState(false);
  if (saved != null && !hydrated) {
    setAttempts(saved);
    setHydrated(true);
  }

  const isValid = Number.isInteger(attempts) && attempts >= 1 && attempts <= 10;

  const saveMutation = useMutation({
    mutationFn: () => updateGlobalSetting({ data: { key: "max_call_attempts", value: attempts } }),
    onSuccess: () => {
      toast.success("Intentos de llamada actualizados");
      qc.invalidateQueries({ queryKey: ["global-settings"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  return (
    <GlassCard className="space-y-4">
      <div>
        <div className="text-sm font-semibold">Intentos de llamada (primer acercamiento)</div>
        <p className="text-xs text-muted-foreground mt-1">
          Cuántas veces reintenta el sistema una llamada de profiling que no conecta (no
          contesta, buzón de voz, error de red) antes de marcarla como fallida.
        </p>
      </div>

      <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/70 border border-border max-w-xs">
        <span className="flex-1 text-xs font-medium text-muted-foreground">Máximo de intentos</span>
        <input
          type="number"
          min={1}
          max={10}
          value={attempts}
          onChange={(e) => setAttempts(Number(e.target.value))}
          className="w-14 bg-transparent text-right text-sm font-semibold outline-none"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        {!isValid ? (
          <p className="text-xs text-destructive">Debe ser un entero entre 1 y 10.</p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAttempts(DEFAULT_MAX_CALL_ATTEMPTS)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Por defecto
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || saveMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </GlassCard>
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

function PromptHistoryDialog({
  taskType,
  prompts,
  onClose,
}: {
  taskType: AITaskType | null;
  prompts: AIPromptOut[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activateMutation = useMutation({
    mutationFn: (promptId: string) => activateAIPrompt({ data: { promptId } }),
    onSuccess: () => {
      toast.success("Versión activada");
      qc.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "No se pudo activar esta versión"),
  });

  return (
    <Dialog open={taskType !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Historial de prompts — {taskType && AI_TASK_TYPE_LABEL[taskType]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {prompts.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay versiones registradas.</p>
          )}
          {prompts.map((p) => {
            const expanded = expandedId === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{p.version_name}</span>
                    {p.is_active && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success/15 text-success">
                        Activo
                      </span>
                    )}
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(expanded ? null : p.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {expanded ? "Ocultar" : "Ver texto"}
                    </button>
                    {!p.is_active && (
                      <button
                        onClick={() => activateMutation.mutate(p.id)}
                        disabled={activateMutation.isPending}
                        className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </div>
                {expanded && (
                  <pre className="mt-3 text-xs whitespace-pre-wrap break-words bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                    {p.system_prompt_text}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm">
            Cerrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Integraciones ──────────────────────────────────────────────────────────

function IntegracionesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["integrations-health"],
    queryFn: () => getIntegrationsHealth(),
  });

  const items = [
    {
      id: "twilio",
      n: "Twilio",
      desc: "Originación de llamadas de profiling con detección de contestador (AMD).",
    },
    {
      id: "elevenlabs",
      n: "ElevenLabs",
      desc: "Agente de voz conversacional para las entrevistas de profiling.",
    },
    {
      id: "meta",
      n: "Meta WhatsApp Business",
      desc: "Consentimiento previo por WhatsApp antes de cada llamada.",
    },
    {
      id: "cloudflare_r2",
      n: "Cloudflare R2",
      desc: "Almacenamiento de CVs originales y normalizados.",
    },
  ] as const;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((i) => {
        const health = data?.[i.id];
        return (
          <GlassCard key={i.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Verificando...
                  </span>
                ) : health ? (
                  <>
                    <span
                      className={`h-2 w-2 rounded-full ${health.status === "ok" ? "bg-success" : "bg-destructive"}`}
                    />
                    <span className="text-xs font-medium">
                      {health.status === "ok" ? "Conectado" : "Error"}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin datos</span>
                )}
              </div>
            </div>
            <div className="font-semibold">{i.n}</div>
            <div className="text-xs text-muted-foreground mt-1">{i.desc}</div>
            {health?.status === "error" && (
              <div className="mt-3 text-[11px] text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                {health.details}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

// ─── Auditoría ──────────────────────────────────────────────────────────────

const AUDIT_PAGE_SIZE = 10;

function AuditoriaTab() {
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", offset, action],
    queryFn: () =>
      getAuditLogs({
        data: { limit: AUDIT_PAGE_SIZE, offset, action: action || undefined },
      }),
  });

  const logs = data?.logs ?? [];
  const hasNext = logs.length === AUDIT_PAGE_SIZE;
  const hasPrev = offset > 0;
  const currentPage = Math.floor(offset / AUDIT_PAGE_SIZE) + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AppSelect
          value={action || "all"}
          onValueChange={(value) => {
            setAction(value === "all" ? "" : value);
            setOffset(0);
          }}
          className="w-48"
        >
          <AppSelectItem value="all">Todas las acciones</AppSelectItem>
          <AppSelectItem value="USER_LOGIN">Login</AppSelectItem>
          <AppSelectItem value="USER_MANAGEMENT">Gestión de usuarios</AppSelectItem>
        </AppSelect>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando logs…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Sin registros de auditoría.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-background/30">
                  <th className="text-left px-5 py-3 font-medium">Fecha</th>
                  <th className="text-left px-3 py-3 font-medium">Usuario</th>
                  <th className="text-left px-3 py-3 font-medium">Acción</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const hasDiff = log.old_value || log.new_value;
                  const isOpen = expanded === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr className="border-t border-border/30 hover:bg-background/20 transition">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("es-CO")}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {log.user_name ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                              <User2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {log.user_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Sistema</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium">
                          {AUDIT_ACTION_LABEL[log.action] ??
                            log.action.toLowerCase().replaceAll("_", " ")}
                        </td>
                        <td className="px-3 py-3">
                          {hasDiff && (
                            <button
                              onClick={() => setExpanded(isOpen ? null : log.id)}
                              className="text-muted-foreground hover:text-foreground cursor-pointer transition"
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

            {(hasPrev || hasNext) && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 text-xs text-muted-foreground">
                <div>
                  Página <span className="font-semibold text-foreground">{currentPage}</span>
                  {" · "}mostrando{" "}
                  <span className="font-semibold text-foreground">{logs.length}</span> registros
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - AUDIT_PAGE_SIZE))}
                    disabled={!hasPrev}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-medium">Página {currentPage}</span>
                  <button
                    onClick={() => setOffset(offset + AUDIT_PAGE_SIZE)}
                    disabled={!hasNext}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}
