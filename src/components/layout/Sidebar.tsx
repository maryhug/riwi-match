'use client';

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, MessageSquareText, PhoneCall, Users, DollarSign,
  Settings, LogOut, Plus, Menu,
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** Rail geometry (px) */
const RAIL_W = 72; // Make it a bit smaller
const COVE_DEPTH = 56; // how far the cove curves into the rail
const COVE_H = 140; // vertical span of the moving cove
const CIRCLE = 44; // active pink circle diameter

// ─── Rutas ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: '/hiring-processes', icon: LayoutGrid,        label: 'Inicio' },
  { id: '/question-sets',    icon: MessageSquareText, label: 'Sets de Preguntas' },
  { id: '/profiling',        icon: PhoneCall,         label: 'Ejecución de Profiling' },
  { id: '/dashboard',        icon: Users,             label: 'Dashboard de Equipo' },
  { id: '/metrics',          icon: DollarSign,        label: 'Costos' },
];

function covePath() {
  const w = RAIL_W;
  const h = COVE_H;
  const inner = w - COVE_DEPTH;
  return [
    `M ${w} 0`,
    `C ${w} ${h * 0.26} ${inner} ${h * 0.2} ${inner} ${h * 0.5}`,
    `C ${inner} ${h * 0.8} ${w} ${h * 0.74} ${w} ${h}`,
    "Z",
  ].join(" ");
}

const spring = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useAuth();
  
  const handleLogout = () => { logout(); router.push('/login'); };

  // Calculate active route exactly like the old Sidebar
  const getActiveId = () => {
    if (pathname === '/hiring-processes/new') return 'new-process';
    if (pathname === '/settings') return '/settings';
    
    // Otherwise check prefix
    for (const item of NAV_ITEMS) {
      if (item.id === '/hiring-processes') {
        if (pathname === '/hiring-processes' || (pathname.startsWith('/hiring-processes') && pathname !== '/hiring-processes/new')) {
          return item.id;
        }
      } else if (item.id === '/dashboard') {
        if (pathname === '/dashboard') return item.id;
      } else {
        if (pathname.startsWith(item.id)) return item.id;
      }
    }
    return pathname;
  };

  const active = getActiveId();
  
  const railRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement | null>>({});
  const [activeY, setActiveY] = useState(0);

  // We need to re-measure when pathname changes
  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      const el = itemRefs.current[active];
      if (!rail || !el) return;
      const railTop = rail.getBoundingClientRect().top;
      const r = el.getBoundingClientRect();
      setActiveY(r.top - railTop + r.height / 2);
    };
    
    // Slight delay to ensure DOM has updated if fonts/icons load
    measure();
    const timeout = setTimeout(measure, 50);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(timeout);
    };
  }, [active]);

  // Merge the old Avatar logic
  const renderAvatar = () => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-coral) 0%, var(--color-primary) 100%)',
        border: '2px solid rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'default',
        position: 'relative',
        zIndex: 3,
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>
        {role ? role[0].toUpperCase() : 'U'}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        top: 16,
        bottom: 16,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12, // space between logo and rail
        width: RAIL_W,
      }}
    >
      {/* Floating Logo Circle (no white background) */}
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-rail)] shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
        style={{ width: RAIL_W, height: RAIL_W }}
      >
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
          <rect x="9" y="2"  width="4" height="18" rx="2" fill="var(--color-coral)" />
          <rect x="2" y="9"  width="18" height="4" rx="2" fill="var(--color-coral)" />
        </svg>
      </div>

      {/* Floating Rail Pill */}
      <div
        ref={railRef}
        className="relative flex flex-1 flex-col items-center bg-[var(--color-rail)] shadow-[4px_8px_24px_rgba(0,0,0,0.12)]"
        style={{ 
          width: RAIL_W,
          borderRadius: RAIL_W / 2, // perfectly rounded top and bottom
          overflow: 'visible' // allow cove and active circle to break out
        }}
      >
        {/* Moving cove (carves the rail edge with canvas colour) */}
        <motion.svg
          className="pointer-events-none absolute left-0 z-10"
          width={RAIL_W}
          height={COVE_H}
          viewBox={`0 0 ${RAIL_W} ${COVE_H}`}
          fill="none"
          initial={false}
          animate={{ top: activeY - COVE_H / 2 }}
          transition={spring}
          style={{ top: activeY - COVE_H / 2 }}
        >
          <path d={covePath()} fill="#F8FAFC" />
        </motion.svg>

        {/* Active pink circle (rides the cove) */}
        <motion.div
          className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full bg-[var(--color-rail-active)] shadow-[0_10px_24px_-6px_rgba(244,180,200,0.7)]"
          style={{
            width: CIRCLE,
            height: CIRCLE,
            left: RAIL_W - CIRCLE / 2 - 20, // adjust overlap depth slightly
            top: activeY - CIRCLE / 2,
          }}
          initial={false}
          animate={{
            left: RAIL_W - CIRCLE / 2 - 20,
            top: activeY - CIRCLE / 2,
          }}
          transition={spring}
        >
          {(() => {
            let Icon: LucideIcon = LayoutGrid;
            if (active === 'new-process') Icon = Plus;
            else if (active === '/settings') Icon = Settings;
            else {
              const f = NAV_ITEMS.find((n) => n.id === active);
              if (f) Icon = f.icon;
            }
            return <Icon className="h-5 w-5 text-[var(--color-rail-active-foreground)]" strokeWidth={2.2} />;
          })()}
        </motion.div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col items-center justify-start gap-6 py-6 relative z-30 w-full">
          {/* Start item */}
          <Link
            href="/hiring-processes"
            ref={(el) => { itemRefs.current['/hiring-processes'] = el; }}
            aria-label="Inicio"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
          >
            <LayoutGrid
              className={`h-[20px] w-[20px] transition-all duration-200 ${
                active === '/hiring-processes' ? "opacity-0" : "text-[var(--color-rail-muted)] hover:text-[var(--color-canvas)]"
              }`}
              strokeWidth={1.9}
            />
          </Link>
          
          {/* CTA: Nuevo proceso */}
          <Link
            href="/hiring-processes/new"
            ref={(el) => { itemRefs.current['new-process'] = el; }}
            aria-label="Nuevo Proceso"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
          >
            <Plus
              className={`h-[20px] w-[20px] transition-all duration-200 ${
                active === 'new-process' ? "opacity-0" : "text-[var(--color-rail-muted)] hover:text-[var(--color-canvas)]"
              }`}
              strokeWidth={2.5}
            />
          </Link>

          {NAV_ITEMS.filter(n => n.id !== '/hiring-processes').map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
              >
                <Icon
                  className={`h-[20px] w-[20px] transition-all duration-200 ${
                    isActive ? "opacity-0" : "text-[var(--color-rail-muted)] hover:text-[var(--color-canvas)]"
                  }`}
                  strokeWidth={1.9}
                />
              </Link>
            );
          })}
        </nav>

        {/* Footer: settings + avatar + logout */}
        <div className="flex shrink-0 flex-col items-center gap-6 pb-8 relative z-30">
          {role === 'ADMIN' && (
            <Link
              href="/settings"
              ref={(el) => { itemRefs.current['/settings'] = el; }}
              aria-label="Configuración"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
            >
              <Settings
                className={`h-[20px] w-[20px] transition-all duration-200 ${
                  active === '/settings' ? "opacity-0" : "text-[var(--color-rail-muted)] hover:text-[var(--color-canvas)]"
                }`}
                strokeWidth={1.9}
              />
            </Link>
          )}

          <div className="transition-transform hover:scale-105">
            {renderAvatar()}
          </div>
          
          <button
            aria-label="Cerrar sesión"
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-rail-muted)] transition-colors hover:text-[var(--color-canvas)] hover:bg-[var(--color-coral)]/10 hover:text-[var(--color-coral)]"
          >
            <LogOut className="h-[20px] w-[20px]" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Keep these for layout.tsx compatibility
export const V_W = RAIL_W;
export const H_H = 76;
export const GAP = 16;
