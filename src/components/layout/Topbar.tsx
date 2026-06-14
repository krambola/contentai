'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import toast from 'react-hot-toast';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos e Serviços',
  '/analise': 'Análise IA',
  '/calendario': 'Calendário Automático',
  '/ideias': 'Gerador de Ideias',
  '/roteiros': 'Gerador de Roteiros',
  '/artes': 'Artes com IA',
  '/radar': 'Radar de Oportunidades',
  '/acoes': 'Próximas Ações',
  '/biblioteca': 'Biblioteca',
};

export default function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? '';

  async function handleLogout() {
    await logout();
    router.push('/login');
    toast.success('Até logo!');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <User size={13} className="text-brand-600" />
              )}
            </div>
            <span className="text-xs text-gray-500 hidden sm:block">
              {user.displayName ?? user.email?.split('@')[0]}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <LogOut size={12} />
          Sair
        </button>
      </div>
    </header>
  );
}
