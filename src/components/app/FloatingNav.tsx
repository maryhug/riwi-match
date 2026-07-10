import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase, ListChecks, PhoneCall, Users, DollarSign, Settings,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut, Plus,
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

  const isSets = path === "/app/sets" || path.startsWith("/app/sets/");
  const buttonText = isSets ? "Nuevo set" : "Nuevo proceso";

  const pillClass = cn(
    "flex items-center gap-1 rounded-full border border-border/60 bg-card/85 p-1.5 shadow-sm backdrop-blur-xl",
    isVertical && "flex-col",
  );

  const bubbleBtn =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full transition";

  return (
    <div
      className={cn(
        "fixed z-40 flex gap-3 group/nav items-center",
        "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        wrapperPos[navPosition],
      )}
      style={{ willChange: "transform" }}
    >
      {/* Separated "add" / brand button */}
      <button
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-all duration-300",
          isVertical
            ? "h-12 w-12"
            : "h-12 w-12 hover:w-auto hover:px-4 hover:gap-2 group/btn"
        )}
        aria-label={buttonText}
      >
        <Plus className="h-5 w-5 shrink-0" />
        {!isVertical && (
          <span
            className="overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-medium max-w-0 opacity-0 group-hover/btn:max-w-[180px] group-hover/btn:opacity-100"
          >
            {buttonText}
          </span>
        )}
      </button>

      {/* Main nav pill */}
      <nav className={pillClass}>

        {visible.map((item) => {
          const Icon = item.icon;
          const active = path === item.to || (item.to !== "/app" && path.startsWith(item.to));

          const isLeft = navPosition === "left";
          const isRight = navPosition === "right";

          return (
            <div 
              key={item.to} 
              className={cn(
                "relative group/item flex items-center justify-center h-9 shrink-0 z-10",
                "transition-all duration-300 ease-in-out",
                isVertical ? "w-9" : "w-auto"
              )}
            >
              <Link
                to={item.to}
                className={cn(
                  "flex items-center h-9 rounded-full overflow-hidden transition-all duration-300 ease-in-out",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isVertical ? "absolute" : "relative px-2",
                  isLeft && isVertical ? "left-0" : "",
                  isRight && isVertical ? "right-0" : ""
                )}
                aria-label={item.label}
              >
                <div className={cn(
                  "grid h-9 shrink-0 place-items-center transition-all duration-300 ease-in-out",
                  isVertical ? "w-9" : "w-5 mr-2",
                  isLeft && isVertical ? "order-1" : (isRight && isVertical ? "order-2" : "order-1")
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span 
                  className={cn(
                    "whitespace-nowrap font-medium text-sm transition-all duration-300 ease-in-out",
                    !isVertical && (active 
                      ? "max-w-[160px] opacity-100 pr-1.5" 
                      : "max-w-0 opacity-0 group-hover/nav:max-w-[160px] group-hover/nav:opacity-100 group-hover/nav:pr-1.5"),
                    isVertical && "max-w-0 opacity-0 group-hover/item:max-w-[160px] group-hover/item:opacity-100",
                    isLeft && isVertical ? "order-2 group-hover/item:pr-3" : "",
                    isRight && isVertical ? "order-1 group-hover/item:pl-3" : ""
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Separated utility pill (avatar with options) */}
      <div className={pillClass}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition shadow-sm focus:outline-none"
            title={roleLabels[role]}
          >
            {role === "admin" ? "MV" : role === "recruiter" ? "CR" : "SH"}
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
      </div>
    </div>
  );
}
