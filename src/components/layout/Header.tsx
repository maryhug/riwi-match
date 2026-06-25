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
  const initials = role ? (roleInitial[role] ?? role[0].toUpperCase()) : 'U';

  return (
    <div className="flex items-start justify-between mb-6">
      {/* Left — title block */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5 text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white rounded-md border border-slate-200 outline-none w-48 placeholder:text-slate-400 text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
            />
          </div>

          {/* Bell */}
          <button className="relative w-8 h-8 rounded-md flex items-center justify-center transition-colors bg-white border border-slate-200 hover:bg-slate-50">
            <Bell className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>

          {/* User chip */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border border-slate-200">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DC2626 100%)' }}
            >
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-700 hidden sm:block">
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
