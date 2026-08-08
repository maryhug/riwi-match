import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Search,
  Sun,
  Moon,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Sparkles,
  PhoneOff,
  Check,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { USER_ROLE_LABEL } from "@/lib/types/enums";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getProcess } from "@/lib/api/processes.functions";
import { getQuestionSet } from "@/lib/api/question-sets.functions";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications.functions";
import type { NotificationOut } from "@/lib/types/api";

const breadcrumbMap: Record<string, string> = {
  app: "Inicio",
  sets: "Sets de Preguntas",
  profiling: "Ejecución de Profiling",
  equipo: "Dashboard de Equipo",
  costos: "Costos",
  buscar: "Buscar",
  admin: "Administración",
  procesos: "Procesos",
  nuevo: "Nuevo",
};

const breadcrumbHrefOverrides: Record<string, string> = {
  procesos: "/app",
};

function BreadcrumbItem({
  seg,
  prevSeg,
  href,
  isLast,
}: {
  seg: string;
  prevSeg?: string;
  href: string;
  isLast: boolean;
}) {
  const isProcessId = prevSeg === "procesos" && seg !== "nuevo";
  const isSetId = prevSeg === "sets" && seg !== "nuevo";

  const { data: processData } = useQuery({
    queryKey: ["process", seg],
    queryFn: () => getProcess({ data: { processId: seg } }),
    enabled: isProcessId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: setData } = useQuery({
    queryKey: ["question-set", seg],
    queryFn: () => getQuestionSet({ data: { id: seg } }),
    enabled: isSetId,
    staleTime: 5 * 60 * 1000,
  });

  let label = breadcrumbMap[seg];

  if (!label) {
    if (isProcessId) {
      label = processData?.name || "Proceso";
    } else if (isSetId) {
      label = setData?.name || "Set de Preguntas";
    } else {
      label = decodeURIComponent(seg);
    }
  }

  return (
    <Link
      to={href as never}
      className={cn(
        "rounded-full px-2 py-0.5 transition hover:bg-muted hover:text-foreground max-w-[220px] truncate inline-block align-middle",
        isLast ? "font-semibold text-foreground" : "text-muted-foreground",
      )}
      title={label}
    >
      {label}
    </Link>
  );
}

function getNotificationIcon(type: string, category: string) {
  if (category.startsWith("BUDGET")) {
    return category === "BUDGET_EXCEEDED" ? (
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
    ) : (
      <DollarSign className="h-4 w-4 text-warning shrink-0 mt-0.5" />
    );
  }
  if (category === "PROFILING_FAILED") {
    return <PhoneOff className="h-4 w-4 text-warning shrink-0 mt-0.5" />;
  }
  if (type === "ALERT") {
    return <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
  }
  if (type === "WARNING") {
    return <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />;
  }
  if (type === "SUCCESS") {
    return <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />;
  }
  return <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />;
}

function NotificationsModal({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAll,
  isMarkingAll,
}: {
  open: boolean;
  onClose: () => void;
  notifications: NotificationOut[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  isMarkingAll: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-border/40 bg-card/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Historial de Notificaciones
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} notificaciones sin leer`
                    : "Todas las notificaciones al día"}
                </DialogDescription>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAll}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Marcar todas leídas
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[440px] overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No tienes notificaciones en el historial.
            </div>
          ) : (
            notifications.map((n) => {
              const content = (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) onMarkRead(n.id);
                  }}
                  className={cn(
                    "flex items-start gap-3.5 p-3.5 rounded-xl border border-border/30 transition text-left cursor-pointer",
                    !n.is_read
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-card/40 hover:bg-accent/40 opacity-80",
                  )}
                >
                  <div className="mt-0.5">{getNotificationIcon(n.type, n.category)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-foreground">{n.title}</div>
                      <span className="text-[10px] font-medium text-muted-foreground/70 shrink-0">
                        {new Date(n.created_at).toLocaleDateString("es-CO")}{" "}
                        {new Date(n.created_at).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.description}
                    </div>
                  </div>
                </div>
              );

              return n.link ? (
                <Link key={n.id} to={n.link as never} onClick={onClose}>
                  {content}
                </Link>
              ) : (
                content
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PopoverNotifications() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifData?.unread_count ?? 0;
  const notifications = notifData?.notifications ?? [];
  const previewNotifications = notifications.slice(0, 5);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition cursor-pointer"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 sm:w-96 p-0 overflow-hidden shadow-xl border-border/60"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/60">
            <div>
              <div className="text-sm font-semibold">Notificaciones</div>
              <div className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} sin leer` : "Al día"}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3 w-3" /> Marcar leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
            {previewNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No tienes notificaciones por el momento.
              </div>
            ) : (
              previewNotifications.map((n) => {
                const content = (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markReadMutation.mutate(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-accent/40 transition cursor-pointer text-left",
                      !n.is_read ? "bg-primary/5 font-medium" : "opacity-75",
                    )}
                  >
                    {getNotificationIcon(n.type, n.category)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {n.title}
                        </div>
                        <span className="text-[10px] text-muted-foreground/70 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.description}
                      </div>
                    </div>
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} to={n.link as never}>
                    {content}
                  </Link>
                ) : (
                  content
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t border-border/40 bg-muted/20 text-center">
              <button
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="w-full text-xs font-semibold text-primary hover:bg-primary/10 py-1.5 px-3 rounded-lg transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Ver todas las notificaciones ({notifications.length})
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <NotificationsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={(id) => markReadMutation.mutate(id)}
        onMarkAll={() => markAllMutation.mutate()}
        isMarkingAll={markAllMutation.isPending}
      />
    </>
  );
}

export function Topbar() {
  const { theme, toggleTheme, navPosition } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segments = path.split("/").filter(Boolean);
  const [search, setSearch] = useState("");
  // Ocultar la búsqueda global en flujos de edición enfocados: navegar fuera de un
  // wizard multi-paso o de un set en construcción pierde el progreso no guardado.
  const hideSearch = path === "/app/procesos/nuevo" || /^\/app\/sets\/[^/]+$/.test(path);

  return (
    <header
      className={cn(
        "w-full px-4 lg:px-6 transition-[padding] duration-300",
        navPosition !== "top" && "pt-4 lg:pt-5",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2 rounded-full border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm pl-2 shrink-0">
          {segments.map((seg, i) => {
            const prevSeg = i > 0 ? segments[i - 1] : undefined;
            const isLast = i === segments.length - 1;
            const rawHref = "/" + segments.slice(0, i + 1).join("/");
            const href =
              !isLast && breadcrumbHrefOverrides[seg] ? breadcrumbHrefOverrides[seg] : rawHref;
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                <BreadcrumbItem seg={seg} prevSeg={prevSeg} href={href} isLast={isLast} />
              </span>
            );
          })}
        </nav>

        {/* Search — oculta en flujos de edición enfocados (ver hideSearch) */}
        <div className="flex-1 min-w-0">
          {!hideSearch && (
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                const query = search.trim();
                if (query.length >= 2) navigate({ to: "/app/buscar", search: { q: query } });
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar procesos, candidatos, sets…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-muted/60 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </form>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Usuario y rol */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
            title={user ? `${user.name} ${user.last_name} (${user.email})` : undefined}
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="hidden sm:inline">
              {user ? `${user.name} · ${USER_ROLE_LABEL[user.role]}` : "…"}
            </span>
          </div>

          {/* Notifications */}
          <PopoverNotifications />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
