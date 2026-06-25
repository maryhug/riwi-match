'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const roleLabel: Record<string, string> = {
  ADMIN:      'Administrador',
  RECRUITER:  'Reclutador',
  TA_LEADER:  'TA Leader',
};

export default function Header({ title, subtitle, children }: HeaderProps) {
  const { role } = useAuth();

  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1
          className="text-2xl font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: '#1E1B4B' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {children}

        {/* Notificaciones */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: '#EEE9FF' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#D4CCFC'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#EEE9FF'; }}
        >
          <Bell className="w-4 h-4" style={{ color: '#967DF5' }} strokeWidth={1.8} />
        </button>

        {/* Perfil */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
          style={{ background: '#EEE9FF' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#967DF5' }}
          >
            <span className="text-xs font-bold text-white">
              {role ? role[0] : 'U'}
            </span>
          </div>
          <span className="text-xs font-semibold hidden sm:block" style={{ color: '#7A6CE0' }}>
            {role ? roleLabel[role] : 'Usuario'}
          </span>
        </div>
      </div>
    </div>
  );
}
