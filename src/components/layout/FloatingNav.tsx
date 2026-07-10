'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, MessageSquare, Plus, BarChart2, DollarSign, Settings, LogOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbarPosition } from '@/contexts/NavbarPositionContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/hiring-processes', exact: false, ignore: '/hiring-processes/new', icon: LayoutGrid, label: 'Procesos', bg: 'var(--color-primary-xlight)', color: 'var(--color-primary)' },
  { path: '/question-sets', exact: false, icon: MessageSquare, label: 'Preguntas', bg: 'var(--color-mint-light)', color: 'var(--color-mint-dark)' },
  { path: '/hiring-processes/new', exact: true, icon: Plus, label: 'Nuevo', bg: 'var(--color-blue-light)', color: 'var(--color-blue)' },
  { path: '/dashboard', exact: false, icon: BarChart2, label: 'Dashboard', bg: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' },
  { path: '/metrics', exact: false, icon: DollarSign, label: 'Costos', bg: 'var(--color-pink-light)', color: 'var(--color-pink)' },
];

export default function FloatingNav() {
  const { position, setPosition } = useNavbarPosition();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setIsAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [...NAV_ITEMS];
  if (role === 'ADMIN') {
    items.push({ path: '/settings', exact: false, icon: Settings, label: 'Config', bg: 'var(--color-bg-subtle)', color: 'var(--color-text)' });
  }

  const isHorizontal = position === 'top' || position === 'bottom';
  const roleInitial = role ? role.charAt(0).toUpperCase() : 'U';

  const positionClasses = {
    left: 'left-3 top-1/2 -translate-y-1/2 flex-col',
    right: 'right-3 top-1/2 -translate-y-1/2 flex-col',
    top: 'top-3 left-1/2 -translate-x-1/2 flex-row',
    bottom: 'bottom-3 left-1/2 -translate-x-1/2 flex-row'
  };

  const updatePosition = (pos: 'left'|'right'|'top'|'bottom') => {
    setPosition(pos);
    setIsAvatarOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <motion.div
      layout
      className={clsx(
        "fixed z-50 flex items-center bg-surface-raised border border-border rounded-full shadow-lg p-2 gap-2",
        positionClasses[position]
      )}
    >
      {items.map((item, idx) => {
        const isActive = item.exact
          ? pathname === item.path
          : pathname.startsWith(item.path) && (!item.ignore || !pathname.startsWith(item.ignore));
        
        const isHovered = hoveredIndex === idx;
        const showLabel = isHorizontal && (isActive || isHovered);

        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative flex items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary overflow-hidden"
            style={{ 
              backgroundColor: isActive || isHovered ? item.bg : 'transparent',
              minWidth: '40px',
              height: '40px',
              padding: showLabel ? '0 16px 0 12px' : '0'
            }}
            aria-label={item.label}
          >
            <item.icon 
              size={20} 
              style={{ color: isActive || isHovered ? item.color : 'var(--color-text-muted)' }} 
              className="shrink-0"
            />
            {isHorizontal && (
              <AnimatePresence>
                {showLabel && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    className="font-medium text-[13px] whitespace-nowrap"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </button>
        );
      })}

      <div className={clsx("bg-border shrink-0", isHorizontal ? "w-[1px] h-8" : "h-[1px] w-8")} />

      <div className="relative" ref={avatarRef}>
        <button
          onClick={() => setIsAvatarOpen(!isAvatarOpen)}
          className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center hover:bg-primary-dark transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          aria-label="Menú de usuario"
        >
          {roleInitial}
        </button>

        <AnimatePresence>
          {isAvatarOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={clsx(
                "absolute bg-surface-raised border border-border shadow-xl rounded-[var(--radius-md)] p-2 w-48 flex flex-col gap-1 z-50",
                position === 'left' ? 'left-full ml-4 top-0' :
                position === 'right' ? 'right-full mr-4 top-0' :
                position === 'top' ? 'top-full mt-4 right-0' :
                'bottom-full mb-4 right-0'
              )}
            >
              <div className="text-xs font-semibold text-text-muted px-2 py-1 uppercase tracking-wide">Posición</div>
              <div className="grid grid-cols-3 gap-1 px-2 mb-2">
                <div />
                <button onClick={() => updatePosition('top')} className="p-1.5 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-bg-subtle text-text" aria-label="Arriba"><ChevronUp size={16} /></button>
                <div />
                <button onClick={() => updatePosition('left')} className="p-1.5 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-bg-subtle text-text" aria-label="Izquierda"><ChevronLeft size={16} /></button>
                <div />
                <button onClick={() => updatePosition('right')} className="p-1.5 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-bg-subtle text-text" aria-label="Derecha"><ChevronRight size={16} /></button>
                <div />
                <button onClick={() => updatePosition('bottom')} className="p-1.5 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-bg-subtle text-text" aria-label="Abajo"><ChevronDown size={16} /></button>
                <div />
              </div>
              <div className="h-[1px] bg-border my-1" />
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-coral hover:bg-coral-light hover:text-coral-dark rounded-[var(--radius-sm)] font-medium transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
