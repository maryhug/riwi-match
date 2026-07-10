'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloatingNav from '@/components/layout/FloatingNav';
import { useAuth } from '@/contexts/AuthContext';
import { NavbarPositionProvider, useNavbarPosition } from '@/contexts/NavbarPositionContext';
import { Loader2 } from 'lucide-react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { position } = useNavbarPosition();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-text-muted font-medium">Cargando...</p>
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
    <div className="min-h-screen bg-bg">
      <FloatingNav />
      <main className="min-h-screen transition-all duration-300" style={pad}>
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
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
