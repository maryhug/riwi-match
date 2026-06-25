'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { NavbarPositionProvider, useNavbarPosition } from '@/contexts/NavbarPositionContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { position } = useNavbarPosition();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F1F5F9' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const mainStyle: React.CSSProperties = {
    flex: 1,
    minHeight: '100vh',
    padding: '32px',
    background: '#F1F5F9',
    marginLeft: '88px',
  };

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh' }}>
      <Sidebar />
      <main style={mainStyle}>
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
