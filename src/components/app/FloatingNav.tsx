import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase, ListChecks, PhoneCall, Users, DollarSign, Settings,
  Move, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut, Sparkles, Plus,
} from "lucide-react";
import { useApp, type NavPosition } from "@/lib/app-context";
import { roleLabels, type Role } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items: { to: string; label: string; icon: typeof Briefcase; roles: Role[] }[] = [
  { to: "/app", label: "Inicio", icon: Briefcase, roles: ["admin", "recruiter", "lider"] },
  { to: "/app/sets", label: "Sets", icon: ListChecks, roles: ["admin", "recruiter"] },
  { to: "/app/profiling", label: "Profiling", icon: PhoneCall, roles: ["admin", "recruiter"] },
  { to: "/app/equipo", label: "Equipo", icon: Users, roles: ["admin", "lider"] },
  { to: "/app/costos", label: "Costos", icon: DollarSign, roles: ["admin", "recruiter", "lider"] },
  { to: "/app/admin", label: "Admin", icon: Settings, roles: ["admin"] },
];

const wrapperPos: Record<NavPosition, string> = {
  top: "top-4 left-1/2 -translate-x-1/2 flex-row",
  bottom: "bottom-4 left-1/2 -translate-x-1/2 flex-row",
  left: "left-4 top-1/2 -translate-y-1/2 flex-col",
  right: "right-4 top-1/2 -translate-y-1/2 flex-col",
};

const moveOptions: { pos: NavPosition; label: string; icon: typeof ChevronUp }[] = [
  { pos: "top", label: "Arriba", icon: ChevronUp },
  { pos: "bottom", label: "Abajo", icon: ChevronDown },
  { pos: "left", label: "Izquierda", icon: ChevronLeft },
  { pos: "right", label: "Derecha", icon: ChevronRight },
];

export function FloatingNav() {
  const { role, navPosition, setNavPosition } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((i) => i.roles.includes(role));
  const isVertical = navPosition === "left" || navPosition === "right";

  const pillClass = cn(
    "flex items-center gap-1 rounded-full border border-border/60 bg-card/85 p-1.5 shadow-sm backdrop-blur-xl",
    isVertical && "flex-col",
  );

  const bubbleBtn =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full transition";

  return (
    <div
      className={cn(
        "fixed z-40 flex gap-3 group/nav",
        "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        isVertical ? "gap-3" : "gap-3",
        wrapperPos[navPosition],
      )}
      style={{ willChange: "transform" }}
    >
      {/* Separated "add" / brand button */}
      <button
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-border/60 bg-primary text-primary-foreground shadow-sm hover:scale-105 transition",
          isVertical ? "h-10 w-10" : "h-11 w-11",
        )}
        aria-label="Nuevo"
      >
        <Plus className={isVertical ? "h-4 w-4" : "h-5 w-5"} />
      </button>

      {/* Main nav pill */}
      <nav className={pillClass}>
        {!isVertical && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        {visible.map((item) => {
          const Icon = item.icon;
          const active = path === item.to || (item.to !== "/app" && path.startsWith(item.to));

          if (isVertical) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300",
                  active
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-2 rounded-full h-9 px-2 text-sm font-medium",
                "transition-all duration-300 ease-out",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                  active
                    ? "max-w-[160px] pr-1.5 opacity-100"
                    : "max-w-0 opacity-0 group-hover/nav:max-w-[160px] group-hover/nav:pr-1.5 group-hover/nav:opacity-100",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Separated utility pill (move + avatar) */}
      <div className={pillClass}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(bubbleBtn, "h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground")}
            aria-label="Mover navegación"
          >
            <Move className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Mover a
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {moveOptions.map((o) => {
              const OIcon = o.icon;
              return (
                <DropdownMenuItem
                  key={o.pos}
                  onClick={() => setNavPosition(o.pos)}
                  className={cn("cursor-pointer gap-2", navPosition === o.pos && "text-primary font-semibold")}
                >
                  <OIcon className="h-4 w-4" /> {o.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenu>

        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground",
          )}
          title={roleLabels[role]}
        >
          {role === "admin" ? "MV" : role === "recruiter" ? "CR" : "SH"}
        </div>
      </div>
    </div>
  );
}
