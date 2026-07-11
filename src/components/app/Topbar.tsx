import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search, Sun, Moon, AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { USER_ROLE_LABEL } from "@/lib/types/enums";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
  app: "Inicio",
  sets: "Sets de Preguntas",
  profiling: "Ejecución de Profiling",
  equipo: "Dashboard de Equipo",
  costos: "Costos",
  admin: "Administración",
  procesos: "Procesos",
  nuevo: "Nuevo",
};

export function Topbar() {
  const { theme, toggleTheme } = useApp();
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segments = path.split("/").filter(Boolean);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-4 z-30 mx-4 lg:mx-6">
      <div className="flex items-center gap-3 px-3 py-2 rounded-full border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm pl-2 shrink-0">
          {segments.map((seg, i) => {
            const label = breadcrumbMap[seg] || decodeURIComponent(seg);
            const isLast = i === segments.length - 1;
            const href = "/" + segments.slice(0, i + 1).join("/");
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                <Link
                  to={href as never}
                  className={cn(
                    "rounded-full px-2 py-0.5 transition hover:bg-muted hover:text-foreground",
                    isLast ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </Link>
              </span>
            );
          })}
        </nav>

        {/* Search */}
        <div className="flex-1 min-w-0 max-w-md">
          <div className="relative" title="Próximamente">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar procesos, candidatos, sets… (próximamente)"
              disabled
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-muted/60 border border-transparent focus:outline-none placeholder:text-muted-foreground cursor-not-allowed opacity-70"
            />
          </div>
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
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger
              className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition"
              title="Próximamente"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50">
                <div className="text-sm font-semibold">Notificaciones</div>
                <div className="text-xs text-muted-foreground">
                  Próximamente — ejemplo de cómo se verán
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                {[
                  {
                    icon: AlertTriangle,
                    color: "text-warning",
                    title: "Presupuesto al 80%",
                    desc: "El proceso 'Backend Sr' alcanzó 80% del presupuesto.",
                    time: "Hace 12 min",
                  },
                  {
                    icon: DollarSign,
                    color: "text-destructive",
                    title: "Presupuesto excedido",
                    desc: "Proceso 'Account Manager Bogotá' superó el límite mensual.",
                    time: "Hace 1 h",
                  },
                  {
                    icon: CheckCircle2,
                    color: "text-success",
                    title: "Profiling completado",
                    desc: "5 candidatos terminaron la llamada en 'Data Engineer'.",
                    time: "Hace 3 h",
                  },
                ].map((n, i) => (
                  <Link
                    to="/app"
                    key={i}
                    className="flex gap-3 px-4 py-3 hover:bg-accent/50 transition border-b border-border/30 last:border-0"
                  >
                    <n.icon className={`h-4 w-4 mt-0.5 shrink-0 ${n.color}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{n.desc}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
