import { ReactNode } from 'react';
import { Search, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  rightBelow?: ReactNode;
}

export function Header({ title, subtitle, children, rightBelow }: HeaderProps) {
  const { role } = useAuth();
  
  const roleName = role === 'ADMIN' ? 'Administrador' : role === 'RECRUITER' ? 'Reclutador' : role === 'TA_LEADER' ? 'TA Leader' : 'Usuario';
  const roleInitial = role ? role.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col gap-4 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-[20px] text-ink leading-tight">{title}</h1>
          {subtitle && <p className="text-text-muted text-[12px]">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block w-64">
            <Input 
              placeholder="Buscar..." 
              leftIcon={<Search size={16} />}
              className="bg-surface"
            />
          </div>
          
          <button className="relative p-2 rounded-full text-text hover:bg-bg-subtle transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary" aria-label="Notificaciones">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-coral rounded-full border border-surface"></span>
          </button>

          <ThemeToggle />

          <div className="flex items-center gap-2 bg-surface border border-border rounded-full pl-1 pr-3 py-1 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {roleInitial}
            </div>
            <span className="text-sm font-medium text-text hidden sm:block">{roleName}</span>
          </div>

          {children && (
            <div className="ml-2">
              {children}
            </div>
          )}
        </div>
      </div>
      
      {rightBelow && (
        <div className="flex justify-end">
          {rightBelow}
        </div>
      )}
    </div>
  );
}

export default Header;
