'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloatingNav from '@/components/layout/FloatingNav';
import { useAuth } from '@/contexts/AuthContext';
import { NavbarPositionProvider, useNavbarPosition } from '@/contexts/NavbarPositionContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { position } = useNavbarPosition();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin border-violet-600" />
          <p className="text-xs text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Dynamic padding based on nav position
  const pad = {
    paddingLeft:   position === 'left'   ? 100 : 32,
    paddingRight:  position === 'right'  ? 100 : 32,
    paddingTop:    position === 'top'    ? 84  : 28,
    paddingBottom: position === 'bottom' ? 84  : 28,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <FloatingNav />
      <main className="min-h-screen bg-slate-50 transition-all duration-300" style={pad}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavbarPositionProvider>
      <DashboardContent>{children}</DashboardContent>
    </NavbarPositionProvider>
  );
}
