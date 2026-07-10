import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search, Sun, Moon, ChevronDown, AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { roleLabels, type Role } from "@/lib/mock-data";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { role, setRole, theme, toggleTheme } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const segments = path.split("/").filter(Boolean);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center gap-4 px-6 h-16">
        {/* Breadcrumbs — every segment is clickable */}
        <nav className="flex items-center gap-2 text-sm">
          {segments.map((seg, i) => {
            const label = breadcrumbMap[seg] || decodeURIComponent(seg);
            const isLast = i === segments.length - 1;
            const href = "/" + segments.slice(0, i + 1).join("/");
            return (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                <Link
                  to={href as string}
                  className={cn(
                    "rounded-md px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground",
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
        <div className="flex-1 max-w-md ml-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar procesos, candidatos, sets…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-background/60 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/15 to-info/15 border border-primary/20 text-sm font-medium hover:from-primary/25 hover:to-info/25 transition">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="hidden sm:inline">Rol: {roleLabels[role]}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">
                Demo · cambiar rol
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(roleLabels) as Role[]).map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRole(r)} className="cursor-pointer">
                  <span className={role === r ? "font-semibold text-primary" : ""}>{roleLabels[r]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger className="relative h-9 w-9 grid place-items-center rounded-xl bg-background/60 border border-border/60 hover:bg-background transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50">
                <div className="text-sm font-semibold">Notificaciones</div>
                <div className="text-xs text-muted-foreground">3 alertas recientes</div>
              </div>
              <div className="max-h-80 overflow-auto">
                {[
                  { icon: AlertTriangle, color: "text-warning", title: "Presupuesto al 80%", desc: "El proceso 'Backend Sr' alcanzó 80% del presupuesto.", time: "Hace 12 min" },
                  { icon: DollarSign, color: "text-destructive", title: "Presupuesto excedido", desc: "Proceso 'Account Manager Bogotá' superó el límite mensual.", time: "Hace 1 h" },
                  { icon: CheckCircle2, color: "text-success", title: "Profiling completado", desc: "5 candidatos terminaron la llamada en 'Data Engineer'.", time: "Hace 3 h" },
                ].map((n, i) => (
                  <Link to="/app" key={i} className="flex gap-3 px-4 py-3 hover:bg-accent/50 transition border-b border-border/30 last:border-0">
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
            className="h-9 w-9 grid place-items-center rounded-xl bg-background/60 border border-border/60 hover:bg-background transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
