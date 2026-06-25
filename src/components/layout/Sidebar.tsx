'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, MessageSquareText, BarChart2, DollarSign,
  Settings, LogOut, Plus,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { id: '/hiring-processes', icon: LayoutGrid,        label: 'Procesos' },
  { id: '/question-sets',    icon: MessageSquareText, label: 'Sets de Preguntas' },
  { id: '/dashboard',        icon: BarChart2,         label: 'Dashboard' },
  { id: '/metrics',          icon: DollarSign,        label: 'Costos' },
];

const roleLabel: Record<string, string> = {
  ADMIN:     'Administrador',
  RECRUITER: 'Reclutador',
  TA_LEADER: 'TA Leader',
};

const roleInitial: Record<string, string> = {
  ADMIN:     'A',
  RECRUITER: 'R',
  TA_LEADER: 'T',
};

function getActiveId(pathname: string): string {
  if (pathname.startsWith('/hiring-processes')) return '/hiring-processes';
  if (pathname.startsWith('/question-sets')) return '/question-sets';
  if (pathname === '/dashboard') return '/dashboard';
  if (pathname.startsWith('/metrics')) return '/metrics';
  if (pathname.startsWith('/settings')) return '/settings';
  return pathname;
}

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 relative"
      style={
        active
          ? {
              background: '#F5F3FF',
              color: '#7C3AED',
              fontWeight: 600,
              borderLeft: '3px solid #7C3AED',
              paddingLeft: '9px',
            }
          : {
              color: '#475569',
              paddingLeft: '12px',
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#F8FAFC';
          e.currentTarget.style.color = '#0F172A';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      <Icon
        className="shrink-0"
        size={18}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useAuth();

  const active = getActiveId(pathname);
  const handleLogout = () => { logout(); router.push('/login'); };

  const initials = role ? (roleInitial[role] ?? role[0].toUpperCase()) : 'U';
  const roleName = role ? (roleLabel[role] ?? role) : 'Usuario';

  return (
    <div
      className="fixed left-0 top-0 bottom-0 flex flex-col bg-white z-40"
      style={{
        width: 240,
        borderRight: '1px solid #E2E8F0',
      }}
    >
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#7C3AED' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M8 5L11 7V11H5V7L8 5Z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-violet-700">RIWI MATCH</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase tracking-wide">AI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            href={item.id}
            icon={item.icon}
            label={item.label}
            active={active === item.id}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
        {/* New Process CTA */}
        <Link
          href="/hiring-processes/new"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-sm font-semibold text-white transition-colors duration-150"
          style={{ background: '#7C3AED' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#6D28D9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#7C3AED'; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Nuevo Proceso
        </Link>

        <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }} />

        {/* Settings (admin only) */}
        {role === 'ADMIN' && (
          <NavItem
            href="/settings"
            icon={Settings}
            label="Configuración"
            active={active === '/settings'}
          />
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DC2626 100%)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{roleName}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
          >
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Keep exports for layout.tsx compatibility
export const V_W = 240;
export const H_H = 56;
export const GAP = 0;
