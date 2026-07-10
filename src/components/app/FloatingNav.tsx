import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase, ListChecks, PhoneCall, Users, DollarSign, Settings,
  Move, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut, Sparkles,
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

const positionClasses: Record<NavPosition, string> = {
  top: "top-4 left-1/2 -translate-x-1/2",
  bottom: "bottom-4 left-1/2 -translate-x-1/2",
  left: "left-4 top-1/2 -translate-y-1/2",
  right: "right-4 top-1/2 -translate-y-1/2",
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

  return (
    <nav
      className={cn(
        "fixed z-40 group/nav",
        "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        positionClasses[navPosition],
      )}
      style={{ willChange: "transform" }}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1.5 shadow-lg backdrop-blur-xl",
          "transition-[padding,gap] duration-300",
          isVertical && "flex-col",
        )}
      >
        {/* Brand mark */}
        <div className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground",
          isVertical ? "mb-1" : "mr-1",
        )}>
          <Sparkles className="h-4 w-4" />
        </div>

        {visible.map((item) => {
          const Icon = item.icon;
          const active = path === item.to || (item.to !== "/app" && path.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group/item relative flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium",
                "transition-all duration-300 ease-out",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                  // Expand on hover of the item OR the whole nav (for horizontal); collapsed for non-active by default
                  active
                    ? "max-w-[160px] opacity-100"
                    : "max-w-0 opacity-0 group-hover/nav:max-w-[160px] group-hover/nav:opacity-100",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className={cn(
          "shrink-0 bg-border/60",
          isVertical ? "my-1 h-px w-6" : "mx-1 h-6 w-px",
        )} />

        {/* Move menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground",
            isVertical ? "mt-1" : "ml-1",
          )}
          title={roleLabels[role]}
        >
          {role === "admin" ? "MV" : role === "recruiter" ? "CR" : "SH"}
        </div>
      </div>
    </nav>
  );
}
