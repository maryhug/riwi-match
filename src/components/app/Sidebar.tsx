import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  ListChecks,
  PhoneCall,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { roleLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import type { Role } from "@/lib/mock-data";

const items: { to: string; label: string; icon: typeof Briefcase; roles: Role[] }[] = [
  { to: "/app", label: "Inicio", icon: Briefcase, roles: ["admin", "recruiter", "lider"] },
  { to: "/app/sets", label: "Sets de Preguntas", icon: ListChecks, roles: ["admin", "recruiter"] },
  { to: "/app/profiling", label: "Ejecución de Profiling", icon: PhoneCall, roles: ["admin", "recruiter"] },
  { to: "/app/equipo", label: "Dashboard de Equipo", icon: Users, roles: ["admin", "lider"] },
  { to: "/app/costos", label: "Costos", icon: DollarSign, roles: ["admin", "recruiter", "lider"] },
  { to: "/app/admin", label: "Administración", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const { role, sidebarCollapsed, toggleSidebar } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((i) => i.roles.includes(role));

  return (
    <aside
      className={cn(
        "sidebar-mesh relative flex flex-col text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
        sidebarCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-56 w-56 rounded-full bg-info/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-success/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pt-6 pb-8">
        {!sidebarCollapsed && (
          <Link to="/app" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-info shadow-lg shadow-primary/40">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold leading-none">RIWI <span className="text-primary">MATCH</span></div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 mt-1">Talent AI</div>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-info shadow-lg shadow-primary/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition", sidebarCollapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="relative z-10 flex-1 px-3 space-y-1">
        {visible.map((item) => {
          const Icon = item.icon;
          const active = path === item.to || (item.to !== "/app" && path.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40"
                  : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 m-3 rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-white font-semibold">
            {role === "admin" ? "MV" : role === "recruiter" ? "CR" : "SH"}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">
                {role === "admin" ? "Mateo Vargas" : role === "recruiter" ? "Camila Restrepo" : "Sofía Henríquez"}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{roleLabels[role]}</div>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground py-1.5 rounded-lg hover:bg-white/5 transition">
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}
