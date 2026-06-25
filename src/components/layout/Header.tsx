'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  rightBelow?: React.ReactNode;
}

const roleLabel: Record<string, string> = {
  ADMIN:      'Administrador',
  RECRUITER:  'Reclutador',
  TA_LEADER:  'TA Leader',
};

export default function Header({ title, subtitle, children, rightBelow }: HeaderProps) {
  const { role } = useAuth();

  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1
          className="text-2xl font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3">
          {children}

          {/* Notificaciones */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-primary-light)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#D4CCFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary-light)'; }}
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
          </button>

          {/* Perfil */}
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--color-primary-light)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              <span className="text-xs font-bold text-white">
                {role ? role[0] : 'U'}
              </span>
            </div>
            <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--color-primary-dark)' }}>
              {role ? roleLabel[role] : 'Usuario'}
            </span>
          </div>
        </div>
        
        {rightBelow && (
          <div className="flex items-center gap-3">
            {rightBelow}
          </div>
        )}
      </div>
    </div>
  );
}
