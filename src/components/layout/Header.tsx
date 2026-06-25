'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search } from 'lucide-react';

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
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5 text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right — search + bell + user + actions */}
      <div className="flex flex-col items-end gap-3 shrink-0 ml-6">
        <div className="flex items-center gap-2.5">

          {/* Buscador */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-8 pr-4 py-2 text-sm bg-white rounded-lg outline-none w-48 placeholder:text-slate-400 text-slate-700 transition-all"
              style={{ border: '1.5px solid #E2E8F0' }}
              onFocus={e => (e.currentTarget.style.border = '1.5px solid #7C3AED')}
              onBlur={e  => (e.currentTarget.style.border = '1.5px solid #E2E8F0')}
            />
          </div>

          {/* Campanita */}
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-white hover:bg-slate-50"
            style={{ border: '1.5px solid #E2E8F0' }}>
            <Bell className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>

          {/* Chip de usuario */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white"
            style={{ border: '1.5px solid #E2E8F0' }}>
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DC2626 100%)' }}
            >
              <span className="text-[10px] font-bold">
                {role ? roleInitial[role] ?? role[0] : 'U'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:block">
              {role ? roleLabel[role] : 'Usuario'}
            </span>
          </div>

          {/* Slot CTA */}
          {children}
        </div>

        {rightBelow && (
          <div className="flex items-center gap-2">{rightBelow}</div>
        )}
      </div>
    </div>
  );
}
