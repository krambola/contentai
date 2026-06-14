'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ChartBar,
  Calendar,
  Lightbulb,
  Video,
  Image,
  Radar,
  Zap,
  Archive,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Avatar } from '@/components/ui';

const nav = [
  {
    label: 'Geral',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/clientes', icon: Users, label: 'Clientes' },
      { href: '/produtos', icon: Package, label: 'Produtos' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/analise', icon: ChartBar, label: 'Análise IA' },
      { href: '/calendario', icon: Calendar, label: 'Calendário' },
      { href: '/ideias', icon: Lightbulb, label: 'Gerador de Ideias' },
      { href: '/roteiros', icon: Video, label: 'Roteiros' },
    ],
  },
  {
    label: 'Produção',
    items: [
      { href: '/artes', icon: Image, label: 'Artes com IA' },
      { href: '/radar', icon: Radar, label: 'Radar' },
      { href: '/acoes', icon: Zap, label: 'Próximas Ações' },
      { href: '/biblioteca', icon: Archive, label: 'Biblioteca' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { clienteAtivo } = useAppStore();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-100 bg-gray-50">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">ContentAI</p>
          <p className="text-xs text-gray-500">Central de Conteúdo</p>
        </div>
      </div>

      {/* Cliente ativo */}
      <Link
        href="/clientes"
        className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 hover:bg-gray-100 transition-colors"
      >
        {clienteAtivo ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar nome={clienteAtivo.nome} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-800">
                  {clienteAtivo.nome}
                </p>
                <p className="text-xs text-gray-500">{clienteAtivo.segmento}</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </>
        ) : (
          <p className="text-xs text-gray-500">Selecionar cliente</p>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {nav.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors mb-0.5',
                    active
                      ? 'bg-brand-50 text-brand-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
