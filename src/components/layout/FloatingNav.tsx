'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, MessageSquareText, BarChart2, DollarSign,
  Plus, Settings, LogOut, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbarPosition, type NavPosition } from '@/contexts/NavbarPositionContext';

// ─── Nav items config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: '/hiring-processes', icon: LayoutGrid,        label: 'Procesos',       color: '#EDE9FE', iconColor: '#7C3AED' },
  { id: '/question-sets',    icon: MessageSquareText, label: 'Preguntas',      color: '#D1FAE5', iconColor: '#059669' },
  { id: '/hiring-processes/new', icon: Plus,          label: 'Nuevo',          color: '#DBEAFE', iconColor: '#2563EB' },
  { id: '/dashboard',        icon: BarChart2,         label: 'Dashboard',      color: '#FEF3C7', iconColor: '#D97706' },
  { id: '/metrics',          icon: DollarSign,        label: 'Costos',         color: '#FCE7F3', iconColor: '#DB2777' },
];

function getActiveId(pathname: string): string {
  if (pathname === '/hiring-processes/new') return '/hiring-processes/new';
  if (pathname.startsWith('/hiring-processes')) return '/hiring-processes';
  if (pathname.startsWith('/question-sets')) return '/question-sets';
  if (pathname === '/dashboard') return '/dashboard';
  if (pathname.startsWith('/metrics')) return '/metrics';
  if (pathname.startsWith('/settings')) return '/settings';
  return pathname;
}

// ─── Position arrows ──────────────────────────────────────────────────────────

const MOVE_TARGETS: Record<NavPosition, { icon: LucideIcon; pos: NavPosition }[]> = {
  left:   [{ icon: ChevronRight, pos: 'right' }, { icon: ChevronUp, pos: 'top' }, { icon: ChevronDown, pos: 'bottom' }],
  right:  [{ icon: ChevronLeft,  pos: 'left'  }, { icon: ChevronUp, pos: 'top' }, { icon: ChevronDown, pos: 'bottom' }],
  top:    [{ icon: ChevronDown,  pos: 'bottom'}, { icon: ChevronLeft, pos: 'left' }, { icon: ChevronRight, pos: 'right' }],
  bottom: [{ icon: ChevronUp,    pos: 'top'   }, { icon: ChevronLeft, pos: 'left' }, { icon: ChevronRight, pos: 'right' }],
};

// ─── Single nav item ─────────────────────────────────────────────────────────

interface ItemProps {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
  iconColor: string;
  active: boolean;
  isHorizontal: boolean;
}

function NavItem({ id, icon: Icon, label, color, iconColor, active, isHorizontal }: ItemProps) {
  return (
    <Link href={id} title={label}>
      <div
        className="flex items-center gap-2 transition-all duration-200 cursor-pointer select-none"
        style={{
          padding: active ? (isHorizontal ? '6px 12px 6px 8px' : '7px 10px') : '8px',
          borderRadius: 999,
          background: active ? color : 'transparent',
          flexDirection: isHorizontal ? 'row' : 'column',
          minWidth: active && isHorizontal ? 'auto' : undefined,
        }}
      >
        <Icon
          size={17}
          strokeWidth={active ? 2.4 : 1.8}
          style={{ color: active ? iconColor : '#94A3B8', flexShrink: 0 }}
        />
        {active && (
          <span
            className="text-[11px] font-semibold whitespace-nowrap leading-none"
            style={{ color: iconColor }}
          >
            {label}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Main floating nav ────────────────────────────────────────────────────────

export default function FloatingNav() {
  const pathname                     = usePathname();
  const router                       = useRouter();
  const { role, logout }             = useAuth();
  const { position, setPosition }    = useNavbarPosition();
  const [showMover, setShowMover]    = useState(false);

  const active       = getActiveId(pathname);
  const isHorizontal = position === 'top' || position === 'bottom';

  const handleLogout = () => { logout(); router.push('/login'); };

  // Position of the pill on screen
  const fixedStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
    ...(position === 'left'   && { left: 12,   top: '50%',  transform: 'translateY(-50%)' }),
    ...(position === 'right'  && { right: 12,  top: '50%',  transform: 'translateY(-50%)' }),
    ...(position === 'top'    && { top: 12,    left: '50%', transform: 'translateX(-50%)' }),
    ...(position === 'bottom' && { bottom: 12, left: '50%', transform: 'translateX(-50%)' }),
  };

  const items = role === 'ADMIN'
    ? [...NAV_ITEMS, { id: '/settings', icon: Settings, label: 'Config', color: '#F1F5F9', iconColor: '#475569' }]
    : NAV_ITEMS;

  return (
    <div style={fixedStyle}>
      {/* Pill */}
      <div
        className="flex items-center gap-1 bg-white"
        style={{
          flexDirection: isHorizontal ? 'row' : 'column',
          padding: 6,
          borderRadius: 999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Nav items */}
        {items.map((item) => (
          <NavItem
            key={item.id}
            {...item}
            active={active === item.id || (item.id === '/hiring-processes' && active.startsWith('/hiring-processes') && active !== '/hiring-processes/new')}
            isHorizontal={isHorizontal}
          />
        ))}

        {/* Divider */}
        <div style={{
          [isHorizontal ? 'width' : 'height']: 1,
          [isHorizontal ? 'height' : 'width']: 16,
          background: '#E2E8F0',
          margin: isHorizontal ? '0 2px' : '2px 0',
          flexShrink: 0,
          borderRadius: 1,
        }} />

        {/* User avatar + mover */}
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer select-none"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#DC2626)', flexShrink: 0 }}
          onClick={() => setShowMover((v) => !v)}
          title="Mover navbar / Opciones"
        >
          <span className="text-white text-[10px] font-bold">{role?.[0]?.toUpperCase() ?? 'U'}</span>

          {/* Move popover */}
          {showMover && (
            <div
              className="absolute bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1"
              style={{
                ...(position === 'left'   && { left: 40,   top: '50%', transform: 'translateY(-50%)' }),
                ...(position === 'right'  && { right: 40,  top: '50%', transform: 'translateY(-50%)' }),
                ...(position === 'top'    && { top: 44,    left: '50%', transform: 'translateX(-50%)' }),
                ...(position === 'bottom' && { bottom: 44, left: '50%', transform: 'translateX(-50%)' }),
                minWidth: 120,
                zIndex: 60,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2 py-1">Mover a</p>
              {MOVE_TARGETS[position].map(({ icon: Icon, pos }) => (
                <button
                  key={pos}
                  onClick={() => { setPosition(pos); setShowMover(false); }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-600 font-medium transition-colors capitalize"
                >
                  <Icon size={13} className="text-slate-400" />
                  {pos === 'left' ? 'Izquierda' : pos === 'right' ? 'Derecha' : pos === 'top' ? 'Arriba' : 'Abajo'}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => { setShowMover(false); handleLogout(); }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 text-xs text-red-500 font-medium transition-colors"
              >
                <LogOut size={13} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Layout offset helper ─────────────────────────────────────────────────────
// Call this in layout to add correct padding based on nav position
export function useNavOffset() {
  const { position } = useNavbarPosition();
  return {
    left:   position === 'left'   ? 88  : 0,
    right:  position === 'right'  ? 88  : 0,
    top:    position === 'top'    ? 72  : 0,
    bottom: position === 'bottom' ? 72  : 0,
  };
}
