'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui';

export default function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = pathname === '/login';

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace('/login');
    }
    if (user && isPublic) {
      router.replace('/dashboard');
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  // Página de login: renderiza sem sidebar/topbar
  if (isPublic) {
    return <>{children}</>;
  }

  if (!user) return null;

  return <>{children}</>;
}
