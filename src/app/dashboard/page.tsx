'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, Calendar, Video, TrendingUp, Clock, Users, AlertTriangle, Zap } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getClientes, getAlertas } from '@/lib/firebase/db';
import type { Cliente, AlertaRadar } from '@/types';
import { Avatar } from '@/components/ui';

export default function DashboardPage() {
  const { clienteAtivo, setClienteAtivo } = useAppStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [alertas, setAlertas] = useState<AlertaRadar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const cs = await getClientes();
      setClientes(cs);
      if (clienteAtivo) {
        const als = await getAlertas(clienteAtivo.id);
        setAlertas(als.slice(0, 4));
      }
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  if (loading) return <LoadingSpinner text="Carregando dashboard..." />;

  const ativos = clientes.filter((c) => c.ativo).length;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">Clientes ativos</p>
          <p className="text-2xl font-semibold">{ativos}</p>
          <p className="text-xs text-gray-400">de {clientes.length} cadastrados</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">Posts gerados este mês</p>
          <p className="text-2xl font-semibold">348</p>
          <p className="text-xs text-gray-400">+12% vs mês anterior</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">Horas economizadas</p>
          <p className="text-2xl font-semibold">86h</p>
          <p className="text-xs text-gray-400">Estimativa do mês</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Alertas */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Alertas do radar
            </p>
            <Link href="/radar" className="text-xs text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {alertas.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Nenhum alerta"
              description={clienteAtivo ? 'Execute o radar para gerar alertas.' : 'Selecione um cliente para ver alertas.'}
            />
          ) : (
            <div className="space-y-2">
              {alertas.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-3"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-brand-800">{a.titulo}</p>
                    <p className="text-xs text-brand-600">{a.sugestao}</p>
                  </div>
                  {a.diasRestantes && (
                    <Badge variant="purple">{a.diasRestantes}d</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Clientes recentes */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Clientes
            </p>
            <Link href="/clientes" className="text-xs text-brand-600 hover:underline">
              Gerenciar
            </Link>
          </div>
          {clientes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente cadastrado"
              action={
                <Link href="/clientes">
                  <Button variant="primary" size="sm">Cadastrar cliente</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {clientes.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClienteAtivo(c)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50"
                >
                  <Avatar nome={c.nome} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-gray-500">{c.segmento}</p>
                  </div>
                  <Badge variant={c.ativo ? 'teal' : 'gray'}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Ações rápidas
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/ideias', icon: Lightbulb, label: 'Gerar ideias', desc: 'Novas ideias de posts', color: 'bg-brand-50 text-brand-600' },
            { href: '/calendario', icon: Calendar, label: 'Calendário do mês', desc: 'Planejar publicações', color: 'bg-teal-50 text-teal-600' },
            { href: '/roteiros', icon: Video, label: 'Criar roteiro', desc: 'Reels e vídeos', color: 'bg-amber-50 text-amber-600' },
            { href: '/analise', icon: TrendingUp, label: 'Analisar cliente', desc: 'Diagnóstico SWOT', color: 'bg-green-50 text-green-600' },
            { href: '/radar', icon: Clock, label: 'Rodar radar', desc: 'Oportunidades sazonais', color: 'bg-orange-50 text-orange-600' },
            { href: '/acoes', icon: Zap, label: 'Próximas ações', desc: 'Sugestões da IA', color: 'bg-purple-50 text-purple-600' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition-all hover:border-brand-200 hover:bg-brand-50/30"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
