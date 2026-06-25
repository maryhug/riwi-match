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
  ADMIN:     'Administrador',
  RECRUITER: 'Reclutador',
  TA_LEADER: 'TA Leader',
};

const roleInitial: Record<string, string> = {
  ADMIN:     'A',
  RECRUITER: 'R',
  TA_LEADER: 'T',
};

export default function Header({ title, subtitle, children, rightBelow }: HeaderProps) {
  const { role } = useAuth();

  return (
    <div className="flex items-start justify-between mb-7">
      {/* Left — title block */}
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight" style={{ color: 'var(--color-ink)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right — actions + user */}
      <div className="flex flex-col items-end gap-3 shrink-0 ml-6">
        <div className="flex items-center gap-2">
          {children}

          {/* Notificaciones */}
          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors border border-slate-200 bg-white hover:bg-slate-50"
          >
            <Bell className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
          </button>

          {/* Perfil */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              <span className="text-[10px] font-bold text-white">
                {role ? roleInitial[role] ?? role[0] : 'U'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:block">
              {role ? roleLabel[role] : 'Usuario'}
            </span>
          </div>
        </div>

        {rightBelow && (
          <div className="flex items-center gap-2">{rightBelow}</div>
        )}
      </div>
    </div>
  );
}
