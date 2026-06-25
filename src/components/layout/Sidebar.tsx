'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, MessageSquareText, BarChart2, DollarSign,
  Settings, LogOut, Plus,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const V_W = 72;
export const H_H = 76;
export const GAP = 16;

const COVE_DEPTH = 56;
const COVE_H = 140;
const CIRCLE = 44;

const NAV_ITEMS = [
  { id: '/hiring-processes', icon: LayoutGrid,        label: 'Procesos' },
  { id: '/question-sets',    icon: MessageSquareText, label: 'Sets de Preguntas' },
  { id: '/dashboard',        icon: BarChart2,         label: 'Dashboard' },
  { id: '/metrics',          icon: DollarSign,        label: 'Costos' },
];

const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 } as const;

function covePath() {
  const w = V_W;
  const h = COVE_H;
  const inner = w - COVE_DEPTH;
  return [
    `M ${w} 0`,
    `C ${w} ${h * 0.26} ${inner} ${h * 0.2} ${inner} ${h * 0.5}`,
    `C ${inner} ${h * 0.8} ${w} ${h * 0.74} ${w} ${h}`,
    'Z',
  ].join(' ');
}

function getActiveId(pathname: string): string {
  if (pathname === '/hiring-processes/new') return 'new-process';
  if (pathname.startsWith('/hiring-processes')) return '/hiring-processes';
  if (pathname.startsWith('/question-sets')) return '/question-sets';
  if (pathname === '/dashboard') return '/dashboard';
  if (pathname.startsWith('/metrics')) return '/metrics';
  if (pathname.startsWith('/settings')) return '/settings';
  return pathname;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useAuth();

  const active = getActiveId(pathname);
  const handleLogout = () => { logout(); router.push('/login'); };

  const railRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement | null>>({});
  const [activeY, setActiveY] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      const el = itemRefs.current[active];
      if (!rail || !el) return;
      const railTop = rail.getBoundingClientRect().top;
      const r = el.getBoundingClientRect();
      setActiveY(r.top - railTop + r.height / 2);
    };
    measure();
    const t = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, [active]);

  const activeIcon = (() => {
    if (active === 'new-process') return Plus;
    if (active === '/settings') return Settings;
    return NAV_ITEMS.find((n) => n.id === active)?.icon ?? LayoutGrid;
  })();
  const ActiveIcon = activeIcon as LucideIcon;

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
        gap: 12,
        width: V_W,
      }}
    >
      {/* Logo pill */}
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-rail)] shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
        style={{ width: V_W, height: V_W }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="9" y="2" width="4" height="18" rx="2" fill="var(--color-coral)" />
          <rect x="2" y="9" width="18" height="4" rx="2" fill="var(--color-coral)" />
        </svg>
      </div>

      {/* Rail */}
      <div
        ref={railRef}
        className="relative flex flex-1 flex-col items-center bg-[var(--color-rail)] shadow-[4px_8px_24px_rgba(0,0,0,0.16)]"
        style={{ width: V_W, borderRadius: V_W / 2, overflow: 'visible' }}
      >
        {/* Cove cutout */}
        <motion.svg
          className="pointer-events-none absolute left-0 z-10"
          width={V_W}
          height={COVE_H}
          viewBox={`0 0 ${V_W} ${COVE_H}`}
          fill="none"
          initial={false}
          animate={{ top: activeY - COVE_H / 2 }}
          transition={spring}
          style={{ top: activeY - COVE_H / 2 }}
        >
          <path d={covePath()} fill="var(--color-canvas)" />
        </motion.svg>

        {/* Active circle */}
        <motion.div
          className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full bg-[var(--color-rail-active)]"
          style={{
            width: CIRCLE,
            height: CIRCLE,
            left: V_W - CIRCLE / 2 - 20,
            boxShadow: '0 10px 24px -6px rgba(220,38,38,0.55)',
          }}
          initial={false}
          animate={{ top: activeY - CIRCLE / 2 }}
          transition={spring}
        >
          <ActiveIcon className="h-5 w-5 text-white" strokeWidth={2.2} />
        </motion.div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col items-center justify-start gap-6 py-6 relative z-30 w-full">
          {/* Processes */}
          <Link
            href="/hiring-processes"
            ref={(el) => { itemRefs.current['/hiring-processes'] = el; }}
            aria-label="Procesos"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
          >
            <LayoutGrid
              className={`h-5 w-5 transition-opacity duration-200 ${active === '/hiring-processes' ? 'opacity-0' : 'text-[var(--color-rail-muted)] hover:text-slate-300'}`}
              strokeWidth={1.9}
            />
          </Link>

          {/* New process */}
          <Link
            href="/hiring-processes/new"
            ref={(el) => { itemRefs.current['new-process'] = el; }}
            aria-label="Nuevo Proceso"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
          >
            <Plus
              className={`h-5 w-5 transition-opacity duration-200 ${active === 'new-process' ? 'opacity-0' : 'text-[var(--color-rail-muted)] hover:text-slate-300'}`}
              strokeWidth={2.5}
            />
          </Link>

          {NAV_ITEMS.filter((n) => n.id !== '/hiring-processes').map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
              >
                <Icon
                  className={`h-5 w-5 transition-opacity duration-200 ${isActive ? 'opacity-0' : 'text-[var(--color-rail-muted)] hover:text-slate-300'}`}
                  strokeWidth={1.9}
                />
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex shrink-0 flex-col items-center gap-5 pb-8 relative z-30">
          {role === 'ADMIN' && (
            <Link
              href="/settings"
              ref={(el) => { itemRefs.current['/settings'] = el; }}
              aria-label="Configuración"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
            >
              <Settings
                className={`h-5 w-5 transition-opacity duration-200 ${active === '/settings' ? 'opacity-0' : 'text-[var(--color-rail-muted)] hover:text-slate-300'}`}
                strokeWidth={1.9}
              />
            </Link>
          )}

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full shrink-0 text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #DC2626 0%, #7C3AED 100%)', border: '2px solid rgba(255,255,255,0.15)' }}
          >
            {role ? role[0].toUpperCase() : 'U'}
          </div>

          <button
            aria-label="Cerrar sesión"
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-rail-muted)] hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}
